"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import { useTeamWorkspace } from "@/features/projects/team/hooks/useTeamWorkspace";
import {
  formatTeamDate,
  getAbsoluteInvitationUrl,
  getActivityEventLabel,
  getPresenceLabel,
  getRoleLabel,
  getMemberDisplayName,
} from "@/features/projects/team/helpers/team.helpers";

function Alert({ type = "info", children }) {
  const classes =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${classes}`}>
      {children}
    </div>
  );
}

function InvitePanel({ draft, setDraft, canInvite, busy, onInvite }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="team-invite-email" className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Correo de la persona
          </label>
          <input
            id="team-invite-email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/15"
            placeholder="correo@universidad.edu"
            type="email"
          />
        </div>

        <div className="w-full lg:w-48">
          <label htmlFor="team-invite-role" className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Permiso
          </label>
          <select
            id="team-invite-role"
            value={draft.role}
            onChange={(event) =>
              setDraft((current) => ({ ...current, role: event.target.value }))
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/15"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Lectura</option>
          </select>
        </div>

        <button
          type="button"
          disabled={!canInvite}
          onClick={onInvite}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#005944] px-5 text-sm font-black text-white transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="person_add" className="text-lg" />
          {busy ? "Invitando..." : "Crear invitación"}
        </button>
      </div>
    </section>
  );
}

function MembersList({ members, busy, canManage, onUpdateRole, onRemove }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
          Miembros activos
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="grid grid-cols-[minmax(0,1fr)_40px] gap-3 px-5 py-4 2xl:grid-cols-[minmax(0,1fr)_140px_40px]"
          >
            <div className="col-span-2 min-w-0 2xl:col-span-1">
              <p className="truncate text-sm font-black text-slate-950">
                {getMemberDisplayName(member)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {member.email || "Sin correo disponible"}
              </p>
            </div>

            <select
              aria-label={`Permiso de ${getMemberDisplayName(member)}`}
              value={member.role}
              disabled={!canManage || member.role === "owner" || busy}
              onChange={(event) => onUpdateRole(member.user_id, event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="owner">Propietario</option>
              <option value="editor">Editor</option>
              <option value="viewer">Lectura</option>
            </select>

            <button
              type="button"
              disabled={!canManage || member.role === "owner" || busy}
              onClick={() => onRemove(member.user_id)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Quitar acceso"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadOnlyPermissionsPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#005944]">
        <Icon name="lock" className="text-lg" />
      </span>
      <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#005944]">
        Administración restringida
      </p>
      <h3 className="mt-1 text-base font-black text-slate-950">
        Solo el propietario puede invitar o cambiar permisos
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Puedes ver quién participa en el proyecto y quién está activo, pero los
        enlaces de invitación quedan protegidos para el propietario.
      </p>
    </section>
  );
}

function InvitationsList({ invitations, busy, onRevoke }) {
  const [copiedInvitationId, setCopiedInvitationId] = useState("");
  const [copyError, setCopyError] = useState(null);
  const copiedTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  async function copyInvitation(invitation) {
    const url = getAbsoluteInvitationUrl(invitation.token);
    window.clearTimeout(copiedTimer.current);
    setCopyError(null);
    setCopiedInvitationId("");

    try {
      await navigator.clipboard.writeText(url);
      setCopiedInvitationId(invitation.id);
      copiedTimer.current = window.setTimeout(() => {
        setCopiedInvitationId((current) =>
          current === invitation.id ? "" : current
        );
      }, 1800);
    } catch {
      setCopiedInvitationId("");
      setCopyError({ id: invitation.id, message: "No se pudo copiar. Selecciona el enlace y cópialo manualmente, o permite el acceso al portapapeles." });
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
          Invitaciones pendientes
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Copia el enlace y envíalo por correo o mensajería.
        </p>
      </div>

      {invitations.length ? (
        <div className="divide-y divide-slate-100">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="space-y-3 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {getRoleLabel(invitation.role)} - vence{" "}
                    {formatTeamDate(invitation.expires_at)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRevoke(invitation.id)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Icon name="close" className="text-base" />
                  Revocar
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs text-slate-600">
                  {getAbsoluteInvitationUrl(invitation.token)}
                </code>
                <button
                  type="button"
                  className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#005944]/20 ${
                    copiedInvitationId === invitation.id
                      ? "bg-emerald-100 text-[#005944]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#005944]/30 hover:text-[#005944]"
                  }`}
                  onClick={() => copyInvitation(invitation)}
                  aria-live="polite"
                >
                  <Icon
                    name={
                      copiedInvitationId === invitation.id
                        ? "check"
                        : "content_copy"
                    }
                    className="text-sm"
                  />
                  {copiedInvitationId === invitation.id ? "Copiado" : "Copiar"}
                </button>
              </div>
              {copyError?.id === invitation.id ? (
                <p role="alert" className="text-xs text-red-700">{copyError.message}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-slate-500">
          No hay invitaciones pendientes.
        </div>
      )}
    </section>
  );
}

function PresencePanel({ presence }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
        Presencia reciente
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {presence.length ? (
          presence.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-[#005944]"
            >
              <span className="h-2 w-2 rounded-full bg-[#005944]" />
              {item.display_name || item.email || "Colaborador"} -{" "}
              {getPresenceLabel(item.presence_state)}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No hay otras personas activas en este momento.
          </p>
        )}
      </div>
    </section>
  );
}

function ActivityPanel({ activity }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
        Actividad reciente
      </p>
      <div className="mt-4 space-y-3">
        {activity.length ? (
          activity.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-sm font-bold text-slate-900">
                {item.actor_name || "Alguien"} - {getActivityEventLabel(item.event_type)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatTeamDate(item.created_at)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            Todavía no hay actividad colaborativa.
          </p>
        )}
      </div>
    </section>
  );
}

export default function TeamSection({ projectId }) {
  const workspace = useTeamWorkspace(projectId);

  return (
    <WorkspaceEditorCard
      title="Equipo y permisos"
      icon="groups"
      secondaryActions={[
        {
          icon: "refresh",
          label: "Actualizar",
          onClick: workspace.reload,
          disabled: workspace.loading || workspace.busy,
        },
      ]}
    >
      {workspace.errorMsg ? (
        <Alert type="error">{workspace.errorMsg}</Alert>
      ) : null}
      {workspace.successMsg ? (
        <Alert type="success">{workspace.successMsg}</Alert>
      ) : null}

      {workspace.loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <>
          {workspace.canManage ? (
            <InvitePanel
              draft={workspace.inviteDraft}
              setDraft={workspace.setInviteDraft}
              canInvite={workspace.canInvite}
              busy={workspace.busy}
              onInvite={workspace.invite}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
            <MembersList
              members={workspace.members}
              busy={workspace.busy}
              canManage={workspace.canManage}
              onUpdateRole={workspace.updateRole}
              onRemove={workspace.remove}
            />
            {workspace.canManage ? (
              <InvitationsList
                invitations={workspace.pendingInvitations}
                busy={workspace.busy}
                onRevoke={workspace.revoke}
              />
            ) : (
              <ReadOnlyPermissionsPanel />
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PresencePanel presence={workspace.presence} />
            <ActivityPanel activity={workspace.activity} />
          </div>
        </>
      )}
    </WorkspaceEditorCard>
  );
}
