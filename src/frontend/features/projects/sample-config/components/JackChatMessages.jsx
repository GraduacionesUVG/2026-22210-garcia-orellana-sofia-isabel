"use client";

import { useEffect, useMemo, useRef } from "react";
import ChatMarkdown from "@/features/projects/delimitation/components/ChatMarkdown";

function getMessageText(message) {
  if (!Array.isArray(message?.parts)) return "";

  return message.parts
    .filter((part) => part?.type === "text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("");
}

export default function JackChatMessages({
  chat,
  bootstrapping = false,
  loadError = "",
}) {
  const bottomRef = useRef(null);

  const rawMessages = chat?.messages;
  const status = chat?.status ?? "ready";
  const error = chat?.error ?? null;

  const visibleMessages = useMemo(() => {
    const messages = Array.isArray(rawMessages) ? rawMessages : [];

    return messages.filter((message) => {
      if (message?.role === "user") return true;
      return Boolean(getMessageText(message).trim());
    });
  }, [rawMessages]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(id);
  }, [visibleMessages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#FCFCFA] p-5 custom-scrollbar">
      {bootstrapping ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-serif leading-relaxed text-slate-600">
            Jack se activará cuando termine de cargar la fase de muestra.
          </p>
        </div>
      ) : null}

      {!bootstrapping && loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          No se pudo cargar el contexto de la muestra: {loadError}
        </div>
      ) : null}

      {!bootstrapping && !loadError && visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-[#005944]">
            Jack
          </p>
          <p className="text-xs font-serif leading-relaxed text-slate-600">
            Puedo ayudarte a revisar si tu enfoque, tu alcance, tus técnicas y
            tu tamaño de muestra son coherentes entre sí. Pregúntame y te
            responderé con guía socrática.
          </p>
        </div>
      ) : null}

      {!bootstrapping &&
        !loadError &&
        visibleMessages.map((message) => {
          const text = getMessageText(message);
          if (!text.trim()) return null;

          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl border px-4 py-3 shadow-sm ${
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
                  {isUser ? "Tú" : "Jack"}
                </div>

                {isUser ? (
                  <p className="whitespace-pre-wrap break-words text-xs font-serif leading-relaxed text-slate-700">
                    {text}
                  </p>
                ) : (
                  <ChatMarkdown content={text} />
                )}
              </div>
            </div>
          );
        })}

      {!bootstrapping && !loadError && isBusy ? (
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Jack
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

      {!bootstrapping && !loadError && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error?.message ||
            "Ocurrió un problema al hablar con Jack. Intenta de nuevo."}
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
