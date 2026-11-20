"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import CorpusDocumentForm from "@/features/projects/corpus/components/CorpusDocumentForm";
import CorpusDocumentVersionsPanel from "@/features/projects/corpus/components/CorpusDocumentVersionsPanel";
import { useCorpusContext } from "@/features/projects/corpus/components/CorpusProvider";
import { useCorpusDocumentEditor } from "@/features/projects/corpus/hooks/useCorpusDocumentEditor";
import { touchTeamPresence } from "@/features/projects/team/api/team.api";
import {
  getDocumentArchiveMetadata,
  formatCorpusNumber,
} from "@/features/projects/corpus/helpers/corpus.helpers";

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
          <Icon name="hourglass_top" className="text-xl" />
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
            Cargando documento
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Estamos preparando la transcripción y sus metadatos.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry, onBack }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-700">
            <Icon name="error" className="text-xl" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-800">
              No se pudo cargar el documento
            </p>
            <p className="mt-1 text-sm leading-relaxed text-red-900">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
            onClick={onRetry}
          >
            <Icon name="refresh" className="text-base" />
            Reintentar
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-800"
            onClick={onBack}
          >
            <Icon name="arrow_back" className="text-base" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentMetaSummary({ document, metrics, hasChanges }) {
  if (!document) return null;

  const archiveMeta = getDocumentArchiveMetadata(document);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Revisión
        </p>
        <p className="mt-1 text-xl font-black text-slate-900">
          #{document.revision}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Palabras
        </p>
        <p className="mt-1 text-xl font-black text-slate-900">
          {formatCorpusNumber(metrics.words)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Fecha del dato
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          {archiveMeta.dateLabel}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Lugar / idioma
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          {archiveMeta.locationLabel}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {archiveMeta.languageLabel}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Estado local
        </p>
        <p
          className={`mt-1 text-sm font-black ${
            hasChanges ? "text-amber-700" : "text-[#005944]"
          }`}
        >
          {hasChanges ? "Cambios sin guardar" : "Sin cambios pendientes"}
        </p>
      </div>
    </div>
  );
}

function ConflictHint({ savingError }) {
  if (!savingError?.includes("modificado en otra pestaña")) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
          <Icon name="sync_problem" className="text-lg" />
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-amber-800">
            Conflicto de versión
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900">
            El backend rechazó el guardado porque la revisión local ya no
            coincide con la revisión actual del documento. Recarga antes de
            continuar para evitar sobrescribir cambios.
          </p>
        </div>
      </div>
    </div>
  );
}

function CollaborationPresenceNotice({ activePresence = [] }) {
  if (!activePresence.length) return null;

  const names = activePresence
    .slice(0, 3)
    .map((item) => item.display_name || item.email || "Otra persona");
  const remaining = Math.max(0, activePresence.length - names.length);
  const label = remaining
    ? `${names.join(", ")} y ${remaining} más`
    : names.join(", ");
  const hasEditor = activePresence.some(
    (item) => item.presence_state === "editing"
  );

  return (
    <div className="rounded-2xl border border-[#005944]/20 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#005944]">
          <Icon name="group" className="text-lg" />
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
            Trabajo compartido
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {label} {hasEditor ? "también está editando" : "está viendo"} este
            documento. Guarda cambios con frecuencia; la revisión del documento
            sigue evitando sobrescrituras accidentales.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CorpusDocumentEditorSection({ documentId }) {
  const router = useRouter();
  const { projectId, routes } = useCorpusContext();

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [activePresence, setActivePresence] = useState([]);

  const {
    form,
    document,
    sourceOptions,
    participantOptions,
    metrics,

    loading,
    loadingError,

    catalogStatus,
    catalogError,

    savingState,
    savingError,
    successMsg,

    deleting,
    isSaving,
    canSave,
    hasChanges,

    setField,
    save,
    remove,
    resetChanges,
    reload,
    reloadCatalogs,
  } = useCorpusDocumentEditor(projectId, documentId);

  const title = document?.title
    ? `Editar: ${document.title}`
    : "Editar documento";

  useEffect(() => {
    if (!projectId || !documentId || !document || loading || deleting) {
      return undefined;
    }

    let cancelled = false;

    async function syncPresence() {
      try {
        const hidden = Boolean(globalThis.document?.hidden);
        const response = await touchTeamPresence(projectId, {
          resource_type: "document",
          resource_id: documentId,
          presence_state: hidden ? "idle" : hasChanges ? "editing" : "viewing",
          metadata: {
            title: document.title,
            revision: document.revision,
          },
        });

        if (!cancelled) {
          setActivePresence(response?.active ?? []);
        }
      } catch {
        if (!cancelled) {
          setActivePresence([]);
        }
      }
    }

    syncPresence();
    const interval = window.setInterval(syncPresence, 30000);
    globalThis.document?.addEventListener("visibilitychange", syncPresence);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      globalThis.document?.removeEventListener(
        "visibilitychange",
        syncPresence
      );
    };
  }, [deleting, document, documentId, hasChanges, loading, projectId]);

  return (
    <>
      <WorkspaceEditorCard
        title={title}
        icon="edit_document"
        savingState={deleting ? "saving" : savingState}
        savingError={savingError}
        secondaryActions={[
          {
            icon: "arrow_back",
            label: "Volver al corpus",
            onClick: () => router.push(routes.corpusHref),
            disabled: isSaving || deleting,
          },
          {
            icon: "history",
            label: "Ver versiones",
            onClick: () => setVersionsOpen(true),
            disabled: isSaving || deleting || loading || !document,
          },
          {
            icon: "refresh",
            label: "Recargar",
            onClick: reload,
            disabled: isSaving || deleting,
          },
          {
            icon: "undo",
            label: "Descartar cambios",
            onClick: resetChanges,
            disabled: isSaving || deleting || !hasChanges,
          },
          {
            icon: "delete",
            label: deleting ? "Eliminando..." : "Enviar a papelera",
            onClick: remove,
            disabled: isSaving || deleting || loading || !document,
          },
        ]}
        primaryActionLabel={isSaving ? "Guardando..." : "Guardar cambios"}
        primaryActionIcon="save"
        primaryActionDisabled={!canSave}
        onPrimaryAction={save}
      >
        {loading ? <LoadingState /> : null}

        {!loading && loadingError ? (
          <ErrorState
            message={loadingError}
            onRetry={reload}
            onBack={() => router.push(routes.corpusHref)}
          />
        ) : null}

        {!loading && !loadingError ? (
          <>
            <DocumentMetaSummary
              document={document}
              metrics={metrics}
              hasChanges={hasChanges}
            />

            <ConflictHint savingError={savingError} />

            <CollaborationPresenceNotice activePresence={activePresence} />

            <CorpusDocumentForm
              form={form}
              sourceOptions={sourceOptions}
              participantOptions={participantOptions}
              metrics={metrics}
              catalogStatus={catalogStatus}
              catalogError={catalogError}
              savingError={savingError}
              successMsg={successMsg}
              onFieldChange={setField}
              onReloadCatalogs={reloadCatalogs}
            />
          </>
        ) : null}
      </WorkspaceEditorCard>

      <CorpusDocumentVersionsPanel
        projectId={projectId}
        documentId={documentId}
        documentRevision={document?.revision ?? 0}
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        disabled={!document || loading || deleting}
        onRestored={reload}
      />

    </>
  );
}
