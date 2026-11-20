"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTeamWorkspace,
  inviteTeamMember,
  removeTeamMember,
  revokeTeamInvitation,
  touchTeamPresence,
  updateTeamMemberRole,
} from "@/features/projects/team/api/team.api";

const DEFAULT_INVITE = {
  email: "",
  role: "editor",
};

export function useTeamWorkspace(projectId) {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [presence, setPresence] = useState([]);
  const [activity, setActivity] = useState([]);
  const [currentRole, setCurrentRole] = useState("viewer");
  const [inviteDraft, setInviteDraft] = useState(DEFAULT_INVITE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await getTeamWorkspace(projectId);
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
      setPresence(data.presence ?? []);
      setActivity(data.activity ?? []);
      setCurrentRole(data.currentRole ?? "viewer");
    } catch (error) {
      setErrorMsg(error?.message ?? "No se pudo cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!projectId) return undefined;

    const tick = async () => {
      try {
        const data = await touchTeamPresence(projectId, {
          resource_type: "project",
          presence_state: document.hidden ? "idle" : "viewing",
        });
        setPresence(data.active ?? []);
      } catch {
                                                                           
      }
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [projectId]);

  const invite = useCallback(async () => {
    setBusy(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await inviteTeamMember(projectId, inviteDraft);
      setInviteDraft(DEFAULT_INVITE);
      setSuccessMsg("Invitación creada. Comparte el enlace con esa persona.");
      await load();
    } catch (error) {
      setErrorMsg(error?.message ?? "No se pudo crear la invitación.");
    } finally {
      setBusy(false);
    }
  }, [inviteDraft, load, projectId]);

  const updateRole = useCallback(
    async (userId, role) => {
      setBusy(true);
      setErrorMsg("");

      try {
        await updateTeamMemberRole(projectId, userId, { role });
        await load();
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudo actualizar el rol.");
      } finally {
        setBusy(false);
      }
    },
    [load, projectId]
  );

  const remove = useCallback(
    async (userId) => {
      setBusy(true);
      setErrorMsg("");

      try {
        await removeTeamMember(projectId, userId);
        await load();
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudo quitar el miembro.");
      } finally {
        setBusy(false);
      }
    },
    [load, projectId]
  );

  const revoke = useCallback(
    async (invitationId) => {
      setBusy(true);
      setErrorMsg("");

      try {
        await revokeTeamInvitation(projectId, invitationId);
        await load();
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudo revocar la invitación.");
      } finally {
        setBusy(false);
      }
    },
    [load, projectId]
  );

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status === "pending"),
    [invitations]
  );

  const canManage = currentRole === "owner";
  const canInvite = canManage && inviteDraft.email.trim().length > 3 && !busy;

  return {
    members,
    invitations,
    pendingInvitations,
    presence,
    activity,
    currentRole,
    inviteDraft,
    loading,
    busy,
    errorMsg,
    successMsg,
    canManage,
    canInvite,
    setInviteDraft,
    invite,
    updateRole,
    remove,
    revoke,
    reload: load,
  };
}
