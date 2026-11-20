export async function parseJsonSafe(res) {
  return res.json().catch(() => ({}));
}

export function buildHttpError(res, json, fallback) {
  const error = new Error(
    json?.error || json?.message || fallback || "Ocurrió un error."
  );
  error.status = res.status;
  error.payload = json;
  return error;
}

export async function requestJson(url, options = {}, fallbackMessage) {
  const res = await fetch(url, options);
  const json = await parseJsonSafe(res);

  if (!res.ok || json?.ok === false) {
    throw buildHttpError(res, json, fallbackMessage);
  }

  return json;
}