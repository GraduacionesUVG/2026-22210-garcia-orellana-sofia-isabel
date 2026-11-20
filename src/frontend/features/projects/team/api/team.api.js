import { requestJson } from "@/lib/api/http";
import {
  encodePathValue,
  getTeamApiBase,
} from "@/features/projects/team/helpers/team.helpers";

export async function getTeamWorkspace(projectId) {
  return requestJson(
    getTeamApiBase(projectId),
    { cache: "no-store" },
    "No se pudo cargar el equipo del proyecto."
  );
}

export async function inviteTeamMember(projectId, payload) {
  return requestJson(
    getTeamApiBase(projectId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear la invitacion."
  );
}

export async function updateTeamMemberRole(projectId, userId, payload) {
  return requestJson(
    `${getTeamApiBase(projectId)}/members/${encodePathValue(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar el permiso."
  );
}

export async function removeTeamMember(projectId, userId) {
  return requestJson(
    `${getTeamApiBase(projectId)}/members/${encodePathValue(userId)}`,
    { method: "DELETE" },
    "No se pudo quitar a la persona del proyecto."
  );
}

export async function revokeTeamInvitation(projectId, invitationId) {
  return requestJson(
    `${getTeamApiBase(projectId)}/invitations/${encodePathValue(
      invitationId
    )}/revoke`,
    { method: "POST" },
    "No se pudo revocar la invitacion."
  );
}

export async function touchTeamPresence(projectId, payload) {
  return requestJson(
    `${getTeamApiBase(projectId)}/presence`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar la presencia."
  );
}

export async function acceptProjectInvitation(token) {
  return requestJson(
    "/api/project-invitations/accept",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    },
    "No se pudo aceptar la invitacion."
  );
}
