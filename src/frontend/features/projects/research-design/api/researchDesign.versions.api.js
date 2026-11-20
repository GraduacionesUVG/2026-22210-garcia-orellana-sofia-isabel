function buildError(message, status = 500, details = null, extra = {}) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  Object.assign(error, extra);
  return error;
}

async function readJson(res) {
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.ok === false) {
    throw buildError(
      json?.error || "Ocurrió un error procesando la solicitud.",
      res.status,
      json?.details ?? null,
      {
        code: json?.code ?? null,
        raw: json,
      }
    );
  }

  return json;
}

function pickVersionPayload(json) {
  return json?.version ?? json?.data?.version ?? json?.data ?? null;
}

function pickVersionsPayload(json) {
  return json?.versions ?? json?.data?.versions ?? json?.data ?? [];
}

export async function getResearchDesignVersions(projectId) {
  const res = await fetch(`/api/projects/${projectId}/research-design/versions`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await readJson(res);
  return pickVersionsPayload(json);
}

export async function createResearchDesignVersion(projectId, payload = {}) {
  const res = await fetch(`/api/projects/${projectId}/research-design/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      label: String(payload?.label ?? "").trim(),
    }),
  });

  const json = await readJson(res);
  return pickVersionPayload(json);
}

export async function restoreResearchDesignVersion(projectId, versionId) {
  const res = await fetch(
    `/api/projects/${projectId}/research-design/versions/${versionId}/restore`,
    {
      method: "POST",
    }
  );

  const json = await readJson(res);
  return json?.data ?? json ?? null;
}