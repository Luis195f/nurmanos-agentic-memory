import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  Languages,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { agentResponseSchema, type ActivityEvent } from "../shared/contracts";
import {
  createMemoryClient,
  type AppMode,
  type ServiceHealth,
} from "./memory-client";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "");
const ENV_APP_MODE = import.meta.env.VITE_APP_MODE as AppMode | undefined;
const SESSION_STORAGE_KEY = "nurmanos-h1-anonymous-session";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Language = "en" | "es";

export interface AppProps {
  appMode?: AppMode;
  apiBaseUrl?: string;
}

const COPY = {
  en: {
    statusChecking: "Checking memory service",
    statusOnline: "Memory service online",
    statusOffline: "Memory service unavailable",
    statusLocal: "Local demo active",
    localDisclosure:
      "Local demo mode — data remains only in this browser. AWS and CockroachDB are disabled.",
    eyebrow: "Aurora Demo Unit · Synthetic workspace",
    title: "Turn operational lessons into shared memory.",
    intro:
      "Record a fictional workplace lesson, start a fresh conversation, and ask the agent to bring the right memory back.",
    safetyTitle: "Synthetic demo data only",
    safetyBody:
      "Never enter real patient, employee, hospital, incident, contact, account, or institutional information. This is not clinical decision support.",
    conversation: "Workspace",
    workspaceAria: "Agentic memory workspace",
    examplesAria: "Safe example prompts",
    supportingKeysAria: "Supporting memory keys",
    receiptAria: "Sanitized activity receipt",
    agentTitle: "Operational memory agent",
    newConversation: "New conversation",
    resetDemo: "Restore demo examples",
    resetConfirmed: "Synthetic local examples restored.",
    emptyTitle: "What should Aurora remember?",
    emptyBody:
      "Choose a safe example or write one fictional operational lesson below.",
    examples: [
      {
        label: "Remember a hydration lesson",
        text: "Remember this synthetic Aurora Demo Unit lesson: offering a labelled hydration bottle during the activity transition improved participation. Use memory key hydration-transition and category learning-review.",
      },
      {
        label: "Ask about hydration",
        text: "What did we learn about hydration during transitions?",
      },
      {
        label: "Remember a handover lesson",
        text: "Remember this synthetic Aurora Demo Unit lesson: protect a ten-minute interruption-free handover period. Use memory key handover-focus and category handover.",
      },
    ],
    messageLabel: "Fictional operational lesson or question",
    placeholder: "Ask the agent to remember or retrieve a synthetic lesson…",
    persistentSession: "New conversations keep this anonymous workspace",
    send: "Send",
    working: "Working",
    deciding: "The agent is choosing a safe memory action",
    proof: "Transparent by design",
    proofTitle: "What happened",
    proofEmpty:
      "After a real request, this panel shows a sanitized receipt—never prompts, vectors, SQL, credentials, or private reasoning.",
    technicalShow: "Show technical evidence",
    technicalHide: "Hide technical evidence",
    decision: "Decision",
    persistentMemory: "Persistent memory",
    semanticSignal: "Retrieval method",
    localDecision: "Deterministic local rules",
    localPersistence: "Browser localStorage",
    localSearch: "Text matching (not vector search)",
    persistenceTitle: "Persistence confirmed",
    persistenceBody:
      "This browser workspace survives refreshes and new conversations.",
    operationStore: "Store memory",
    operationRetrieve: "Retrieve memories",
    outcomeStored: "Stored",
    outcomeUpdated: "Updated",
    outcomeRetrieved: "Retrieved",
    result: "result",
    results: "results",
    similarity: "match",
    duration: "Approx. duration",
    success: "The request completed with sanitized evidence.",
    footerPrimary: "Experimental operational-memory platform",
    footerSecondary: "Fictional environment · Aurora Demo Unit",
    languageAction: "Cambiar a español",
    eventLabels: {
      tool_requested: "A bounded memory operation was selected",
      input_validated: "Input passed the synthetic-data contract",
      embedding_created: "The configured service created an embedding",
      memory_stored: "The configured store committed the synthetic memory",
      vector_retrieval: "The configured service ranked vector results",
      local_text_retrieval: "Browser memories were ranked by textual overlap",
      final_response: "A grounded response was returned",
    },
  },
  es: {
    statusChecking: "Comprobando el servicio de memoria",
    statusOnline: "Servicio de memoria disponible",
    statusOffline: "Servicio de memoria no disponible",
    statusLocal: "Demo local activa",
    localDisclosure:
      "Modo demo local — los datos permanecen únicamente en este navegador. AWS y CockroachDB están desactivados.",
    eyebrow: "Aurora Demo Unit · Espacio sintético",
    title: "Convierte las lecciones operativas en memoria compartida.",
    intro:
      "Registra una lección laboral ficticia, inicia una conversación nueva y pide al agente que recupere la memoria adecuada.",
    safetyTitle: "Solo datos sintéticos de demostración",
    safetyBody:
      "Nunca introduzcas información real de pacientes, trabajadores, hospitales, incidentes, contactos, cuentas o instituciones. No es apoyo a la decisión clínica.",
    conversation: "Espacio de trabajo",
    workspaceAria: "Espacio de memoria del agente",
    examplesAria: "Ejemplos seguros",
    supportingKeysAria: "Claves de memoria que fundamentan la respuesta",
    receiptAria: "Recibo sanitizado de actividad",
    agentTitle: "Agente de memoria operativa",
    newConversation: "Nueva conversación",
    resetDemo: "Restaurar ejemplos",
    resetConfirmed: "Ejemplos sintéticos locales restaurados.",
    emptyTitle: "¿Qué debe recordar Aurora?",
    emptyBody:
      "Elige un ejemplo seguro o escribe abajo una única lección operativa ficticia.",
    examples: [
      {
        label: "Recordar una lección de hidratación",
        text: "Recuerda esta lección sintética de Aurora Demo Unit: ofrecer una botella de hidratación etiquetada durante la transición de actividad mejoró la participación. Usa la clave hydration-transition y la categoría learning-review.",
      },
      {
        label: "Preguntar por hidratación",
        text: "¿Qué aprendimos sobre la hidratación durante las transiciones?",
      },
      {
        label: "Recordar una lección de relevo",
        text: "Recuerda esta lección sintética de Aurora Demo Unit: protege diez minutos sin interrupciones para el relevo. Usa la clave handover-focus y la categoría handover.",
      },
    ],
    messageLabel: "Lección operativa ficticia o pregunta",
    placeholder: "Pide al agente recordar o recuperar una lección sintética…",
    persistentSession:
      "Las conversaciones nuevas conservan este espacio anónimo",
    send: "Enviar",
    working: "Procesando",
    deciding: "El agente está eligiendo una acción de memoria segura",
    proof: "Transparencia por diseño",
    proofTitle: "Qué ha ocurrido",
    proofEmpty:
      "Tras una solicitud real, este panel muestra un recibo sanitizado: nunca prompts, vectores, SQL, credenciales ni razonamiento privado.",
    technicalShow: "Mostrar evidencia técnica",
    technicalHide: "Ocultar evidencia técnica",
    decision: "Decisión",
    persistentMemory: "Memoria persistente",
    semanticSignal: "Método de recuperación",
    localDecision: "Reglas locales deterministas",
    localPersistence: "localStorage del navegador",
    localSearch: "Coincidencia textual (no vectorial)",
    persistenceTitle: "Persistencia confirmada",
    persistenceBody:
      "Este espacio del navegador sobrevive a recargas y conversaciones nuevas.",
    operationStore: "Guardar memoria",
    operationRetrieve: "Recuperar memorias",
    outcomeStored: "Almacenada",
    outcomeUpdated: "Actualizada",
    outcomeRetrieved: "Recuperadas",
    result: "resultado",
    results: "resultados",
    similarity: "coincidencia",
    duration: "Duración aproximada",
    success: "La solicitud terminó con evidencia sanitizada.",
    footerPrimary: "Plataforma experimental de memoria operativa",
    footerSecondary: "Entorno ficticio · Aurora Demo Unit",
    languageAction: "Switch to English",
    eventLabels: {
      tool_requested: "Se seleccionó una operación de memoria acotada",
      input_validated: "La entrada superó el contrato de datos sintéticos",
      embedding_created: "El servicio configurado creó una representación",
      memory_stored: "El almacén configurado confirmó la memoria sintética",
      vector_retrieval: "El servicio configurado ordenó resultados vectoriales",
      local_text_retrieval:
        "Las memorias del navegador se ordenaron por coincidencia textual",
      final_response: "Se devolvió una respuesta fundamentada",
    },
  },
} as const;

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

function outcomeEvent(events: ActivityEvent[]): ActivityEvent | undefined {
  return [...events].reverse().find((event) => event.outcome);
}

function configuredMode(): AppMode {
  if (ENV_APP_MODE === "local-demo" || import.meta.env.MODE === "local-demo") {
    return "local-demo";
  }
  return ENV_APP_MODE === "aws" ? "aws" : "disabled";
}

export function App({
  appMode = configuredMode(),
  apiBaseUrl = API_BASE_URL,
}: AppProps) {
  const session = useMemo(sessionId, []);
  const client = useMemo(
    () => createMemoryClient(appMode, apiBaseUrl),
    [apiBaseUrl, appMode],
  );
  const [language, setLanguage] = useState<Language>(
    appMode === "local-demo" ? "es" : "en",
  );
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [showTechnical, setShowTechnical] = useState(false);
  const [health, setHealth] = useState<ServiceHealth | "checking">("checking");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const copy = COPY[language];
  const receipt = outcomeEvent(events);
  const isLocalDemo = client.mode === "local-demo";

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    void client
      .checkHealth(controller.signal)
      .then(setHealth)
      .catch(() => setHealth("offline"))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [client]);

  async function submit(message: string) {
    const normalized = message.trim();
    if (!normalized || status === "loading") return;
    setDraft("");
    setError("");
    setStatus("loading");
    setMessages((current) => [...current, { role: "user", text: normalized }]);
    try {
      const result = agentResponseSchema.parse(
        await client.submit({
          sessionId: session,
          message: normalized,
          syntheticDataConfirmed: true,
        }),
      );
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
          : language === "es"
            ? "No se pudo completar la solicitud."
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

  function resetDemo() {
    client.resetDemo?.(session);
    startNewConversation();
    setStatus("success");
    setMessages([{ role: "agent", text: copy.resetConfirmed }]);
  }

  function operationLabel(operation: ActivityEvent["operation"]): string {
    return operation === "store" ? copy.operationStore : copy.operationRetrieve;
  }

  function outcomeLabel(outcome: ActivityEvent["outcome"]): string {
    if (outcome === "stored") return copy.outcomeStored;
    if (outcome === "updated") return copy.outcomeUpdated;
    return copy.outcomeRetrieved;
  }

  const healthLabel =
    health === "local"
      ? copy.statusLocal
      : health === "online"
        ? copy.statusOnline
        : health === "offline"
          ? copy.statusOffline
          : copy.statusChecking;

  return (
    <main>
      <header className="masthead">
        <a className="brand" href="#top" aria-label="NurManOS Agentic Memory">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>NurManOS</span>
        </a>
        <div className="header-actions">
          <button
            className="language-button"
            type="button"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            aria-label={copy.languageAction}
          >
            <Languages size={16} aria-hidden="true" />
            {language === "en" ? "ES" : "EN"}
          </button>
          <div className={`system-state ${health}`} role="status">
            {health === "online" || health === "local" ? (
              <Wifi size={15} aria-hidden="true" />
            ) : (
              <WifiOff size={15} aria-hidden="true" />
            )}
            <span>{healthLabel}</span>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">{copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p className="hero-copy">{copy.intro}</p>
        {isLocalDemo && (
          <div className="local-disclosure" role="status">
            <Database size={20} aria-hidden="true" />
            <strong>{copy.localDisclosure}</strong>
          </div>
        )}
        <div className="safety-callout" role="note">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <strong>{copy.safetyTitle}</strong>
            <p>{copy.safetyBody}</p>
          </div>
        </div>
      </section>

      <section className="workspace" aria-label={copy.workspaceAria}>
        <div className="conversation-panel">
          <div className="panel-heading">
            <div>
              <p className="kicker">{copy.conversation}</p>
              <h2>{copy.agentTitle}</h2>
            </div>
            <div className="conversation-actions">
              <button
                className="text-button"
                type="button"
                onClick={startNewConversation}
              >
                <Plus size={16} aria-hidden="true" />
                {copy.newConversation}
              </button>
              {isLocalDemo && (
                <button
                  className="text-button"
                  type="button"
                  onClick={resetDemo}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {copy.resetDemo}
                </button>
              )}
            </div>
          </div>

          <div
            className="chat"
            aria-live="polite"
            aria-busy={status === "loading"}
          >
            {messages.length === 0 ? (
              <div className="empty-state">
                <BrainCircuit size={32} aria-hidden="true" />
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyBody}</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  className={`message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="message-role">
                    {message.role === "user"
                      ? language === "es"
                        ? "Tú"
                        : "You"
                      : language === "es"
                        ? "Agente de memoria"
                        : "Memory agent"}
                  </span>
                  <p>{message.text}</p>
                  {message.memoryKeys && message.memoryKeys.length > 0 && (
                    <div
                      className="memory-keys"
                      aria-label={copy.supportingKeysAria}
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
                <Sparkles size={17} aria-hidden="true" />
                <span>{copy.deciding}</span>
              </div>
            )}
          </div>

          <div className="examples" aria-label={copy.examplesAria}>
            {copy.examples.map((example) => (
              <button
                type="button"
                key={example.label}
                onClick={() => setDraft(example.text)}
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
            <label htmlFor="message">{copy.messageLabel}</label>
            <div className="composer-row">
              <textarea
                id="message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 600))}
                placeholder={copy.placeholder}
                rows={3}
                maxLength={600}
                disabled={status === "loading"}
              />
              <button
                className="send-button"
                type="submit"
                disabled={!draft.trim() || status === "loading"}
              >
                <Send size={17} aria-hidden="true" />
                {status === "loading" ? copy.working : copy.send}
              </button>
            </div>
            <div className="composer-meta">
              <span>{copy.persistentSession}</span>
              <span>{draft.length}/600</span>
            </div>
          </form>
          {status === "success" && (
            <div className="success-banner" role="status">
              <CheckCircle2 size={17} aria-hidden="true" />
              {copy.success}
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <AlertTriangle size={17} aria-hidden="true" />
              {error}
            </div>
          )}
        </div>

        <aside className="activity-panel" aria-label={copy.receiptAria}>
          <div className="panel-heading">
            <div>
              <p className="kicker">{copy.proof}</p>
              <h2>{copy.proofTitle}</h2>
            </div>
            <Activity size={21} aria-hidden="true" />
          </div>

          {receipt ? (
            <div className="receipt-card">
              <div className="receipt-icon" aria-hidden="true">
                {receipt.operation === "store" ? (
                  <Database size={22} />
                ) : (
                  <RotateCcw size={22} />
                )}
              </div>
              <div>
                <span>{operationLabel(receipt.operation)}</span>
                <strong>{outcomeLabel(receipt.outcome)}</strong>
              </div>
              {receipt.resultCount !== undefined && (
                <div className="receipt-metric">
                  <strong>{receipt.resultCount}</strong>
                  <span>
                    {receipt.resultCount === 1 ? copy.result : copy.results}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="activity-empty">
              <ShieldCheck size={26} aria-hidden="true" />
              <p>{copy.proofEmpty}</p>
            </div>
          )}

          {receipt?.memoryKeys && receipt.memoryKeys.length > 0 && (
            <div className="receipt-details">
              {receipt.memoryKeys.map((key, index) => (
                <div className="receipt-memory" key={key}>
                  <div>
                    <span>{receipt.categories?.[index] ?? "memory"}</span>
                    <code>{key}</code>
                  </div>
                  {receipt.similarities?.[index] !== undefined && (
                    <strong>
                      {Math.round(receipt.similarities[index]! * 100)}%{" "}
                      {copy.similarity}
                    </strong>
                  )}
                </div>
              ))}
              {receipt.durationMs !== undefined && (
                <p className="duration-note">
                  {copy.duration}: {receipt.durationMs} ms
                </p>
              )}
            </div>
          )}

          <button
            className="technical-toggle"
            type="button"
            onClick={() => setShowTechnical((current) => !current)}
            aria-expanded={showTechnical}
          >
            {showTechnical ? copy.technicalHide : copy.technicalShow}
            <ChevronDown size={17} aria-hidden="true" />
          </button>

          {showTechnical && (
            <div className="technical-content">
              <div className="activity-summary">
                <div>
                  <span>{copy.decision}</span>
                  <strong>
                    {isLocalDemo ? copy.localDecision : "Amazon Bedrock Nova"}
                  </strong>
                </div>
                <div>
                  <span>{copy.persistentMemory}</span>
                  <strong>
                    {isLocalDemo ? copy.localPersistence : "CockroachDB"}
                  </strong>
                </div>
                <div>
                  <span>{copy.semanticSignal}</span>
                  <strong>
                    {isLocalDemo ? copy.localSearch : "Titan V2 · 1,024d"}
                  </strong>
                </div>
              </div>
              {events.length > 0 && (
                <ol className="timeline">
                  {events.map((event, index) => (
                    <li key={`${event.type}-${index}`}>
                      <span className="timeline-marker">{index + 1}</span>
                      <div>
                        <strong>{copy.eventLabels[event.type]}</strong>
                        {event.durationMs !== undefined && (
                          <small>{event.durationMs} ms</small>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <div className="persistence-note">
            <Database size={18} aria-hidden="true" />
            <p>
              <strong>{copy.persistenceTitle}</strong>
              {copy.persistenceBody}
            </p>
          </div>
        </aside>
      </section>

      <footer>
        <span>{copy.footerPrimary}</span>
        <span>{copy.footerSecondary}</span>
      </footer>
    </main>
  );
}
