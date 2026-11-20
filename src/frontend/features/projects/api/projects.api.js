import { requestJson } from "@/lib/api/http";
import { getProjectId } from "@/features/projects/helpers/project.helpers";

export async function fetchProjects() {
  return requestJson("/api/projects", { cache: "no-store" }, "Error cargando proyectos.");
}

export async function fetchCurrentUser() {
  return requestJson("/api/users/me", { cache: "no-store" }, "Error cargando usuario.");
}

export async function createProject(input) {
  const json = await requestJson(
    "/api/projects",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "No se pudo crear el proyecto."
  );

  return json?.project ?? json;
}

export async function updateProject(project, input) {
  const id = getProjectId(project);
  if (!id) throw new Error("No se encontró el id del proyecto.");

  const json = await requestJson(
    `/api/projects/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "No se pudo actualizar el proyecto."
  );

  return json?.project ?? json;
}

export async function deleteProject(project) {
  const id = getProjectId(project);
  if (!id) throw new Error("No se encontró el id del proyecto.");

  return requestJson(
    `/api/projects/${id}`,
    { method: "DELETE" },
    "No se pudo eliminar el proyecto."
  );
}