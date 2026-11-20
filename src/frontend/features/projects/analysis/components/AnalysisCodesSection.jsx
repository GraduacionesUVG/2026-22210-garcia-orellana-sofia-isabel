"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import AnalysisCodebookPanel from "@/features/projects/analysis/components/AnalysisCodebookPanel";
import AnalysisCodingWorkspace from "@/features/projects/analysis/components/AnalysisCodingWorkspace";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import { useAnalysisCodes } from "@/features/projects/analysis/hooks/useAnalysisCodes";
import {
  getAnalysisCodesHref,
  normalizeCodingView,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import { createProjectExportAction } from "@/features/projects/exports/helpers/projectExports.helpers";

function LocalViewLink({ href, icon, label, description, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex min-h-14 min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2",
        active
          ? "border-[#005944]/25 bg-[#005944]/8 text-[#005944]"
          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-[#005944]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-[#005944] text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-[#005944]/10 group-hover:text-[#005944]",
        ].join(" ")}
      >
        <Icon name={icon} className="text-lg" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black leading-tight">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
          {description}
        </span>
      </span>
    </Link>
  );
}

function AnalysisCodebookView({ projectId }) {
  const manager = useAnalysisCodes(projectId);
  const [exportError, setExportError] = useState("");

  return (
    <WorkspaceEditorCard
      title="Libro de códigos"
      icon="account_tree"
      savingState={manager.refreshing ? "saving" : "idle"}
      savingError={exportError || manager.errorMsg}
      secondaryActions={[
        {
          icon: "refresh",
          label: "Actualizar",
          onClick: manager.reload,
          disabled: manager.loading || manager.refreshing,
        },
        createProjectExportAction({
          projectId,
          exportType: "codebook",
          format: "docx",
          label: "Exportar DOCX",
          onError: setExportError,
        }),
        createProjectExportAction({
          projectId,
          exportType: "codebook",
          format: "pdf",
          label: "Exportar PDF",
          onError: setExportError,
        }),
      ]}
      primaryActionLabel="Nuevo código"
      primaryActionIcon="add"
      onPrimaryAction={manager.openCreateModal}
    >
      {exportError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{exportError}</p> : null}
      <AnalysisCodebookPanel manager={manager} />
    </WorkspaceEditorCard>
  );
}

export default function AnalysisCodesSection({
  initialView = "codebook",
  initialSegmentId = "",
}) {
  const { projectId } = useAnalysisContext();
  const activeView = normalizeCodingView(initialView);

  return (
    <section className="space-y-4" aria-label="Herramientas de codificación">
      <nav
        className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2 sm:grid-cols-2"
        aria-label="Vistas de codificación"
      >
        <LocalViewLink
          href={getAnalysisCodesHref(projectId, { view: "codebook" })}
          icon="account_tree"
          label="Libro de códigos"
          description="Definir y organizar categorías"
          active={activeView === "codebook"}
        />
        <LocalViewLink
          href={getAnalysisCodesHref(projectId, {
            view: "coding",
            segmentId: initialSegmentId || undefined,
          })}
          icon="stylus_note"
          label="Codificar"
          description="Aplicar códigos a la evidencia"
          active={activeView === "coding"}
        />
      </nav>

      {activeView === "codebook" ? (
        <AnalysisCodebookView projectId={projectId} />
      ) : (
        <AnalysisCodingWorkspace
          projectId={projectId}
          initialSegmentId={initialSegmentId}
        />
      )}
    </section>
  );
}
