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
  error.latestConfig = json?.latest_config || null;
  return error;
}

export async function getSampleConfig(projectId) {
  const response = await fetch(`/api/projects/${projectId}/sample-config`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await parseJsonSafe(response);

  if (!response.ok || !json?.ok) {
    throw buildApiError(
      response,
      json,
      "No se pudo cargar la configuración de muestra."
    );
  }

  return json.data;
}

export async function getSampleConfigOptions(projectId) {
  const response = await fetch(
    `/api/projects/${projectId}/sample-config/options`,
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
      "No se pudieron cargar las opciones de muestra."
    );
  }

  return json.options;
}

export async function updateSampleConfig(projectId, payload) {
  const response = await fetch(`/api/projects/${projectId}/sample-config`, {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await parseJsonSafe(response);

  if (!response.ok || !json?.ok) {
    throw buildApiError(
      response,
      json,
      "No se pudo guardar la configuración de muestra."
    );
  }

  return json.data;
}