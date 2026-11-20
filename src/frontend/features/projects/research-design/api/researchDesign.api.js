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
    const isOpaqueConflict = res.status === 409 && [
      "RESEARCH_DESIGN_REVISION_CONFLICT",
      "SPECIFIC_OBJECTIVE_REVISION_CONFLICT",
    ].includes(json?.error);
    const message = isOpaqueConflict
      ? "Hay una versión más reciente. Tu borrador no se guardó y permanece aquí. Copia tus cambios antes de recargar para revisar la versión actual."
      : json?.error || "Ocurrió un error procesando la solicitud.";
    throw buildError(
      message,
      res.status,
      json?.details ?? null,
      {
        code: json?.code ?? null,
        latestDesign: json?.latest_design ?? null,
        latestObjective: json?.latest_objective ?? null,
        raw: json,
      }
    );
  }

  return json;
}

export async function getResearchDesign(projectId) {
  const res = await fetch(`/api/projects/${projectId}/research-design`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await readJson(res);

  return (
    json?.data ?? {
      design: {
        research_question: "",
        general_objective: "",
        revision: 0,
        created_at: null,
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
      specific_objectives: [],
    }
  );
}

export async function saveResearchDesign(projectId, payload) {
  const { base_revision, ...patch } = payload ?? {};

  if (!Number.isInteger(base_revision) || base_revision < 0) {
    throw buildError(
      "base_revision es obligatoria para guardar el diseño de investigación.",
      400
    );
  }

  const allowedPatch = {};

  if (Object.prototype.hasOwnProperty.call(patch, "research_question")) {
    allowedPatch.research_question = patch.research_question;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "general_objective")) {
    allowedPatch.general_objective = patch.general_objective;
  }

  const res = await fetch(`/api/projects/${projectId}/research-design`, {
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
  return json?.design ?? null;
}

export async function createSpecificObjective(projectId, payload) {
  const res = await fetch(
    `/api/projects/${projectId}/research-design/specific-objectives`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: String(payload?.text ?? "").trim(),
      }),
    }
  );

  const json = await readJson(res);
  return json?.objective ?? null;
}

export async function updateSpecificObjective(projectId, objectiveId, payload) {
  const res = await fetch(
    `/api/projects/${projectId}/research-design/specific-objectives/${objectiveId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_revision: payload?.base_revision,
        text: String(payload?.text ?? "").trim(),
      }),
    }
  );

  const json = await readJson(res);
  return json?.objective ?? null;
}

export async function deleteSpecificObjective(projectId, objectiveId) {
  const res = await fetch(
    `/api/projects/${projectId}/research-design/specific-objectives/${objectiveId}`,
    {
      method: "DELETE",
    }
  );

  const json = await readJson(res);
  return {
    deletedCount: json?.deletedCount ?? 0,
  };
}

export async function reorderSpecificObjectives(projectId, orderedIds) {
  const res = await fetch(
    `/api/projects/${projectId}/research-design/specific-objectives/reorder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ordered_ids: Array.isArray(orderedIds) ? orderedIds : [],
      }),
    }
  );

  const json = await readJson(res);
  return json?.objectives ?? [];
}
