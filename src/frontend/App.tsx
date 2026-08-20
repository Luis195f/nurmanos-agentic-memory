import { useMemo, useState } from "react";

import { agentResponseSchema, type ActivityEvent } from "../shared/contracts";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "");
const SESSION_STORAGE_KEY = "nurmanos-h1-anonymous-session";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EXAMPLES = [
  {
    label: "Remember a handover lesson",
    text: "Remember this synthetic Aurora Demo Unit lesson: protect a ten-minute interruption-free handover period. Use memory key handover-focus and category handover.",
  },
  {
    label: "Recall the handover lesson",
    text: "What did Aurora Demo Unit learn about protecting handover time?",
  },
  {
    label: "Remember a callback owner",
    text: "Remember this synthetic Aurora Demo Unit lesson: assign one family-callback owner at the start of the shift. Use memory key callback-owner and category family-communication.",
  },
];

interface ChatMessage {
  role: "user" | "agent";
  text: string;
  memoryKeys?: string[];
}

function sessionId(): string {
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored && UUID_PATTERN.test(stored)) return stored;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export function App() {
  const session = useMemo(sessionId, []);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function submit(message: string) {
    const normalized = message.trim();
    if (!normalized || status === "loading") return;
    if (!API_BASE_URL) {
      setStatus("error");
      setError("The public agent endpoint is not configured.");
      return;
    }
    setDraft("");
    setError("");
    setStatus("loading");
    setMessages((current) => [...current, { role: "user", text: normalized }]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session,
          message: normalized,
          syntheticDataConfirmed: true,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const publicError =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(payload.error)
            : "The synthetic memory request could not be completed.";
        throw new Error(publicError);
      }
      const result = agentResponseSchema.parse(payload);
      setMessages((current) => [
        ...current,
        { role: "agent", text: result.answer, memoryKeys: result.memoryKeys },
      ]);
      setEvents(result.events);
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "The request could not be completed.",
      );
    }
  }

  function startNewConversation() {
    setMessages([]);
    setEvents([]);
    setError("");
    setStatus("idle");
    setDraft("");
  }

  return (
    <main>
      <header className="masthead">
        <a
          className="brand"
          href="#top"
          aria-label="NurManOS Agentic Memory home"
        >
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>NurManOS</span>
        </a>
        <div className="system-state">
          <span className="state-dot" aria-hidden="true" />
          Memory system online
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">Aurora Demo Unit · Agentic memory</div>
        <h1>Operational lessons that survive the conversation.</h1>
        <p className="hero-copy">
          Amazon Bedrock decides when to store or retrieve a lesson. CockroachDB
          keeps it durable, searchable, and isolated to this anonymous demo
          session.
        </p>
        <div className="safety-callout" role="note">
          <span aria-hidden="true">◆</span>
          <div>
            <strong>Synthetic demo data only</strong>
            <p>
              Do not enter real patient, employee, hospital, incident, contact,
              or account data. This is not clinical decision support.
            </p>
          </div>
        </div>
      </section>

      <section className="workspace" aria-label="Agentic memory demo">
        <div className="conversation-panel">
          <div className="panel-heading">
            <div>
              <p className="kicker">Conversation</p>
              <h2>Supervision memory agent</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={startNewConversation}
            >
              New conversation
            </button>
          </div>

          <div className="chat" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-orbit" aria-hidden="true" />
                <h3>Give the unit a lesson to remember</h3>
                <p>
                  Start with a curated synthetic prompt. Then refresh or begin a
                  new conversation and ask what the unit learned.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  className={`message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="message-role">
                    {message.role === "user" ? "You" : "Memory agent"}
                  </span>
                  <p>{message.text}</p>
                  {message.memoryKeys && message.memoryKeys.length > 0 && (
                    <div
                      className="memory-keys"
                      aria-label="Supporting memory keys"
                    >
                      {message.memoryKeys.map((key) => (
                        <code key={key}>{key}</code>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
            {status === "loading" && (
              <div className="thinking" role="status">
                <span /> <span /> <span /> Agent is deciding whether memory is
                needed
              </div>
            )}
          </div>

          <div className="examples" aria-label="Example prompts">
            {EXAMPLES.map((example) => (
              <button
                type="button"
                key={example.label}
                onClick={() => void submit(example.text)}
                disabled={status === "loading"}
              >
                {example.label}
              </button>
            ))}
          </div>

          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(draft);
            }}
          >
            <label htmlFor="message">Synthetic workflow message</label>
            <div className="composer-row">
              <textarea
                id="message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 600))}
                placeholder="Ask the agent to remember or retrieve a synthetic lesson…"
                rows={2}
                maxLength={600}
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={!draft.trim() || status === "loading"}
              >
                {status === "loading" ? "Working…" : "Send"}
              </button>
            </div>
            <div className="composer-meta">
              <span>Anonymous session persists in this browser</span>
              <span>{draft.length}/600</span>
            </div>
          </form>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </div>

        <aside className="activity-panel" aria-label="Sanitized agent activity">
          <div className="panel-heading">
            <div>
              <p className="kicker">Visible proof</p>
              <h2>Agent activity</h2>
            </div>
          </div>
          <div className="activity-summary">
            <div>
              <span>Decision</span>
              <strong>Bedrock Nova</strong>
            </div>
            <div>
              <span>Persistent memory</span>
              <strong>CockroachDB</strong>
            </div>
            <div>
              <span>Semantic signal</span>
              <strong>Titan · 1,024d</strong>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="activity-empty">
              <p>
                Tool events will appear here without raw prompts, vectors, SQL,
                or model reasoning.
              </p>
            </div>
          ) : (
            <ol className="timeline">
              {events.map((event, index) => (
                <li key={`${event.type}-${index}`}>
                  <span className="timeline-marker">{index + 1}</span>
                  <div>
                    <strong>{event.label}</strong>
                    {event.dimensions && (
                      <small>{event.dimensions} dimensions verified</small>
                    )}
                    {event.memoryKeys?.map((key) => (
                      <code key={key}>{key}</code>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="persistence-note">
            <span aria-hidden="true">↻</span>
            <p>
              <strong>Persistence boundary</strong>
              Refreshing or starting a new conversation keeps this browser’s
              anonymous session and its CockroachDB memories.
            </p>
          </div>
        </aside>
      </section>

      <footer>
        <span>
          Built for the CockroachDB × AWS Build with Agentic Memory hackathon
        </span>
        <span>Fictional environment · Aurora Demo Unit</span>
      </footer>
    </main>
  );
}
