"use client";

import { useState } from "react";
import Icon from "@/components/common/Icon";

export default function JackChatInput({ chat }) {
  const [input, setInput] = useState("");

  const status = chat?.status ?? "ready";
  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || !chat?.sendMessage) return;

    chat.sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-[#F2F1E9] p-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          className="w-full rounded-full border-slate-200 bg-white py-2.5 pl-4 pr-12 text-[11px] placeholder:text-slate-400 focus:border-[#005944] focus:ring-1 focus:ring-[#005944] disabled:bg-slate-50"
          placeholder="Pregunta a Jack sobre tu muestra..."
          type="text"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          disabled={false}
        />

        {isBusy ? (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-[#005944]"
            type="button"
            title="Detener"
            onClick={() => chat?.stop?.()}
          >
            <Icon name="stop_circle" className="text-lg" />
          </button>
        ) : (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#005944] disabled:text-slate-300"
            type="submit"
            title="Enviar"
            disabled={!input.trim()}
          >
            <Icon name="send" className="text-lg" />
          </button>
        )}
      </form>
    </div>
  );
}
