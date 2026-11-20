"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import { acceptProjectInvitation } from "@/features/projects/team/api/team.api";

function StateIcon({ state }) {
  const classes = {
    loading: "bg-[#005944]/10 text-[#005944]",
    success: "bg-green-100 text-[#005944]",
    error: "bg-red-100 text-red-700",
  };

  const icons = {
    loading: "hourglass_top",
    success: "check_circle",
    error: "error",
  };

  return (
    <span
      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
        classes[state] ?? classes.loading
      }`}
    >
      <Icon name={icons[state] ?? icons.loading} className="text-2xl" />
    </span>
  );
}

export default function InvitationAcceptSection({ token }) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Estamos validando tu invitación.");
  const [projectId, setProjectId] = useState(null);

  const teamHref = useMemo(() => {
    return projectId ? `/projects/${projectId}/team` : "/dashboard";
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function accept() {
      if (!token) {
        setStatus("error");
        setMessage("El enlace de invitación no incluye un token válido.");
        return;
      }

      try {
        setStatus("loading");
        setMessage("Estamos validando tu invitación.");
        const json = await acceptProjectInvitation(token);

        if (cancelled) return;

        setProjectId(json?.invitation?.project_id ?? null);
        setStatus("success");
        setMessage("Ya tienes acceso al proyecto.");
      } catch (error) {
        if (cancelled) return;

        setStatus("error");
        setMessage(
          error?.message ??
            "No se pudo aceptar la invitación. Verifica que el enlace siga vigente."
        );
      }
    }

    accept();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <StateIcon state={status} />

        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#005944]">
          Invitación al proyecto
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {status === "success"
            ? "Bienvenido al equipo"
            : status === "error"
            ? "No se pudo aceptar"
            : "Aceptando invitación"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={teamHref}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              status === "success"
                ? "bg-[#005944] text-white hover:bg-[#004232]"
                : "pointer-events-none bg-slate-100 text-slate-400"
            }`}
          >
            <Icon name="groups" className="text-lg" />
            Ir al equipo
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-[#005944]/30 hover:text-[#005944]"
          >
            <Icon name="dashboard" className="text-lg" />
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
