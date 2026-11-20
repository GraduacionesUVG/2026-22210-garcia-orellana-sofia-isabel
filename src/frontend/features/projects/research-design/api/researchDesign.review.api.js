import { requestJson } from "@/lib/api/http";

export async function getResearchDesignEvaluation(projectId) {
  const json = await requestJson(
    `/api/projects/${projectId}/research-design/evaluate`,
    {
      method: "GET",
      cache: "no-store",
    },
    "No se pudo evaluar el diseño de investigación."
  );

  return json?.data ?? null;
}

export async function generateResearchDesignReview(
  projectId,
  { focus = "full" } = {}
) {
  const json = await requestJson(
    `/api/projects/${projectId}/research-design/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ focus }),
    },
    "No se pudo revisar el diseño de investigación."
  );

  return json?.data ?? null;
}