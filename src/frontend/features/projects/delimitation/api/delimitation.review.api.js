import { requestJson } from "@/lib/api/http";

function normalizeCriteriaItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item.text === "string") return item.text.trim();
      return "";
    })
    .filter(Boolean);
}

function normalizeDraft(model = {}) {
  return {
    topic: String(model?.topic ?? "").trim(),
    context_place: String(model?.context_place ?? "").trim(),
    time_period: String(model?.time_period ?? "").trim(),
    population: String(model?.population ?? "").trim(),
    resources: String(model?.resources ?? "").trim(),
    include: normalizeCriteriaItems(model?.include),
    exclude: normalizeCriteriaItems(model?.exclude),
  };
}

function normalizeHeuristics(heuristics = {}) {
  return {
    totalHighlights:
      typeof heuristics?.totalHighlights === "number"
        ? heuristics.totalHighlights
        : 0,
    jackQuestion: String(heuristics?.jackQuestion ?? "").trim(),
    signals: Array.isArray(heuristics?.signals)
      ? heuristics.signals.slice(0, 4).map((signal) => ({
          field: String(signal?.field ?? "").trim(),
          level: String(signal?.level ?? "").trim(),
          text: String(signal?.text ?? "").trim(),
        }))
      : [],
  };
}

export async function evaluateDelimitationReview(projectId, { model, heuristics }) {
  const json = await requestJson(
    `/api/projects/${projectId}/delimitation/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        draft: normalizeDraft(model),
        heuristics: normalizeHeuristics(heuristics),
      }),
    },
    "No se pudo evaluar la delimitación."
  );

  return json?.review ?? null;
}