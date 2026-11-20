import { requestJson } from "@/lib/api/http";

export async function generateSampleConfigReview(
  projectId,
  { focus = "full" } = {}
) {
  const json = await requestJson(
    `/api/projects/${projectId}/sample-config/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ focus }),
    },
    "No se pudo revisar la configuración de muestra."
  );

  return json?.data ?? null;
}