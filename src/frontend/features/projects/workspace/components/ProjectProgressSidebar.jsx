"use client";

import Link from "next/link";
import { useId, useState } from "react";
import Icon from "@/components/common/Icon";
import { useProjectWorkflow } from "@/features/projects/workspace/hooks/useProjectWorkflow";
import { PROJECT_WORKFLOW_STEPS } from "@/features/projects/workspace/workspaceWorkflowNavigation";

export const PROJECT_STEPS = PROJECT_WORKFLOW_STEPS;

export const ANALYSIS_NAV_ITEMS = [
  {
    key: "codes",
    label: "Codificación",
    description: "Organizar evidencia",
    icon: "account_tree",
  },
  {
    key: "overview",
    label: "Explorar",
    description: "Leer patrones",
    icon: "analytics",
  },
  {
    key: "memos",
    label: "Memos",
    description: "Registrar interpretaciones",
    icon: "edit_note",
  },
  {
    key: "insights",
    label: "Hallazgos",
    description: "Sintetizar resultados",
    icon: "emoji_objects",
  },
];

export function buildProjectStepRoutes(projectId) {
  const baseProjectHref = projectId ? `/projects/${projectId}` : null;

  return {
    delimitation: baseProjectHref
      ? `${baseProjectHref}/delimitation`
      : null,
    design: baseProjectHref ? `${baseProjectHref}/research-design` : null,
    sample: baseProjectHref ? `${baseProjectHref}/sample-config` : null,
    collection: baseProjectHref ? `${baseProjectHref}/corpus` : null,
    segments: baseProjectHref ? `${baseProjectHref}/analysis/segments` : null,
    analysis: baseProjectHref ? `${baseProjectHref}/analysis` : null,
    codes: baseProjectHref ? `${baseProjectHref}/analysis/codes` : null,
    memos: baseProjectHref ? `${baseProjectHref}/analysis/memos` : null,
    insights: baseProjectHref ? `${baseProjectHref}/analysis/insights` : null,
    report: baseProjectHref ? `${baseProjectHref}/report` : null,
    team: baseProjectHref ? `${baseProjectHref}/team` : null,
  };
}

function StepCard({ step, isActive, state, isAvailable, href, statusLabel }) {
  const isCompleted = state === "completed";
  const content = (
    <div
      className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
        isActive
          ? "border-primary/20 bg-green-50"
          : href
          ? "border-transparent bg-white hover:bg-slate-50"
          : "border-transparent bg-white"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isActive
            ? "bg-primary text-white"
            : isCompleted
            ? "bg-green-100 text-primary"
            : isAvailable
            ? "bg-slate-100 text-slate-600"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon name={step.icon} className="text-[20px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            isActive ? "text-primary" : "text-slate-700"
          }`}
        >
          {step.label}
        </p>

        <p className="text-xs text-slate-500">
          {statusLabel}
        </p>
      </div>

      {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

function AnalysisGroup({
  isActive,
  activeAnalysisKey,
  phase,
  isAvailable,
  routes,
  statusLabel,
}) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const navigationId = useId();
  const isOpen = isActive || isManuallyOpen;
  const isCompleted = phase?.state === "completed";

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isActive ? "border-primary/20 bg-green-50/70" : "border-transparent"
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={navigationId}
        onClick={() => setIsManuallyOpen((value) => !value)}
        className="flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isActive
              ? "bg-primary text-white"
              : isCompleted
              ? "bg-green-100 text-primary"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon name="analytics" className="text-[20px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold ${
              isActive ? "text-primary" : "text-slate-700"
            }`}
          >
            Análisis
          </span>
          <span className="block text-xs text-slate-500">{statusLabel}</span>
        </span>

        <Icon
          name="expand_more"
          className={`text-[20px] text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <nav
          id={navigationId}
          aria-label="Secciones de análisis"
          className="mb-2 ml-8 mr-2 border-l border-slate-200 pl-3"
        >
          <div className="space-y-1">
            {ANALYSIS_NAV_ITEMS.map((item) => {
              const itemActive = isActive && activeAnalysisKey === item.key;
              const href =
                item.key === "overview" ? routes.analysis : routes[item.key];

              if (!isAvailable || !href) {
                return (
                  <div
                    key={item.key}
                    className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-slate-400"
                  >
                    <Icon name={item.icon} className="text-[18px]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px]">
                        Pendiente
                      </span>
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={itemActive ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    itemActive
                      ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon name={item.icon} className="text-[18px]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export default function ProjectProgressSidebar({
  projectId,
  activeStepKey = "delimitation",
  activeAnalysisKey = null,
  activeUtilityKey = null,
}) {
  const { workflow, loading, error } = useProjectWorkflow(projectId);
  const hasSummary = workflow.phases.length > 0;
  const safeProgress = hasSummary
    ? Math.max(0, Math.min(100, Number(workflow.progress || 0)))
    : null;
  const routes = buildProjectStepRoutes(projectId);

  function getStatusLabel(phase, isActive) {
    if (!hasSummary) {
      if (loading) return "Cargando estado";
      if (error) return "Estado no disponible";
      return isActive ? "Paso actual" : "Disponible";
    }

    if (isActive) return "Paso actual";
    if (phase?.state === "completed") return "Completado";
    if (phase?.state === "in_progress") return "En progreso";
    return phase?.available ? "Disponible" : "Pendiente";
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Volver a proyectos
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Progreso del proyecto
        </p>

        <h3 className="mt-2 text-lg font-bold text-slate-900">
          Estado de investigación
        </h3>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Avance general</span>
            <span>{safeProgress === null ? "—" : `${safeProgress}%`}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${safeProgress ?? 0}%` }}
              role="progressbar"
              aria-label="Avance general del proyecto"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={safeProgress ?? undefined}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {PROJECT_STEPS.map((step) => {
            const isActive = step.key === activeStepKey;
            const isSegments = step.key === "segments";
            const phase = isSegments
              ? {
                  state:
                    Number(workflow.evidence?.segments ?? 0) > 0
                      ? "completed"
                      : "not_started",
                  available:
                    Boolean(workflow.phaseMap?.collection?.available) ||
                    Number(workflow.evidence?.documents ?? 0) > 0 ||
                    Number(workflow.evidence?.segments ?? 0) > 0,
                }
              : workflow.phaseMap?.[step.key];
            const isAvailable =
              step.key === "report"
                ? true
                : hasSummary
                ? Boolean(phase?.available)
                : true;
            const href = isAvailable ? routes[step.key] ?? null : null;

            if (step.key === "analysis") {
              return (
                <AnalysisGroup
                  key={step.key}
                  isActive={isActive}
                  activeAnalysisKey={activeAnalysisKey}
                  phase={phase}
                  isAvailable={isAvailable}
                  routes={routes}
                  statusLabel={getStatusLabel(phase, isActive)}
                />
              );
            }

            const segmentCount = Number(workflow.evidence?.segments ?? 0);
            const statusLabel = isSegments
              ? isActive
                ? "Paso actual"
                : segmentCount > 0
                ? `${segmentCount} ${segmentCount === 1 ? "segmento" : "segmentos"}`
                : isAvailable
                ? "Preparar evidencia"
                : "Pendiente"
              : getStatusLabel(phase, isActive);

            return (
              <StepCard
                key={step.key}
                step={step}
                isActive={isActive}
                state={phase?.state ?? "not_started"}
                isAvailable={isAvailable}
                href={href}
                statusLabel={statusLabel}
              />
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 p-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Herramientas del proyecto
        </p>
        <Link
          href={routes.team ?? "/dashboard"}
          aria-current={activeUtilityKey === "team" ? "page" : undefined}
          className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            activeUtilityKey === "team"
              ? "border-primary/20 bg-green-50 text-primary"
              : "border-transparent text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon name="groups" className="text-[20px]" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Equipo</span>
            <span className="block text-xs text-slate-500">
              Colaboradores y roles
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
