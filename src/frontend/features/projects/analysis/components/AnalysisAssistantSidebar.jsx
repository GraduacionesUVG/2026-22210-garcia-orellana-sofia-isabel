"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Icon from "@/components/common/Icon";
import ChatMarkdown from "@/features/projects/delimitation/components/ChatMarkdown";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import AssistantSidebarContainer from "@/features/projects/workspace/components/AssistantSidebarContainer";
import JackSidebarFrame from "@/features/projects/workspace/components/JackSidebarFrame";

const ANALYSIS_VISUAL_EVENT = "analysis:visual-focus";

function getMessageText(message) {
  if (!Array.isArray(message?.parts)) return "";

  return message.parts
    .filter((part) => part?.type === "text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("");
}

function sanitizeVisualForChat(visual) {
  if (!visual) return undefined;

  return {
    id: visual.id,
    title: visual.title,
    prompt: visual.prompt,
    summary: visual.summary,
    metrics: visual.metrics,
    evidence: Array.isArray(visual.evidence)
      ? visual.evidence.slice(0, 12)
      : [],
    targets: Array.isArray(visual.targets)
      ? visual.targets.slice(0, 12)
      : [],
  };
}

function MessageList({ chat, showVisualContext = true }) {
  const bottomRef = useRef(null);
  const status = chat?.status ?? "ready";
  const error = chat?.error ?? null;
  const isBusy = status === "submitted" || status === "streaming";

  const messages = Array.isArray(chat?.messages) ? chat.messages : [];
  const visibleMessages = messages.filter((message) => {
    if (message?.role === "user") return true;
    return Boolean(getMessageText(message).trim());
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(id);
  }, [visibleMessages, status]);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#FCFCFA] p-4">
      {visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[#005944]">
            <Icon name="smart_toy" className="text-lg" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Jack AI
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {showVisualContext
              ? "Selecciona Discutir en un visual. Después haz una pregunta y usaré los datos de ese visual para ayudarte a construir una interpretación."
              : "Escribe una pregunta sobre tus memos o hallazgos y Jack AI te ayudará a conectar la interpretación con la evidencia."}
          </p>
        </div>
      ) : null}

      {visibleMessages.map((message) => {
        const text = getMessageText(message);
        if (!text.trim()) return null;
        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl border px-4 py-3 ${
                isUser
                  ? "border-[#005944]/20 bg-[#005944]/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                  isUser ? "text-[#005944]" : "text-slate-400"
                }`}
              >
                {isUser ? "Tú" : "Jack AI"}
              </div>
              {isUser ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {text}
                </p>
              ) : (
                <ChatMarkdown content={text} />
              )}
            </div>
          </div>
        );
      })}

      {isBusy ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Jack AI
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error?.message ||
            "Ocurrió un problema al hablar con Jack. Intenta de nuevo."}
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

function ChatInput({ chat, activeVisual, showVisualContext = true }) {
  const [input, setInput] = useState("");
  const status = chat?.status ?? "ready";
  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || !chat?.sendMessage) return;

    chat.sendMessage(
      { text: trimmed },
      { body: { visualContext: sanitizeVisualForChat(activeVisual) } }
    );
    setInput("");
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-[#F2F1E9] p-4">
      {showVisualContext ? (
        <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            Contexto para Jack AI
          </p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">
            {activeVisual
              ? `Ahorita vas a contextualizar a Jack AI sobre el visual de ${activeVisual.title}.`
              : "Selecciona Discutir en un visual para contextualizar a Jack AI."}
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 pr-12 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#005944] focus:ring-1 focus:ring-[#005944] disabled:bg-slate-50"
          placeholder="Escribe tu interpretación o duda..."
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          disabled={false}
        />

        {isBusy ? (
          <button
            className="absolute bottom-3 right-3 text-slate-500 transition-colors hover:text-[#005944]"
            type="button"
            title="Detener"
            onClick={() => chat?.stop?.()}
          >
            <Icon name="stop_circle" className="text-xl" />
          </button>
        ) : (
          <button
            className="absolute bottom-3 right-3 text-[#005944] disabled:text-slate-300"
            type="submit"
            title="Enviar"
            disabled={!input.trim()}
          >
            <Icon name="send" className="text-xl" />
          </button>
        )}
      </form>
    </div>
  );
}

export default function AnalysisAssistantSidebar({ showVisualContext = true }) {
  const { projectId } = useAnalysisContext();
  const [activeVisual, setActiveVisual] = useState(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/analysis/chat`,
        prepareSendMessagesRequest: ({ id, messages, body }) => ({
          body: {
            id,
            messages,
            ...body,
          },
        }),
      }),
    [projectId]
  );

  const chat = useChat({ transport });

  useEffect(() => {
    function handleVisualFocus(event) {
      setActiveVisual(event.detail);
    }

    window.addEventListener(ANALYSIS_VISUAL_EVENT, handleVisualFocus);
    return () =>
      window.removeEventListener(ANALYSIS_VISUAL_EVENT, handleVisualFocus);
  }, []);

  function clearChat() {
    chat?.stop?.();
    chat?.setMessages?.([]);
  }

  return (
    <AssistantSidebarContainer>
      <JackSidebarFrame
        title="Chat de análisis"
        description="Discusión socrática conectada a los visuales del dashboard."
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                  {showVisualContext ? "Visual activo" : "Asistente de análisis"}
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-950">
                  {showVisualContext
                    ? activeVisual?.title || "Ninguno seleccionado"
                    : "Memos y hallazgos"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {showVisualContext
                    ? activeVisual?.prompt ||
                      "Usa el botón Discutir en un visual para enfocar la conversación."
                    : "Conecta tus interpretaciones con la evidencia del proyecto."}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-[#005944] disabled:opacity-40"
                onClick={clearChat}
                disabled={!chat?.messages?.length}
                title="Limpiar chat"
              >
                <Icon name="delete_sweep" className="text-lg" />
              </button>
            </div>
          </div>

          <MessageList chat={chat} showVisualContext={showVisualContext} />
          <ChatInput
            chat={chat}
            activeVisual={activeVisual}
            showVisualContext={showVisualContext}
          />
        </div>
      </JackSidebarFrame>
    </AssistantSidebarContainer>
  );
}
