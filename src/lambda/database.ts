import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Pool, type PoolClient } from "pg";
import { z } from "zod";

import type {
  RetrieveMemoriesInput,
  StoreMemoryInput,
} from "../shared/contracts";

const secretSchema = z
  .object({
    host: z.string().min(1),
    port: z.number().int().positive().default(26257),
    database: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    ca: z.string().min(1),
  })
  .strict();

export interface StoredMemory {
  memoryKey: string;
  category: string;
  content: string;
}

export interface MemoryDatabase {
  store(input: StoreMemoryInput, embedding: number[]): Promise<StoredMemory>;
  retrieve(
    input: RetrieveMemoriesInput,
    embedding: number[],
  ): Promise<StoredMemory[]>;
}

function vectorLiteral(embedding: number[]): string {
  if (
    embedding.length !== 1024 ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Invalid embedding");
  }
  return `[${embedding.join(",")}]`;
}

let poolPromise: Promise<Pool> | undefined;

async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const secretArn = process.env.DATABASE_SECRET_ARN;
      if (!secretArn) throw new Error("Database configuration unavailable");
      const response = await new SecretsManagerClient({}).send(
        new GetSecretValueCommand({ SecretId: secretArn }),
      );
      if (!response.SecretString)
        throw new Error("Database configuration unavailable");
      const secret = secretSchema.parse(JSON.parse(response.SecretString));
      return new Pool({
        host: secret.host,
        port: secret.port,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        max: 2,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 20_000,
        application_name: "nurmanos-h1-agent-memory",
        ssl: {
          ca: secret.ca,
          rejectUnauthorized: true,
          servername: secret.host,
        },
      });
    })();
  }
  return poolPromise;
}

async function rollbackQuietly(client: PoolClient): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch {
    // The original failure remains the useful diagnostic; logs never include SQL values.
  }
}

export class CockroachMemoryDatabase implements MemoryDatabase {
  async store(
    input: StoreMemoryInput,
    embedding: number[],
  ): Promise<StoredMemory> {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
        memory_key: string;
        category: string;
        content: string;
      }>(
        `INSERT INTO public.h1_supervisor_memories
          (session_id, memory_key, content, category, embedding, metadata)
         VALUES ($1::UUID, $2, $3, $4, $5::VECTOR, $6::JSONB)
         ON CONFLICT (session_id, memory_key) DO UPDATE SET
           content = excluded.content,
           category = excluded.category,
           embedding = excluded.embedding,
           metadata = excluded.metadata,
           updated_at = now()
         RETURNING memory_key, category, content`,
        [
          input.sessionId,
          input.memoryKey,
          input.content,
          input.category,
          vectorLiteral(embedding),
          JSON.stringify({
            synthetic: true,
            unit: "Aurora Demo Unit",
            embeddingModel: "titan-v2",
          }),
        ],
      );
      const row = result.rows[0];
      if (!row) throw new Error("Memory write failed");
      const readBack = await client.query<{ memory_key: string }>(
        `SELECT memory_key FROM public.h1_supervisor_memories
         WHERE session_id = $1::UUID AND memory_key = $2`,
        [input.sessionId, input.memoryKey],
      );
      if (readBack.rows[0]?.memory_key !== input.memoryKey)
        throw new Error("Memory read-back failed");
      await client.query("COMMIT");
      return {
        memoryKey: row.memory_key,
        category: row.category,
        content: row.content,
      };
    } catch (error) {
      await rollbackQuietly(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async retrieve(
    input: RetrieveMemoriesInput,
    embedding: number[],
  ): Promise<StoredMemory[]> {
    const pool = await getPool();
    const result = await pool.query<{
      memory_key: string;
      category: string;
      content: string;
    }>(
      `SELECT memory_key, category, content
       FROM public.h1_supervisor_memories
       WHERE session_id = $1::UUID
       ORDER BY embedding <=> $2::VECTOR
       LIMIT $3`,
      [input.sessionId, vectorLiteral(embedding), input.limit],
    );
    return result.rows.map((row) => ({
      memoryKey: row.memory_key,
      category: row.category,
      content: row.content,
    }));
  }
}
