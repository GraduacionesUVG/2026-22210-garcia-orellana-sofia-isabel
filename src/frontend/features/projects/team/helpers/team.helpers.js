export function encodePathValue(value) {
  return encodeURIComponent(String(value));
}

export function getTeamHref(projectId) {
  return `/projects/${encodePathValue(projectId)}/team`;
}

export function getTeamApiBase(projectId) {
  return `/api/projects/${encodePathValue(projectId)}/team`;
}

export function getInvitationAcceptHref(token) {
  return `/project-invitations/accept?token=${encodeURIComponent(token)}`;
}

export function getAbsoluteInvitationUrl(token) {
  const configuredOrigin =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : "";
  const origin =
    configuredOrigin?.trim().replace(/\/$/, "") ||
    "https://antropologia.vercel.app";

  return `${origin}${getInvitationAcceptHref(token)}`;
}

export function formatTeamDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

export function getRoleLabel(role) {
  const labels = {
    owner: "Propietario",
    editor: "Editor",
    viewer: "Lectura",
  };

  return labels[role] ?? role;
}

export function getMemberDisplayName(member = {}) {
  return member.full_name?.trim() || member.username?.trim() || member.email?.trim()
    || (member.role === "owner" ? "Propietario del proyecto" : "Integrante del proyecto");
}

export function getPresenceLabel(state) {
  const labels = {
    editing: "Editando",
    viewing: "Viendo",
    idle: "En pausa",
  };

  return labels[state] ?? "Activo";
}

export function getActivityEventLabel(eventType) {
  const labels = {
    invitation_created: "Invitación creada",
    invitation_accepted: "Invitación aceptada",
    invitation_revoked: "Invitación revocada",
    member_role_updated: "Permiso actualizado",
    member_removed: "Miembro retirado",
  };

  if (labels[eventType]) return labels[eventType];
  if (!eventType) return "Actividad del equipo";

  return String(eventType)
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}
