import { requestJson } from "@/lib/api/http";

export function getProjectWorkflowApiHref(projectId) {
  return `/api/projects/${encodeURIComponent(String(projectId))}/workflow`;
}

export async function getProjectWorkflow(projectId, signal) {
  return requestJson(
    getProjectWorkflowApiHref(projectId),
    { cache: "no-store", signal },
    "No se pudo cargar el avance del proyecto."
  );
}
