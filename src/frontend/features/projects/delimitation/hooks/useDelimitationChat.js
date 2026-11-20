"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

function sanitizeDraft(model = {}) {
  return {
    topic: model?.topic ?? "",
    context_place: model?.context_place ?? "",
    time_period: model?.time_period ?? "",
    population: model?.population ?? "",
    resources: model?.resources ?? "",
    include: Array.isArray(model?.include) ? model.include : [],
    exclude: Array.isArray(model?.exclude) ? model.exclude : [],
  };
}

function sanitizeHeuristics(heuristics = {}) {
  return {
    totalHighlights:
      typeof heuristics?.totalHighlights === "number"
        ? heuristics.totalHighlights
        : 0,
    jackQuestion: heuristics?.jackQuestion ?? "",
    signals: Array.isArray(heuristics?.signals)
      ? heuristics.signals.slice(0, 4).map((signal) => ({
          field: signal?.field ?? "",
          level: signal?.level ?? "",
          text: signal?.text ?? "",
        }))
      : [],
  };
}

export function useDelimitationChat({ projectId, model, heuristics }) {
  const latestDraftRef = useRef(sanitizeDraft(model));
  const latestHeuristicsRef = useRef(sanitizeHeuristics(heuristics));

  useEffect(() => {
    latestDraftRef.current = sanitizeDraft(model);
  }, [model]);

  useEffect(() => {
    latestHeuristicsRef.current = sanitizeHeuristics(heuristics);
  }, [heuristics]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/delimitation/chat`,
        prepareSendMessagesRequest: ({ id, messages }) => {
          return {
            body: {
              id,
              messages,
              draft: latestDraftRef.current,
              heuristics: latestHeuristicsRef.current,
            },
          };
        },
      }),
    [projectId]
  );

  return useChat({
    transport,
  });
}