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
    const message = res.status === 409 && json?.error === "DELIMITATION_REVISION_CONFLICT"
      ? "Hay una versión más reciente. Tu borrador no se guardó y permanece aquí. Copia tus cambios antes de recargar para revisar la versión actual."
      : json?.error || "Ocurrió un error procesando la solicitud.";
    throw buildError(
      message,
      res.status,
      json?.details ?? null,
      {
        code: json?.code ?? null,
        latestDelimitation: json?.latest_delimitation ?? null,
        raw: json,
      }
    );
  }

  return json;
}

export async function getDelimitation(projectId) {
  const res = await fetch(`/api/projects/${projectId}/delimitation`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await readJson(res);

  return json?.data ?? {
    delim: {
      topic: "",
      context_place: "",
      time_period: "",
      population: "",
      resources: "",
      revision: 0,
      created_at: null,
      updated_at: null,
      created_by: null,
      updated_by: null,
    },
    include: [],
    exclude: [],
  };
}

export async function saveDelimitation(projectId, payload) {
  const { base_revision, ...patch } = payload ?? {};

  if (!Number.isInteger(base_revision) || base_revision < 0) {
    throw buildError(
      "base_revision es obligatoria para guardar delimitación.",
      400
    );
  }

  const allowedPatch = {};

  if (Object.prototype.hasOwnProperty.call(patch, "topic")) {
    allowedPatch.topic = patch.topic;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "context_place")) {
    allowedPatch.context_place = patch.context_place;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "population")) {
    allowedPatch.population = patch.population;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "time_period")) {
    allowedPatch.time_period = patch.time_period;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "resources")) {
    allowedPatch.resources = patch.resources;
  }

  const res = await fetch(`/api/projects/${projectId}/delimitation`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_revision,
      ...allowedPatch,
    }),
  });

  const json = await readJson(res);
  return json?.delim ?? null;
}

export async function addCriteriaItem(projectId, payload) {
  const res = await fetch(`/api/projects/${projectId}/delimitation/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await readJson(res);
  return json?.item ?? null;
}

export async function updateCriteriaItem(projectId, itemId, payload) {
  const res = await fetch(
    `/api/projects/${projectId}/delimitation/items/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await readJson(res);
  return json?.item ?? null;
}

export async function deleteCriteriaItem(projectId, itemId) {
  const res = await fetch(
    `/api/projects/${projectId}/delimitation/items/${itemId}`,
    {
      method: "DELETE",
    }
  );

  const json = await readJson(res);
  return {
    deletedCount: json?.deletedCount ?? 0,
  };
}
