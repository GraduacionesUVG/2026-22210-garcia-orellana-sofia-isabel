async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildApiError(response, json, fallbackMessage) {
  const error = new Error(json?.error || fallbackMessage);
  error.status = response.status;
  error.code = json?.code || null;
  error.details = json?.details || null;
  return error;
}

export async function getSampleConfigVersions(projectId) {
  const response = await fetch(
    `/api/projects/${projectId}/sample-config/versions`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const json = await parseJsonSafe(response);

  if (!response.ok || !json?.ok) {
    throw buildApiError(
      response,
      json,
      "No se pudieron cargar las versiones de muestra."
    );
  }

  return json.versions;
}

export async function createSampleConfigVersion(projectId, payload = {}) {
  const response = await fetch(
    `/api/projects/${projectId}/sample-config/versions`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await parseJsonSafe(response);

  if (!response.ok || !json?.ok) {
    throw buildApiError(
      response,
      json,
      "No se pudo guardar la versión de muestra."
    );
  }

  return json.version;
}

export async function restoreSampleConfigVersion(
  projectId,
  versionId,
  payload = { create_backup_of_current: true }
) {
  const response = await fetch(
    `/api/projects/${projectId}/sample-config/versions/${versionId}/restore`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await parseJsonSafe(response);

  if (!response.ok || !json?.ok) {
    throw buildApiError(
      response,
      json,
      "No se pudo restaurar la versión seleccionada."
    );
  }

  return json.restored;
}