function buildError(message, status = 500, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

async function readJson(res) {
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.ok === false) {
    throw buildError(
      json?.error || "Ocurrió un error procesando la solicitud.",
      res.status,
      json?.details ?? null
    );
  }

  return json;
}

export async function fetchDelimitationVersions(projectId) {
  const res = await fetch(`/api/projects/${projectId}/delimitation/versions`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await readJson(res);
  return json?.versions ?? [];
}

export async function createDelimitationVersion(projectId, payload = {}) {
  const res = await fetch(`/api/projects/${projectId}/delimitation/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      label: payload?.label ?? null,
    }),
  });

  const json = await readJson(res);
  return json?.data ?? null;
}

export async function fetchDelimitationVersionDetail(projectId, versionId) {
  const res = await fetch(
    `/api/projects/${projectId}/delimitation/versions/${versionId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const json = await readJson(res);
  return json?.data ?? null;
}

export async function restoreDelimitationVersion(projectId, versionId) {
  const res = await fetch(
    `/api/projects/${projectId}/delimitation/versions/${versionId}/restore`,
    {
      method: "POST",
    }
  );

  const json = await readJson(res);
  return json?.data ?? null;
}