export function normalizeProjectsResponse(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.projects) ? payload.projects : [];
}

export function getProjectId(project) {
  return project?.id ?? project?.project_id ?? project?.uuid ?? null;
}

export function resolveProjectActive(project) {
  if (typeof project?.is_active === "boolean") return project.is_active;
  return true;
}

function getProjectRawDate(project) {
  return (
    project?.updated_at ??
    project?.updatedAt ??
    project?.last_updated ??
    project?.created_at ??
    project?.createdAt ??
    null
  );
}

export function getProjectDateValue(project) {
  const raw = getProjectRawDate(project);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}