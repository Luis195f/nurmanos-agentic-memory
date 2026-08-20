-- H1-only schema. Run each schema statement as its own transaction in CockroachDB Cloud.
CREATE TABLE IF NOT EXISTS public.h1_supervisor_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  memory_key STRING NOT NULL CHECK (length(memory_key) BETWEEN 3 AND 64),
  content STRING NOT NULL CHECK (length(content) BETWEEN 8 AND 500),
  category STRING NOT NULL CHECK (category IN ('handover', 'family-communication', 'equipment-readiness', 'learning-review')),
  embedding VECTOR(1024) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{"synthetic": true}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT h1_session_memory_key_unique UNIQUE (session_id, memory_key),
  CONSTRAINT h1_synthetic_only CHECK (((metadata->>'synthetic')::BOOL) IS TRUE)
);

CREATE VECTOR INDEX IF NOT EXISTS h1_supervisor_memories_session_embedding_idx
  ON public.h1_supervisor_memories (session_id, embedding vector_cosine_ops);
