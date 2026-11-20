"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import AnalysisActiveSegment from "@/features/projects/analysis/components/AnalysisActiveSegment";
import AnalysisCodingQueue from "@/features/projects/analysis/components/AnalysisCodingQueue";
import AnalysisSegmentCodingPanel from "@/features/projects/analysis/components/AnalysisSegmentCodingPanel";
import { useAnalysisSegmentsQueue } from "@/features/projects/analysis/hooks/useAnalysisSegmentsQueue";
import {
  getAdjacentCodingSegmentId,
  getAnalysisCodesHref,
  getAnalysisHref,
  pickCodingSegmentId,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisCodingWorkspace({
  projectId,
  initialSegmentId = "",
}) {
  const router = useRouter();
  const queue = useAnalysisSegmentsQueue(projectId);
  const [requestedSegmentId, setRequestedSegmentId] = useState(initialSegmentId);

  const selectedSegmentId = useMemo(
    () =>
      pickCodingSegmentId(
        queue.segments,
        requestedSegmentId || initialSegmentId
      ),
    [initialSegmentId, queue.segments, requestedSegmentId]
  );

  const selectSegment = useCallback(
    (segmentId) => {
      if (!segmentId) return;
      setRequestedSegmentId(segmentId);
      router.replace(
        getAnalysisCodesHref(projectId, { view: "coding", segmentId }),
        { scroll: false }
      );
    },
    [projectId, router]
  );

  const activeSegment = useMemo(
    () =>
      queue.segments.find((segment) => segment.id === selectedSegmentId) ?? null,
    [queue.segments, selectedSegmentId]
  );
  const previousId = getAdjacentCodingSegmentId(
    queue.segments,
    selectedSegmentId,
    -1
  );
  const nextId = getAdjacentCodingSegmentId(
    queue.segments,
    selectedSegmentId,
    1
  );

  const refreshQueue = useCallback(async () => {
    await queue.reload();
  }, [queue]);

  const saveAndContinue = useCallback(async () => {
    const currentIndex = queue.segments.findIndex(
      (segment) => segment.id === selectedSegmentId
    );
    const followingPending = queue.segments
      .slice(currentIndex + 1)
      .find((segment) => !segment.is_coded);
    const earlierPending = queue.segments
      .slice(0, Math.max(currentIndex, 0))
      .find((segment) => !segment.is_coded);
    const nextPendingId = followingPending?.id || earlierPending?.id || "";

    await queue.reload();

    if (nextPendingId) {
      selectSegment(nextPendingId);
    }
  }, [queue, selectSegment, selectedSegmentId]);

  if (!queue.loading && queue.counts.all === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <Icon name="segment" className="text-4xl text-[#005944]" />
        <h2 className="mt-4 text-xl font-black text-slate-950">
          Primero prepara evidencia
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Crea segmentos desde los documentos del corpus. Después podrás
          recorrerlos y aplicar códigos sin perder el contexto.
        </p>
      </section>
    );
  }

  return (
    <div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AnalysisCodingQueue
          manager={queue}
          selectedSegmentId={selectedSegmentId}
          onSelect={selectSegment}
        />

        <div className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] 2xl:items-start">
            <AnalysisActiveSegment segment={activeSegment} />
            {activeSegment ? (
              <AnalysisSegmentCodingPanel
                key={activeSegment.id}
                projectId={projectId}
                segment={activeSegment}
                workspaceMode
                onSaved={refreshQueue}
                onSaveAndContinue={saveAndContinue}
              />
            ) : null}
          </div>

          {activeSegment ? (
            <nav
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              aria-label="Navegar entre segmentos"
            >
              <button
                type="button"
                disabled={!previousId}
                onClick={() => selectSegment(previousId)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="arrow_back" className="text-base" />
                Anterior
              </button>
              <p className="text-center text-xs text-slate-500">
                Puedes omitir un segmento y volver cuando tengas más contexto.
              </p>
              <button
                type="button"
                disabled={!nextId}
                onClick={() => selectSegment(nextId)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Omitir por ahora
                <Icon name="arrow_forward" className="text-base" />
              </button>
            </nav>
          ) : null}

          {!queue.loading && queue.counts.uncoded === 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-emerald-950">
                  Todos los segmentos tienen al menos un código.
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Puedes revisar asignaciones o continuar con los patrones.
                </p>
              </div>
              <a
                href={getAnalysisHref(projectId)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white"
              >
                Explorar patrones
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
