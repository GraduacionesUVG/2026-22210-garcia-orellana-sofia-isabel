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

export default function JackChatMessages({ chat, loading = false }) {
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
    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-[#FCFCFA] p-5 space-y-4">
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-serif leading-relaxed text-slate-600">
            Jack se activará cuando termine de cargar el diseño de investigación.
          </p>
        </div>
      ) : null}

      {!loading && visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-[#005944]">
            Jack
          </p>
          <p className="text-xs font-serif leading-relaxed text-slate-600">
            Puedo ayudarte a afinar la pregunta de investigación, la coherencia
            con el objetivo general y la alineación de los objetivos
            específicos. Pregúntame y te responderé con guía socrática.
          </p>
        </div>
      ) : null}

      {!loading &&
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
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm border ${
                  isUser
                    ? "bg-[#005944]/10 border-[#005944]/20"
                    : "bg-white border-slate-200"
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
                  <p className="text-xs font-serif leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                    {text}
                  </p>
                ) : (
                  <ChatMarkdown content={text} />
                )}
              </div>
            </div>
          );
        })}

      {!loading && isBusy ? (
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl px-4 py-3 shadow-sm border bg-white border-slate-200">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Jack
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span
                className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error?.message ||
            "Ocurrió un problema al hablar con Jack. Intenta de nuevo."}
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
