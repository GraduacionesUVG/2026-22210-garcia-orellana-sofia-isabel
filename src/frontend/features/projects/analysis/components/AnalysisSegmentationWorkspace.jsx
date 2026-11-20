"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import AnalysisDocumentPicker from "@/features/projects/analysis/components/AnalysisDocumentPicker";
import AnalysisDocumentSegmenter from "@/features/projects/analysis/components/AnalysisDocumentSegmenter";
import { getAnalysisSegmentsHref } from "@/features/projects/analysis/helpers/analysis.helpers";
import { useAnalysisSegmentationWorkspace } from "@/features/projects/analysis/hooks/useAnalysisSegmentationWorkspace";

function DocumentLoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-600" role="status">
      <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
      Cargando documento…
    </div>
  );
}

export default function AnalysisSegmentationWorkspace({
  projectId,
  initialDocumentId = "",
}) {
  const router = useRouter();
  const manager = useAnalysisSegmentationWorkspace({
    projectId,
    initialDocumentId,
  });
  const [hasPendingSelection, setHasPendingSelection] = useState(false);
  const updateActiveSegmentCount = manager.updateActiveSegmentCount;

  useEffect(() => {
    if (!manager.selectedDocumentId) return;
    if (manager.selectedDocumentId === initialDocumentId) return;

    router.replace(
      getAnalysisSegmentsHref(projectId, {
        documentId: manager.selectedDocumentId,
      }),
      { scroll: false }
    );
  }, [initialDocumentId, manager.selectedDocumentId, projectId, router]);

  const handleSegmentCountChange = useCallback(
    (count) => updateActiveSegmentCount(count),
    [updateActiveSegmentCount]
  );

  function handleSelectDocument(documentId) {
    if (documentId === manager.selectedDocumentId) return;

    if (
      hasPendingSelection &&
      !window.confirm(
        "Tienes un fragmento seleccionado sin guardar. ¿Quieres cambiar de archivo y descartarlo?"
      )
    ) {
      return;
    }

    setHasPendingSelection(false);
    manager.selectDocument(documentId);
  }

  return (
    <div>
      <div className="grid min-w-0 gap-4 2xl:grid-cols-[280px_minmax(430px,1fr)_360px]">
        <AnalysisDocumentPicker
          manager={manager}
          onSelectDocument={handleSelectDocument}
        />

        {manager.loadingDocument ? (
          <DocumentLoadingState />
        ) : manager.documentError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
            <Icon name="error" className="text-2xl text-red-700" />
            <h2 className="mt-3 text-base font-black text-red-950">
              No se pudo abrir el documento
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-900">
              {manager.documentError}
            </p>
            <button
              type="button"
              onClick={manager.reloadDocument}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-800 px-4 text-sm font-bold text-white"
            >
              <Icon name="refresh" className="text-lg" />
              Reintentar
            </button>
          </div>
        ) : manager.activeDocument ? (
          <AnalysisDocumentSegmenter
            key={manager.activeDocument.id}
            projectId={projectId}
            document={manager.activeDocument}
            onPendingSelectionChange={setHasPendingSelection}
            onSegmentCountChange={handleSegmentCountChange}
          />
        ) : !manager.loadingDocuments && !manager.documentsError ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center 2xl:col-span-2">
            <Icon name="inventory_2" className="text-4xl text-slate-400" />
            <h2 className="mt-3 text-base font-black text-slate-800">
              Primero agrega un archivo al Corpus
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Segmentos trabaja sobre el contenido guardado de tus entrevistas, notas de campo y demás documentos.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
