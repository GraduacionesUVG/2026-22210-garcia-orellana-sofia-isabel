"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import AnalysisQuickActions from "@/features/projects/analysis/components/AnalysisQuickActions";
import AnalysisMemosDashboardView from "@/features/projects/analysis/components/AnalysisMemosDashboardView";
import AnalysisMemoFormModal from "@/features/projects/analysis/components/AnalysisMemoFormModal";
import AnalysisUncodedSegmentsPanel from "@/features/projects/analysis/components/AnalysisUncodedSegmentsPanel";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import { useAnalysisOverview } from "@/features/projects/analysis/hooks/useAnalysisOverview";
import { useAnalysisMemos } from "@/features/projects/analysis/hooks/useAnalysisMemos";
import {
  buildMemoCreatePayload,
  formatAnalysisNumber,
  getSegmentDisplayTitle,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import { buildTreeLayout } from "@/features/projects/analysis/helpers/codeTreeLayout.helpers";
import { buildCodeTreeIndex } from "@/features/projects/analysis/helpers/analysisCodebook.helpers";
import {
  buildDashboardViewStorageKey,
  parseDashboardViews,
  upsertDashboardView,
} from "@/features/projects/analysis/helpers/analysisDashboardViews.helpers";
import {
  createAnalysisMemo,
  createAnalysisMemoLink,
} from "@/features/projects/analysis/api/analysis.api";
import { createProjectExportAction } from "@/features/projects/exports/helpers/projectExports.helpers";

const NODE_WIDTH = 172;
const TREE_BASE_SCALE = 1.35;
const ANALYSIS_VISUAL_EVENT = "analysis:visual-focus";

function pickMetric(overview, keys, fallback = 0) {
  for (const key of keys) {
    if (overview?.[key] !== undefined && overview?.[key] !== null) {
      return Number(overview[key] || 0);
    }
  }

  return fallback;
}
function getCodeStatValue(item) {
  return Number(
    item?.segment_count ??
      item?.coded_segments_count ??
      item?.usage_count ??
      item?.count ??
      0
  );
}
function truncateText(value, max = 30) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function getCodeName(code) {
  return code?.name ?? "Codigo";
}

function getRelationshipKey(sourceId, targetId) {
  return [sourceId, targetId].sort().join(":");
}

function uniqueTargets(targets = []) {
  const seen = new Set();

  return targets.filter((target) => {
    if (!target?.id || !target?.link_type) return false;
    const key = `${target.link_type}:${target.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function targetPayload(target) {
  const keyByType = {
    document: "document_id",
    segment: "segment_id",
    code: "code_id",
    participant: "participant_id",
  };
  const key = keyByType[target?.link_type];

  if (!key || !target?.id) return null;

  return {
    link_type: target.link_type,
    [key]: target.id,
  };
}

function buildStatsByCodeId(codeStats = []) {
  return new Map(codeStats.map((item) => [item.code_id ?? item.id, item]));
}

function getUsageForCode(code, statsByCodeId) {
  return getCodeStatValue(statsByCodeId.get(code.id));
}

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <Icon name="warning" className="text-lg" />
          </span>
          <div>
            <p className="text-sm font-black text-amber-950">
              No se pudo cargar el dashboard.
            </p>
            <p className="mt-1 text-sm text-amber-900">{message}</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white"
          onClick={onRetry}
        >
          <Icon name="refresh" className="text-base" />
          Reintentar
        </button>
      </div>
    </div>
  );
}

function AnalysisDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="grid gap-2 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-[#005944]/15 bg-[#f8fbfa] p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-[#005944]/15" />
        <div className="mt-3 h-7 w-72 max-w-full animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-[520px] max-w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="h-8 w-8 animate-pulse rounded-lg bg-[#005944]/10" />
              <div className="mt-3 h-3 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-2 h-7 w-12 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VisualToolbar({ visual }) {
  if (!visual) return null;

  const attachedMemos = visual.memos ?? [];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#005944]/30 hover:text-[#005944] focus:outline-none focus:ring-2 focus:ring-[#005944]/25"
        onClick={() => visual.onDiscuss?.(visual)}
        title="Discutir este visual con el chatbot"
      >
        <Icon name="forum" className="text-base" />
        Discutir
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-[#005944] transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-[#005944]/25"
        onClick={() => visual.onAttach?.(visual)}
        title="Crear memo vinculado a este visual"
      >
        <Icon name="edit_note" className="text-base" />
        Memo
      </button>
      {attachedMemos.length ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
          <Icon name="link" className="text-sm" />
          {attachedMemos.length} memo
          {attachedMemos.length === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

function VisualAttachedMemos({ visual }) {
  const memos = visual?.memos ?? [];

  if (!memos.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
        Memos vinculados a este visual
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {memos.slice(0, 4).map((memo) => (
          <span
            key={memo.id}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700"
            title={memo.body || memo.title}
          >
            {truncateText(memo.title, 46)}
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .analysis-reveal {
        animation: analysisFadeUp 420ms cubic-bezier(.22, 1, .36, 1) both;
      }

      .analysis-node {
        transition: transform 180ms ease, filter 180ms ease;
      }

      .analysis-node:hover {
        transform: translateY(-2px);
        filter: drop-shadow(0 8px 10px rgba(15, 23, 42, .12));
      }

      .analysis-line {
        stroke-dasharray: 620;
        stroke-dashoffset: 620;
        animation: analysisDraw 780ms cubic-bezier(.22, 1, .36, 1) forwards;
      }

      .analysis-glow {
        animation: analysisGlow 2.8s ease-in-out infinite;
      }

      @keyframes analysisFadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes analysisDraw {
        to { stroke-dashoffset: 0; }
      }

      @keyframes analysisGlow {
        0%, 100% { box-shadow: 0 0 0 rgba(0, 89, 68, 0); }
        50% { box-shadow: 0 0 0 6px rgba(0, 89, 68, .08); }
      }

      @media (prefers-reduced-motion: reduce) {
        .analysis-reveal,
        .analysis-line,
        .analysis-glow {
          animation: none;
        }

        .analysis-node,
        .analysis-node:hover {
          transition: none;
          transform: none;
          filter: none;
        }
      }
    `}</style>
  );
}

function EvidenceMetric({ icon, label, value, detail, index }) {
  return (
    <div
      className="analysis-reveal min-w-0 rounded-xl border border-slate-200 bg-white p-3"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#005944]/10 text-[#005944]">
          <Icon name={icon} className="text-lg" />
        </span>
        <div className="min-w-0 overflow-hidden">
          <p className="break-words text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere]">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function EvidenceCommandCenter({ overview, codeStats, relationships, visualActions }) {
  const totalSegments = pickMetric(overview, [
    "total_segments",
    "segments_count",
  ]);
  const codedAssignments = pickMetric(overview, [
    "coded_segments",
    "coded_segments_count",
    "total_coded_segments",
  ]);
  const uncodedSegments = pickMetric(overview, [
    "uncoded_segments",
    "uncoded_segments_count",
    "total_uncoded_segments",
  ]);
  const totalCodes = pickMetric(overview, ["total_codes", "codes_count"]);
  const totalMemos = pickMetric(overview, ["total_memos", "memos_count"]);
  const totalQuotes = pickMetric(overview, ["total_quotes", "quotes_count"]);
  const coveredSegmentCount = Math.min(codedAssignments, totalSegments);
  const coverage = totalSegments
    ? Math.min(100, Math.round((coveredSegmentCount / totalSegments) * 100))
    : 0;
  const strongestStat = codeStats[0];
  const strongestRelation = relationships[0];
  const relationshipCount = relationships.length;

  const metrics = [
    {
      icon: "segment",
      label: "Segmentos",
      value: formatAnalysisNumber(totalSegments),
      detail: "evidencia marcada",
    },
    {
      icon: "done_all",
      label: "Codificaciones",
      value: formatAnalysisNumber(codedAssignments),
      detail: "asignaciones registradas",
    },
    {
      icon: "radio_button_unchecked",
      label: "Pendientes",
      value: formatAnalysisNumber(uncodedSegments),
      detail: "sin codigo",
    },
    {
      icon: "sell",
      label: "Codigos",
      value: formatAnalysisNumber(totalCodes),
      detail: "categorias activas",
    },
    {
      icon: "edit_note",
      label: "Memos",
      value: formatAnalysisNumber(totalMemos),
      detail: "interpretaciones",
    },
    {
      icon: "format_quote",
      label: "Citas",
      value: formatAnalysisNumber(totalQuotes),
      detail: "evidencia textual",
    },
  ];

  return (
    <section className="analysis-reveal overflow-hidden rounded-2xl border border-[#005944]/20 bg-[#f8fbfa]">
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                Mesa analitica
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">
                Lectura accionable del corpus
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Usa esta vista para detectar categorias dominantes, cruces entre
                codigos y vacios que todavia necesitan trabajo interpretativo.
              </p>
              <VisualToolbar visual={visualActions} />
              <VisualAttachedMemos visual={visualActions} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            {metrics.map((metric, index) => (
              <EvidenceMetric key={metric.label} {...metric} index={index} />
            ))}
          </div>
        </div>

        <aside className="analysis-glow rounded-2xl bg-white p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Estado del analisis
          </p>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-5xl font-black tracking-tight text-slate-950">
              {coverage}%
            </p>
            <p className="pb-2 text-xs font-black uppercase tracking-widest text-[#005944]">
              cobertura
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#005944] transition-all duration-500"
              style={{ width: `${coverage}%` }}
            />
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Codigo dominante
              </p>
              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {strongestStat?.code_name ?? strongestStat?.name ?? "Sin datos"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Relaciones detectadas
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {formatAnalysisNumber(relationshipCount)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cruce mas fuerte
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {strongestRelation
                  ? `${formatAnalysisNumber(
                      strongestRelation.shared_segment_count
                    )} segmentos`
                  : "Sin cruces"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function GraphNode({ node, index }) {
  const size = node.kind === "root" ? 46 : node.kind === "child" ? 30 : 36;

  return (
    <g
      className="analysis-node"
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        animationDelay: `${index * 55}ms`,
      }}
    >
      <rect
        x={node.x - NODE_WIDTH / 2}
        y={node.y - 24}
        width={NODE_WIDTH}
        height="48"
        rx="14"
        fill="white"
        stroke="rgba(148, 163, 184, .5)"
      />
      <circle cx={node.x - 62} cy={node.y} r={size / 2} fill={`${node.color}20`} />
      <circle cx={node.x - 62} cy={node.y} r={Math.max(5, size / 5)} fill={node.color} />
      <text
        x={node.x - 42}
        y={node.y - 4}
        className="fill-slate-950 text-[12px] font-black"
      >
        {truncateText(node.label, 21)}
      </text>
      <text
        x={node.x - 42}
        y={node.y + 13}
        className="fill-slate-500 text-[10px] font-bold"
      >
        {truncateText(node.subtitle, 24)}
      </text>
    </g>
  );
}

function CodeTreeVisual({ codes = [], codeStats = [], visualActions }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const { nodes, lines, graphHeight, graphWidth } = buildTreeLayout(
    codes,
    codeStats,
    1
  );
  const effectiveZoom = zoom * TREE_BASE_SCALE;
  const zoomPercent = Math.round(zoom * 100);

  function clampPan(nextPan, nextZoom = zoom) {
    const nextEffectiveZoom = nextZoom * TREE_BASE_SCALE;
    const scaledWidth = graphWidth * nextEffectiveZoom;
    const scaledHeight = graphHeight * nextEffectiveZoom;
    const marginX = graphWidth * 0.25;
    const marginY = graphHeight * 0.25;

    return {
      x: Math.min(
        marginX,
        Math.max(Math.min(0, graphWidth - scaledWidth) - marginX, nextPan.x)
      ),
      y: Math.min(
        marginY,
        Math.max(Math.min(0, graphHeight - scaledHeight) - marginY, nextPan.y)
      ),
    };
  }

  function changeZoom(nextZoom) {
    const boundedZoom = Math.min(1.8, Math.max(0.8, Number(nextZoom.toFixed(2))));

    setZoom(boundedZoom);
    setPan((currentPan) => clampPan(currentPan, boundedZoom));
  }

  function resetView() {
    changeZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function getSvgDelta(clientDeltaX, clientDeltaY) {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect?.width || !rect?.height) {
      return { x: clientDeltaX, y: clientDeltaY };
    }

    return {
      x: (clientDeltaX * graphWidth) / rect.width,
      y: (clientDeltaY * graphHeight) / rect.height,
    };
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
  }

  function moveDrag(clientX, clientY) {
    if (!dragRef.current) return;
    const delta = getSvgDelta(
      clientX - dragRef.current.startX,
      clientY - dragRef.current.startY
    );

    setPan(clampPan({
      x: dragRef.current.panX + delta.x,
      y: dragRef.current.panY + delta.y,
    }));
  }

  function stopDrag() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function handlePointerMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      stopDrag();
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheel(event) {
    if (!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    changeZoom(zoom + (event.deltaY > 0 ? -0.1 : 0.1));
  }

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Arbol de codigos
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Estructura conceptual del codebook
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Lee jerarquia y peso de codigos. Los nodos mas usados muestran donde
            se concentra la interpretacion.
          </p>
          <VisualToolbar visual={visualActions} />
          <VisualAttachedMemos visual={visualActions} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#005944]/10 px-3 py-1 text-xs font-black text-[#005944]">
            <Icon name="account_tree" className="text-base" />
            {formatAnalysisNumber(codes.length)} codigos
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-[#005944] focus:outline-none focus:ring-2 focus:ring-[#005944]/30 disabled:opacity-40"
              onClick={() => changeZoom(zoom - 0.2)}
              disabled={zoom <= 0.8}
              aria-label="Reducir zoom del arbol"
            >
              <Icon name="zoom_out" className="text-lg" />
            </button>
            <button
              type="button"
              className="border-x border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 hover:text-[#005944] focus:outline-none focus:ring-2 focus:ring-[#005944]/30"
              onClick={resetView}
              aria-label="Restablecer zoom del arbol"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 hover:text-[#005944] focus:outline-none focus:ring-2 focus:ring-[#005944]/30 disabled:opacity-40"
              onClick={() => changeZoom(zoom + 0.2)}
              disabled={zoom >= 1.8}
              aria-label="Aumentar zoom del arbol"
            >
              <Icon name="zoom_in" className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        {codes.length ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="h-[430px] w-full touch-none select-none rounded-xl bg-white"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            role="img"
            aria-label="Arbol visual de codigos"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={stopDrag}
            onWheel={handleWheel}
          >
            <defs>
              <filter id="softNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity=".08" />
              </filter>
            </defs>
            <g
              transform={`translate(${pan.x} ${pan.y}) scale(${effectiveZoom})`}
              style={{
                transformBox: "fill-box",
                transformOrigin: "0 0",
                transition: isDragging ? "none" : "transform 180ms ease",
              }}
            >
              {lines.map((line, index) => (
                <path
                  key={line.id}
                  className="analysis-line"
                  d={`M ${line.sourceX} ${line.sourceY} C ${
                    (line.sourceX + line.targetX) / 2
                  } ${line.sourceY}, ${(line.sourceX + line.targetX) / 2} ${
                    line.targetY
                  }, ${line.targetX} ${line.targetY}`}
                  fill="none"
                  stroke={line.color}
                  strokeOpacity=".45"
                  strokeWidth="2"
                  style={{ animationDelay: `${index * 35}ms` }}
                />
              ))}
              <g filter="url(#softNodeShadow)">
                {nodes.map((node, index) => (
                  <GraphNode key={node.id} node={node} index={index} />
                ))}
              </g>
            </g>
          </svg>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Crea codigos para ver un arbol conceptual del corpus.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DocumentPatternMap({ codes = [], documentPatterns, visualActions }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const codeById = new Map(codes.map((code) => [code.id, code]));
  const documents = documentPatterns?.documents ?? [];
  const patterns = documentPatterns?.patterns ?? [];
  const visibleDocuments = documents.slice(0, 5);
  const visiblePatterns = patterns.slice(0, 8);
  const maxSegments = Math.max(
    1,
    ...visiblePatterns.flatMap((pattern) =>
      (pattern.documents ?? []).map((document) => document.segment_count ?? 0)
    )
  );
  const strongestPattern = visiblePatterns[0];
  const strongestCode = strongestPattern
    ? codeById.get(strongestPattern.code_id)
    : null;
  const selectedCell = selectedKey
    ? visiblePatterns
        .flatMap((pattern) =>
          (pattern.documents ?? []).map((document) => ({
            pattern,
            document,
            key: `${pattern.code_id}:${document.document_id}`,
          }))
        )
        .find((item) => item.key === selectedKey)
    : null;
  const selectedCellCode = selectedCell
    ? codeById.get(selectedCell.pattern.code_id)
    : null;
  const selectedCellSegments = selectedCell?.document?.segments ?? [];
  const effectiveVisualActions = selectedCell
    ? {
        ...visualActions,
        title: `${getCodeName(selectedCellCode)} en ${selectedCell.document.document_title}`,
        prompt:
          "¿Qué relación aparece cuando este código se repite en este documento y qué citas sostienen esa lectura?",
        summary: `${formatAnalysisNumber(selectedCell.document.segment_count)} segmentos de ${getCodeName(
          selectedCellCode
        )} en ${selectedCell.document.document_title}.`,
        metrics: {
          codigo: getCodeName(selectedCellCode),
          documento: selectedCell.document.document_title,
          segmentos: selectedCell.document.segment_count,
          citas: selectedCell.document.quote_count ?? 0,
        },
        evidence: selectedCellSegments.slice(0, 8),
        targets: uniqueTargets([
          {
            link_type: "code",
            id: selectedCell.pattern.code_id,
            label: getCodeName(selectedCellCode),
          },
          {
            link_type: "document",
            id: selectedCell.document.document_id,
            label: selectedCell.document.document_title,
          },
          ...selectedCellSegments.slice(0, 8).map((segment) => ({
            link_type: "segment",
            id: segment.segment_id,
            label: getSegmentDisplayTitle(segment),
            excerpt: segment.selected_text,
          })),
        ]),
      }
    : {
        ...visualActions,
        summary: `${visiblePatterns.length} códigos visibles comparados en ${visibleDocuments.length} documentos.`,
        metrics: {
          codigos: visiblePatterns.length,
          documentos: visibleDocuments.length,
          patron_transversal: strongestCode ? getCodeName(strongestCode) : "Sin datos",
        },
        targets: strongestCode
          ? [
              {
                link_type: "code",
                id: strongestCode.id,
                label: getCodeName(strongestCode),
              },
            ]
          : [],
      };

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Patrones entre documentos
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Códigos repetidos por documento
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Detecta qué códigos aparecen en varios documentos y dónde se
            concentra cada patrón.
          </p>
          <VisualToolbar visual={effectiveVisualActions} />
          <VisualAttachedMemos visual={effectiveVisualActions} />
        </div>
        <div className="rounded-xl bg-[#005944]/10 px-3 py-2 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            Patrón más transversal
          </p>
          <p className="mt-1 max-w-[220px] truncate text-sm font-black text-slate-950">
            {strongestCode ? getCodeName(strongestCode) : "Sin datos"}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-3">
        {visibleDocuments.length && visiblePatterns.length ? (
          <div
            className="grid min-w-[760px] gap-1"
            style={{
              gridTemplateColumns: `190px repeat(${visibleDocuments.length}, minmax(118px, 1fr))`,
            }}
          >
            <div className="rounded-lg bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Código
            </div>
            {visibleDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-lg bg-white px-3 py-2"
                title={document.title}
              >
                <p className="truncate text-[11px] font-black text-slate-800">
                  {document.title}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {document.document_type || "documento"}
                </p>
              </div>
            ))}

            {visiblePatterns.map((pattern) => {
              const code = codeById.get(pattern.code_id);
              const documentsById = new Map(
                (pattern.documents ?? []).map((document) => [
                  document.document_id,
                  document,
                ])
              );

              return (
                <div key={pattern.code_id} className="contents">
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-3 py-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: code?.color || "#0f766e" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900">
                        {getCodeName(code)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {formatAnalysisNumber(pattern.document_count)} docs,
                        {" "}
                        {formatAnalysisNumber(pattern.total_segments)} segmentos
                      </p>
                    </div>
                  </div>

                  {visibleDocuments.map((document) => {
                    const match = documentsById.get(document.id);
                    const value = match?.segment_count ?? 0;
                    const intensity = Math.min(1, value / maxSegments);

                    return (
                      <button
                        key={`${pattern.code_id}-${document.id}`}
                        type="button"
                        className="rounded-lg px-2 py-2 text-left text-xs font-black transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#005944]/35 disabled:hover:scale-100"
                        disabled={!value}
                        onClick={() =>
                          setSelectedKey(`${pattern.code_id}:${document.id}`)
                        }
                        aria-label={
                          value
                            ? `${getCodeName(code)} en ${document.title}: ${value} segmentos`
                            : `${getCodeName(code)} no aparece en ${document.title}`
                        }
                        style={{
                          backgroundColor: value
                            ? `rgba(0, 89, 68, ${0.08 + intensity * 0.42})`
                            : "rgba(226, 232, 240, .55)",
                          color: value ? "#042f2e" : "#94a3b8",
                        }}
                        title={
                          value
                            ? `${value} segmentos en ${document.title}`
                            : `Sin segmentos en ${document.title}`
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{value || "-"}</span>
                          {match?.quote_count ? (
                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px]">
                              {match.quote_count} citas
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Codifica segmentos en varios documentos para ver patrones
              transversales.
            </p>
          </div>
        )}
      </div>

      {selectedCell ? (
        <div className="mt-4 rounded-2xl border border-[#005944]/20 bg-[#f8fbfa] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                Evidencia de la celda
              </p>
              <h4 className="mt-1 text-base font-black text-slate-950">
                {getCodeName(codeById.get(selectedCell.pattern.code_id))}
                {" en "}
                {selectedCell.document.document_title}
              </h4>
            </div>
            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
              {formatAnalysisNumber(selectedCell.document.segment_count)}
              {" "}
              segmentos
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(selectedCell.document.segments ?? []).slice(0, 6).map((segment) => (
              <article
                key={segment.segment_id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-black text-slate-900">
                    {getSegmentDisplayTitle(segment)}
                  </p>
                  {segment.is_quote ? (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                      cita
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {truncateText(segment.selected_text, 190)}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CodeEvidenceExplorer({ codes = [], documentPatterns, visualActions }) {
  const patterns = documentPatterns?.patterns ?? [];
  const codeById = new Map(codes.map((code) => [code.id, code]));
  const [leafOnly, setLeafOnly] = useState(false);
  const codeTreeIndex = buildCodeTreeIndex(codes);
  const leafIds = new Set(codeTreeIndex.leafIds);
  const visiblePatterns = leafOnly
    ? patterns.filter((pattern) => leafIds.has(pattern.code_id))
    : patterns;
  const [selectedCodeId, setSelectedCodeId] = useState(
    patterns[0]?.code_id ?? null
  );
  const selectedPattern =
    visiblePatterns.find((pattern) => pattern.code_id === selectedCodeId) ??
    visiblePatterns[0];
  const selectedCode = selectedPattern
    ? codeById.get(selectedPattern.code_id)
    : null;
  const selectedEvidenceSegments = (selectedPattern?.documents ?? []).flatMap(
    (document) =>
      (document.segments ?? []).map((segment) => ({
        ...segment,
        document_title: document.document_title,
        document_type: document.document_type,
      }))
  );
  const effectiveVisualActions = selectedPattern
    ? {
        ...visualActions,
        title: `Citas de ${getCodeName(selectedCode)}`,
        prompt:
          "¿Qué matices aparecen cuando lees este código a través de varios documentos?",
        summary: `${getCodeName(selectedCode)} aparece en ${formatAnalysisNumber(
          selectedPattern.document_count
        )} documentos con ${formatAnalysisNumber(
          selectedPattern.total_segments
        )} segmentos.`,
        metrics: {
          codigo: getCodeName(selectedCode),
          documentos: selectedPattern.document_count,
          segmentos: selectedPattern.total_segments,
          citas: selectedPattern.quote_count ?? 0,
        },
        evidence: selectedEvidenceSegments.slice(0, 12),
        targets: uniqueTargets([
          {
            link_type: "code",
            id: selectedPattern.code_id,
            label: getCodeName(selectedCode),
          },
          ...selectedEvidenceSegments.slice(0, 10).map((segment) => ({
            link_type: "segment",
            id: segment.segment_id,
            label: getSegmentDisplayTitle(segment),
            excerpt: segment.selected_text,
          })),
        ]),
      }
    : visualActions;

  return (
    <section className="analysis-code-evidence analysis-reveal min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Lectura por codigo
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Citas y segmentos por documento
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Elige un codigo para leer en que documentos aparece y que evidencia
            sostiene ese patron.
          </p>
          <VisualToolbar visual={effectiveVisualActions} />
          <VisualAttachedMemos visual={effectiveVisualActions} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
              leafOnly
                ? "border-[#005944] bg-[#005944] text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setLeafOnly((value) => !value)}
          >
            <Icon name="filter_list" className="text-base" />
            Solo hojas
          </button>
          <Icon name="format_quote" className="text-2xl text-[#005944]" />
        </div>
      </div>

      {visiblePatterns.length ? (
        <div className="analysis-evidence-layout mt-4 grid min-w-0 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="analysis-evidence-list flex min-w-0 gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[460px] lg:space-y-2 lg:overflow-y-auto lg:pb-0">
            {visiblePatterns.slice(0, 12).map((pattern) => {
              const code = codeById.get(pattern.code_id);
              const active = selectedPattern?.code_id === pattern.code_id;

              return (
                <button
                  key={pattern.code_id}
                  type="button"
                  className={`min-w-[210px] rounded-xl border px-3 py-3 text-left transition lg:min-w-0 lg:w-full ${
                    active
                      ? "border-[#005944]/30 bg-[#005944]/10"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                  onClick={() => setSelectedCodeId(pattern.code_id)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: code?.color || "#0f766e" }}
                    />
                    <p className="min-w-0 truncate text-xs font-black text-slate-950">
                      {getCodeName(code)}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {formatAnalysisNumber(pattern.document_count)} docs,
                    {" "}
                    {formatAnalysisNumber(pattern.total_segments)} segmentos
                  </p>
                </button>
              );
            })}
          </div>

          <div className="analysis-evidence-panel min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-black text-slate-950">
                  {getCodeName(selectedCode)}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Aparece en {formatAnalysisNumber(selectedPattern?.document_count ?? 0)}
                  {" "}
                  documentos con {formatAnalysisNumber(selectedPattern?.quote_count ?? 0)}
                  {" "}
                  citas marcadas.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {(selectedPattern?.documents ?? []).map((document) => (
                <article
                  key={document.document_id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 truncate text-sm font-black text-slate-900">
                      {document.document_title}
                    </p>
                    <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {document.document_type || "documento"}
                    </span>
                  </div>
                  <div className="analysis-evidence-quotes mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                    {(document.segments ?? []).slice(0, 4).map((segment) => (
                      <div
                        key={segment.segment_id}
                        className="min-w-0 break-words rounded-lg bg-slate-50 p-3"
                      >
                        <p className="text-xs font-black text-slate-900">
                          {getSegmentDisplayTitle(segment)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {truncateText(segment.selected_text, 160)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            Codifica segmentos para explorar citas por codigo.
          </p>
        </div>
      )}
    </section>
  );
}

function FindingsPipeline({ overview, codeStats = [], documentPatterns, visualActions }) {
  const segments = pickMetric(overview, ["segments_count", "total_segments"]);
  const codedAssignments = pickMetric(overview, [
    "coded_segments_count",
    "coded_segments",
  ]);
  const memos = pickMetric(overview, ["memos_count", "total_memos"]);
  const frequentCodes = codeStats.filter((item) => getCodeStatValue(item) > 1).length;
  const transversalPatterns = (documentPatterns?.patterns ?? []).filter(
    (pattern) => pattern.document_count > 1
  ).length;
  const segmentBase = Math.max(1, segments);
  const evidenceStages = [
    {
      label: "Segmentos",
      value: segments,
      detail: `${formatAnalysisNumber(codedAssignments)} codificaciones`,
      percent: 100,
      x: 88,
    },
    {
      label: "Codigos",
      value: frequentCodes,
      detail: "categorias frecuentes",
      percent: Math.round((frequentCodes / segmentBase) * 100),
      x: 286,
    },
  ];
  const interpretationStages = [
    {
      label: "Patrones",
      value: transversalPatterns,
      detail: "cruces entre docs",
      percent: Math.round((transversalPatterns / segmentBase) * 100),
      x: 690,
    },
    {
      label: "Memos",
      value: memos,
      detail: "lecturas en construcción",
      percent: Math.round((memos / segmentBase) * 100),
      x: 880,
    },
  ];
  function thickness(value, maxValue) {
    return 16 + Math.sqrt(Math.max(0, value) / Math.max(1, maxValue)) * 66;
  }

  function smoothBand(points, centerY = 165) {
    const top = points.map((point) => ({
      x: point.x,
      y: centerY - point.width / 2,
    }));
    const bottom = [...points].reverse().map((point) => ({
      x: point.x,
      y: centerY + point.width / 2,
    }));
    const commands = [`M ${top[0].x} ${top[0].y}`];

    for (let index = 1; index < top.length; index += 1) {
      const previous = top[index - 1];
      const current = top[index];
      const midX = (previous.x + current.x) / 2;
      commands.push(`C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`);
    }

    commands.push(`L ${bottom[0].x} ${bottom[0].y}`);

    for (let index = 1; index < bottom.length; index += 1) {
      const previous = bottom[index - 1];
      const current = bottom[index];
      const midX = (previous.x + current.x) / 2;
      commands.push(`C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`);
    }

    commands.push("Z");
    return commands.join(" ");
  }

  const flowMax = Math.max(
    segments,
    frequentCodes,
    memos,
    transversalPatterns,
    1
  );
  const minFlowWidth = 14;
  const bridgeWidth = Math.max(
    minFlowWidth,
    Math.min(
      thickness(memos, flowMax),
      thickness(transversalPatterns, flowMax)
    ) * 0.78
  );
  const evidenceFlowPath = smoothBand([
    { x: 44, width: thickness(segments, flowMax) },
    { x: 190, width: thickness(frequentCodes, flowMax) },
    { x: 370, width: thickness(frequentCodes, flowMax) },
    { x: 520, width: bridgeWidth },
    { x: 560, width: bridgeWidth },
    { x: 600, width: bridgeWidth },
    { x: 690, width: thickness(transversalPatterns, flowMax) },
    { x: 760, width: thickness(transversalPatterns, flowMax) },
    { x: 936, width: Math.max(minFlowWidth, thickness(memos, flowMax)) },
  ]);

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Memos en construcción
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          De evidencia cruda a interpretacion
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Esta lectura muestra si el proyecto ya tiene soporte suficiente para
          pasar de codificacion a patrones y memos.
        </p>
        <VisualToolbar visual={visualActions} />
        <VisualAttachedMemos visual={visualActions} />
      </div>

      <div
        className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-emerald-100 bg-[#f7fbf9] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944]"
        role="region"
        aria-label="Flujo analítico: desplaza horizontalmente para ver todas las etapas"
        tabIndex={0}
      >
        <svg
          viewBox="0 0 980 330"
          className="min-h-[300px] w-full min-w-[820px]"
          role="img"
          aria-label="Flujo de evidencia hacia memos"
        >
          <defs>
            <linearGradient id="evidenceFlow" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#99f6e4" />
              <stop offset="42%" stopColor="#2dd4bf" />
              <stop offset="58%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <filter id="funnelSoftShadow" x="-10%" y="-20%" width="120%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="12" floodOpacity=".12" />
            </filter>
          </defs>

          {[190, 370, 560, 760].map((x) => (
            <line
              key={x}
              x1={x}
              y1="34"
              x2={x}
              y2="292"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          <text x="44" y="30" className="fill-[#005944] text-[12px] font-black uppercase tracking-widest">
            Reduccion analitica
          </text>
          <text x="628" y="30" className="fill-[#005944] text-[12px] font-black uppercase tracking-widest">
            Expansion interpretativa
          </text>

          {evidenceStages.map((stage) => (
            <g key={stage.label}>
              <text x={stage.x} y="62" textAnchor="middle" className="fill-slate-950 text-[28px] font-black">
                {formatAnalysisNumber(stage.value)}
              </text>
              <text x={stage.x} y="82" textAnchor="middle" className="fill-[#005944] text-[12px] font-black uppercase tracking-widest">
                {stage.label}
              </text>
              <text x={stage.x} y="99" textAnchor="middle" className="fill-slate-500 text-[12px] font-bold">
                {stage.percent}%
              </text>
            </g>
          ))}

          {interpretationStages.map((stage) => (
            <g key={stage.label}>
              <text x={stage.x} y="62" textAnchor="middle" className="fill-slate-950 text-[28px] font-black">
                {formatAnalysisNumber(stage.value)}
              </text>
              <text x={stage.x} y="82" textAnchor="middle" className="fill-[#005944] text-[12px] font-black uppercase tracking-widest">
                {stage.label}
              </text>
              <text x={stage.x} y="99" textAnchor="middle" className="fill-slate-500 text-[12px] font-bold">
                {stage.percent}%
              </text>
            </g>
          ))}

          <path
            filter="url(#funnelSoftShadow)"
            fill="url(#evidenceFlow)"
            fillOpacity=".88"
            d={evidenceFlowPath}
          />

          <g className="fill-slate-500 text-[11px] font-bold">
            <text x="88" y="286" textAnchor="middle">{evidenceStages[0].detail}</text>
            <text x="286" y="286" textAnchor="middle">{evidenceStages[1].detail}</text>
            <text x="690" y="286" textAnchor="middle">{interpretationStages[0].detail}</text>
            <text x="880" y="286" textAnchor="middle">{interpretationStages[1].detail}</text>
          </g>
        </svg>
      </div>
    </section>
  );
}

function ThematicSaturationChart({ documentPatterns, visualActions }) {
  const documents = documentPatterns?.documents ?? [];
  const patterns = documentPatterns?.patterns ?? [];
  const newCodesByDocumentId = new Map(documents.map((document) => [document.id, 0]));

  patterns.forEach((pattern) => {
    const firstDocument = documents.find((document) =>
      (pattern.documents ?? []).some((item) => item.document_id === document.id)
    );

    if (firstDocument) {
      newCodesByDocumentId.set(
        firstDocument.id,
        (newCodesByDocumentId.get(firstDocument.id) ?? 0) + 1
      );
    }
  });

  const rows = documents.map((document, index) => ({
    ...document,
    index: index + 1,
    newCodes: newCodesByDocumentId.get(document.id) ?? 0,
  }));
  const maxNewCodes = Math.max(1, ...rows.map((row) => row.newCodes));
  const lastNewCodes = rows.at(-1)?.newCodes ?? 0;

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Saturacion tematica
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            ¿Siguen apareciendo codigos nuevos?
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Si los ultimos documentos aportan pocos codigos nuevos, el corpus
            empieza a estabilizar sus temas.
          </p>
          <VisualToolbar visual={visualActions} />
          <VisualAttachedMemos visual={visualActions} />
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Lectura
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {lastNewCodes <= 1 ? "Saturacion cercana" : "Aun emergen temas"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 sm:grid-cols-[210px_minmax(0,1fr)_70px] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                Doc. {row.index}: {row.title}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {row.document_type || "documento"}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#005944] transition-[width] duration-500"
                style={{ width: `${Math.max(4, (row.newCodes / maxNewCodes) * 100)}%` }}
              />
            </div>
            <p className="text-sm font-black text-slate-700">
              {formatAnalysisNumber(row.newCodes)} nuevos
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CodeRelationshipNetwork({ codes = [], codeStats = [], relationships = [], visualActions }) {
  const statsByCodeId = buildStatsByCodeId(codeStats);
  const activeCodes = [...codes]
    .sort((a, b) => getUsageForCode(b, statsByCodeId) - getUsageForCode(a, statsByCodeId))
    .slice(0, 9);
  const activeIds = new Set(activeCodes.map((code) => code.id));
  const edges = relationships
    .filter(
      (relationship) =>
        activeIds.has(relationship.source_code_id) &&
        activeIds.has(relationship.target_code_id)
    )
    .slice(0, 18);
  const incidentUsageByCodeId = new Map();
  edges.forEach((edge) => {
    const shared = Number(edge.shared_segment_count ?? 0);
    incidentUsageByCodeId.set(
      edge.source_code_id,
      Math.max(incidentUsageByCodeId.get(edge.source_code_id) ?? 0, shared)
    );
    incidentUsageByCodeId.set(
      edge.target_code_id,
      Math.max(incidentUsageByCodeId.get(edge.target_code_id) ?? 0, shared)
    );
  });
  const width = 860;
  const height = 520;
  const center = { x: width / 2, y: height / 2 };
  const radius = activeCodes.length > 7 ? 220 : 195;
  const nodes = activeCodes.map((code, index) => {
    const angle =
      (index / Math.max(1, activeCodes.length)) * Math.PI * 2 -
      Math.PI / 2 +
      (index % 2 === 0 ? 0.03 : -0.03);
    return {
      code,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      angle,
      usage: Math.max(
        getUsageForCode(code, statsByCodeId),
        incidentUsageByCodeId.get(code.id) ?? 0
      ),
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.code.id, node]));
  const maxUsage = Math.max(1, ...nodes.map((node) => node.usage));
  const maxShared = Math.max(1, ...edges.map((edge) => edge.shared_segment_count ?? 0));

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Red de relaciones
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Codigos conectados por co-ocurrencia
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            El tamaño del nodo indica frecuencia; el grosor de la linea indica
            cuantos segmentos comparten dos codigos.
          </p>
          <VisualToolbar visual={visualActions} />
          <VisualAttachedMemos visual={visualActions} />
        </div>
        <Icon name="scatter_plot" className="text-2xl text-[#005944]" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px] rounded-xl bg-white"
          role="img"
          aria-label="Red visual de relaciones entre codigos"
        >
          <defs>
            <radialGradient id="networkBackdrop" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="65%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </radialGradient>
            <filter id="networkNodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="10" stdDeviation="10" floodOpacity=".12" />
            </filter>
          </defs>
          <rect x="0" y="0" width={width} height={height} rx="22" fill="url(#networkBackdrop)" />
          {[90, 150, 210].map((ring) => (
            <circle
              key={ring}
              cx={center.x}
              cy={center.y}
              r={ring}
              fill="none"
              stroke="#cbd5e1"
              strokeDasharray="6 8"
              strokeOpacity=".45"
            />
          ))}
          {edges.map((edge, edgeIndex) => {
            const source = nodeById.get(edge.source_code_id);
            const target = nodeById.get(edge.target_code_id);
            if (!source || !target) return null;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const direction = edgeIndex % 2 === 0 ? 1 : -1;
            const curveOffset =
              direction * (34 + (edge.shared_segment_count / maxShared) * 22);
            const curveX = (source.x + target.x) / 2 + (-dy / length) * curveOffset;
            const curveY = (source.y + target.y) / 2 + (dx / length) * curveOffset;

            return (
              <path
                key={`${edge.source_code_id}-${edge.target_code_id}`}
                d={`M ${source.x} ${source.y} Q ${curveX} ${curveY} ${target.x} ${target.y}`}
                fill="none"
                stroke="#005944"
                strokeLinecap="round"
                strokeOpacity={0.16 + (edge.shared_segment_count / maxShared) * 0.5}
                strokeWidth={1.5 + (edge.shared_segment_count / maxShared) * 8}
              />
            );
          })}
          {nodes.map((node) => {
            const size = 18 + (node.usage / maxUsage) * 22;
            const labelSide =
              Math.abs(Math.cos(node.angle)) > 0.45
                ? Math.sign(Math.cos(node.angle))
                : 0;
            const labelX = node.x + labelSide * (size + 34);
            const rawLabelY =
              labelSide === 0
                ? node.y + Math.sign(Math.sin(node.angle)) * (size + 42)
                : node.y - 10;
            const labelY = Math.min(height - 38, Math.max(20, rawLabelY));
            const textAnchor =
              labelSide > 0 ? "start" : labelSide < 0 ? "end" : "middle";
            const labelWidth = 128;
            const labelBgX =
              textAnchor === "start"
                ? labelX - 6
                : textAnchor === "end"
                  ? labelX - labelWidth + 6
                  : labelX - labelWidth / 2;

            return (
              <g key={node.code.id} className="analysis-node">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 10}
                  fill={`${node.code.color || "#0f766e"}14`}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  fill={`${node.code.color || "#0f766e"}24`}
                  stroke={node.code.color || "#0f766e"}
                  strokeWidth="2"
                  filter="url(#networkNodeShadow)"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={Math.max(5, size / 3.2)}
                  fill={node.code.color || "#0f766e"}
                />
                <rect
                  x={labelBgX}
                  y={labelY - 14}
                  width={labelWidth}
                  height="36"
                  rx="10"
                  fill="white"
                  fillOpacity=".86"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  className="fill-slate-900 text-[12px] font-black"
                >
                  {truncateText(getCodeName(node.code), 20)}
                </text>
                <text
                  x={labelX}
                  y={labelY + 16}
                  textAnchor={textAnchor}
                  className="fill-slate-500 text-[10px] font-bold"
                >
                  {formatAnalysisNumber(node.usage)} segmentos
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-center text-xs font-black text-[#005944]">
              Frecuencia (tamaño del nodo)
            </p>
            <div className="mt-3 flex items-center gap-3">
              {[8, 13, 18, 23, 28].map((size) => (
                <span
                  key={size}
                  className="rounded-full border-2 border-[#0f766e] bg-[#0f766e]/20"
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-6 text-xs text-slate-500">
              <span>Baja</span>
              <span>Alta</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pt-0">
          <div>
            <p className="text-center text-xs font-black text-[#005944]">
              Co-ocurrencia (grosor de la linea)
            </p>
            <div className="mt-4 flex items-center gap-4">
              {[2, 4, 7, 10].map((weight) => (
                <span
                  key={weight}
                  className="block w-16 rounded-full bg-[#005944]"
                  style={{ height: `${weight}px`, opacity: 0.28 + weight / 14 }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-6 text-xs text-slate-500">
              <span>Débil</span>
              <span>Fuerte</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContextComparison({ codes = [], groupComparisons, visualActions }) {
  const codeById = new Map(codes.map((code) => [code.id, code]));
  const groups = groupComparisons?.groups ?? [];
  const rows = (groupComparisons?.rows ?? []).slice(0, 8).map((row) => ({
    row,
    counts: new Map(
      groups.map((group) => [group.key, Number(row.counts?.[group.key] ?? 0)])
    ),
  }));
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => Array.from(row.counts.values()))
  );
  const comparisonLabel =
    groupComparisons?.attribute === "sample_group"
      ? "submuestra"
      : groupComparisons?.attribute === "participant_type"
        ? "tipo de participante"
        : "grupo";

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Comparacion por participante o grupo
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-950">
          Codigos por {comparisonLabel}
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Compara qué códigos pesan más en cada participante, grupo o contexto
          del corpus.
        </p>
        <VisualToolbar visual={visualActions} />
        <VisualAttachedMemos visual={visualActions} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-3">
        {groups.length && rows.length ? (
          <div
            className="grid min-w-[700px] gap-1"
            style={{
              gridTemplateColumns: `190px repeat(${groups.length}, minmax(120px, 1fr))`,
            }}
          >
            <div className="rounded-lg bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Codigo
            </div>
            {groups.map((group) => (
              <div
                key={group.key}
                className="rounded-lg bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500"
                title={group.label}
                aria-label={`Participante o grupo: ${group.label}`}
              >
                {truncateText(group.label, 18)}
              </div>
            ))}
            {rows.map(({ row, counts }) => {
              const code = codeById.get(row.code_id);

              return (
                <div key={row.code_id} className="contents">
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-3 py-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: code?.color || row.color || "#0f766e",
                      }}
                    />
                    <p className="truncate text-xs font-black text-slate-900">
                      {code ? getCodeName(code) : row.code_name}
                    </p>
                  </div>
                  {groups.map((group) => {
                    const value = counts.get(group.key) ?? 0;

                    return (
                      <div key={group.key} className="rounded-lg bg-white p-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#005944]"
                              style={{ width: `${(value / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-xs font-black text-slate-700">
                            {value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Agrega atributos a participantes y vincula documentos para
              comparar submuestras.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RelationshipMatrix({
  codes = [],
  codeStats = [],
  relationships = [],
  documentPatterns,
  visualActions,
}) {
  const [selectedMatrixKey, setSelectedMatrixKey] = useState(null);
  const statsByCodeId = buildStatsByCodeId(codeStats);
  const codesById = new Map(codes.map((code) => [code.id, code]));
  const codePatternById = new Map(
    (documentPatterns?.patterns ?? []).map((pattern) => [pattern.code_id, pattern])
  );
  const relationshipByKey = new Map(
    relationships.map((relationship) => [
      getRelationshipKey(
        relationship.source_code_id,
        relationship.target_code_id
      ),
      relationship,
    ])
  );
  const activeCodes = [...codes]
    .sort((a, b) => getUsageForCode(b, statsByCodeId) - getUsageForCode(a, statsByCodeId))
    .slice(0, 7);
  const maxShared = Math.max(
    1,
    ...relationships.map((relationship) => relationship.shared_segment_count ?? 0)
  );
  const selectedCodeId = selectedMatrixKey?.startsWith("code:")
    ? selectedMatrixKey.replace("code:", "")
    : null;
  const selectedCodePattern = selectedCodeId
    ? codePatternById.get(selectedCodeId)
    : null;
  const selectedRelationship =
    selectedMatrixKey && !selectedCodeId
      ? relationshipByKey.get(selectedMatrixKey)
      : relationships[0] || null;
  const selectedSegments = selectedCodePattern
    ? (selectedCodePattern.documents ?? []).flatMap((document) =>
        (document.segments ?? []).map((segment) => ({
          ...segment,
          document_title: document.document_title,
          document_type: document.document_type,
        }))
      )
    : selectedRelationship?.segments ?? [];
  const selectedTitle = selectedCodePattern
    ? getCodeName(codesById.get(selectedCodePattern.code_id))
    : selectedRelationship
      ? `${getCodeName(codesById.get(selectedRelationship.source_code_id))} + ${getCodeName(
          codesById.get(selectedRelationship.target_code_id)
        )}`
      : "";
  const selectedCount = selectedCodePattern
    ? selectedCodePattern.total_segments
    : selectedRelationship?.shared_segment_count ?? 0;
  const selectedRelationshipTargets = selectedRelationship
    ? [
        {
          link_type: "code",
          id: selectedRelationship.source_code_id,
          label: getCodeName(codesById.get(selectedRelationship.source_code_id)),
        },
        {
          link_type: "code",
          id: selectedRelationship.target_code_id,
          label: getCodeName(codesById.get(selectedRelationship.target_code_id)),
        },
        ...selectedSegments.slice(0, 10).map((segment) => ({
          link_type: "segment",
          id: segment.segment_id,
          label: getSegmentDisplayTitle(segment),
          excerpt: segment.selected_text,
        })),
      ]
    : [];
  const selectedCodeTargets = selectedCodePattern
    ? [
        {
          link_type: "code",
          id: selectedCodePattern.code_id,
          label: selectedTitle,
        },
        ...selectedSegments.slice(0, 10).map((segment) => ({
          link_type: "segment",
          id: segment.segment_id,
          label: getSegmentDisplayTitle(segment),
          excerpt: segment.selected_text,
        })),
      ]
    : [];
  const effectiveVisualActions = selectedTitle
    ? {
        ...visualActions,
        title: selectedCodePattern
          ? `Código: ${selectedTitle}`
          : `Cruce: ${selectedTitle}`,
        prompt: selectedCodePattern
          ? "¿Qué patrón interpretativo permite ver este código en sus segmentos?"
          : "¿Qué relación interpretativa aparece entre estos dos códigos y qué segmentos la sostienen?",
        summary: `${selectedTitle}: ${formatAnalysisNumber(
          selectedCount
        )} segmentos disponibles para lectura.`,
        metrics: {
          seleccion: selectedTitle,
          segmentos: selectedCount,
          tipo: selectedCodePattern ? "codigo" : "co-ocurrencia",
        },
        evidence: selectedSegments.slice(0, 10),
        targets: uniqueTargets(
          selectedCodePattern ? selectedCodeTargets : selectedRelationshipTargets
        ),
      }
    : visualActions;

  return (
    <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Relaciones entre codigos
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Matriz de co-ocurrencia
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Cada celda muestra codigos que aparecen juntos en el mismo segmento.
            Las celdas mas oscuras merecen lectura interpretativa.
          </p>
          <VisualToolbar visual={effectiveVisualActions} />
          <VisualAttachedMemos visual={effectiveVisualActions} />
        </div>
        <Icon name="hub" className="text-2xl text-[#005944]" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-3">
        {activeCodes.length > 1 ? (
          <div
            className="grid min-w-[620px] gap-1"
            style={{
              gridTemplateColumns: `150px repeat(${activeCodes.length}, minmax(54px, 1fr))`,
            }}
          >
            <div />
            {activeCodes.map((code) => (
              <div
                key={code.id}
                className="truncate rounded-lg bg-white px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500"
                title={getCodeName(code)}
              >
                {truncateText(getCodeName(code), 11)}
              </div>
            ))}

            {activeCodes.map((rowCode) => (
              <div key={rowCode.id} className="contents">
                <div
                  className="flex min-w-0 items-center gap-2 rounded-lg bg-white px-2 py-2"
                  title={getCodeName(rowCode)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rowCode.color || "#0f766e" }}
                  />
                  <span className="truncate text-xs font-black text-slate-800">
                    {getCodeName(rowCode)}
                  </span>
                </div>

                {activeCodes.map((columnCode) => {
                  const same = rowCode.id === columnCode.id;
                  const relationship = relationshipByKey.get(
                    getRelationshipKey(rowCode.id, columnCode.id)
                  );
                  const value = same
                    ? getUsageForCode(rowCode, statsByCodeId)
                    : relationship?.shared_segment_count ?? 0;
                  const intensity = same
                    ? 0.16
                    : Math.min(0.9, value / maxShared);

                  return (
                    <button
                      key={`${rowCode.id}-${columnCode.id}`}
                      type="button"
                      className="flex h-12 items-center justify-center rounded-lg text-xs font-black transition hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[#005944]/40 disabled:hover:scale-100"
                      aria-label={
                        same
                          ? `${getCodeName(rowCode)}: ${value} segmentos`
                          : `${getCodeName(rowCode)} + ${getCodeName(
                              columnCode
                            )}: ${value} segmentos compartidos`
                      }
                      onFocus={() => {
                        if (same && value) {
                          setSelectedMatrixKey(`code:${rowCode.id}`);
                        } else if (relationship) {
                          setSelectedMatrixKey(
                            getRelationshipKey(rowCode.id, columnCode.id)
                          );
                        }
                      }}
                      onClick={() => {
                        if (same && value) {
                          setSelectedMatrixKey(`code:${rowCode.id}`);
                        } else if (relationship) {
                          setSelectedMatrixKey(
                            getRelationshipKey(rowCode.id, columnCode.id)
                          );
                        }
                      }}
                      disabled={!value}
                      style={{
                        backgroundColor: same
                          ? "rgba(15, 118, 110, .12)"
                          : `rgba(0, 89, 68, ${0.08 + intensity * 0.5})`,
                        color: value ? "#042f2e" : "#94a3b8",
                      }}
                      title={
                        same
                          ? `${getCodeName(rowCode)}: ${value} segmentos`
                          : `${getCodeName(rowCode)} + ${getCodeName(
                              columnCode
                            )}: ${value} segmentos compartidos`
                      }
                    >
                      {value || "-"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Asigna dos o mas codigos a segmentos para revelar relaciones.
            </p>
          </div>
        )}
      </div>

      {selectedTitle ? (
        <div className="mt-4 rounded-2xl border border-[#005944]/20 bg-[#f8fbfa] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                {selectedCodePattern
                  ? "Segmentos de este codigo"
                  : "Segmentos que sostienen el cruce"}
              </p>
              <h4 className="mt-1 text-base font-black text-slate-950">
                {selectedTitle}
              </h4>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
              {formatAnalysisNumber(selectedCount)}
              {" "}
              segmentos
            </span>
          </div>

          <div className="mt-3 grid gap-2">
            {selectedSegments.slice(0, 8).map((segment) => (
              <article
                key={segment.segment_id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 truncate text-xs font-black text-slate-900">
                    {getSegmentDisplayTitle(segment)}
                  </p>
                  <p className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {truncateText(segment.document_title, 36)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {truncateText(segment.selected_text, 220)}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Haz click en una celda con número para leer los segmentos que explican
          esa relación.
        </p>
      )}
    </section>
  );
}

function RelationshipInsights({ codes = [], codeStats = [], relationships = [], visualActions }) {
  const [selectedCard, setSelectedCard] = useState("Cruce principal");
  const codesById = new Map(codes.map((code) => [code.id, code]));
  const statsByCodeId = buildStatsByCodeId(codeStats);
  const strongest = relationships[0];
  const dominant = [...codes].sort(
    (a, b) => getUsageForCode(b, statsByCodeId) - getUsageForCode(a, statsByCodeId)
  )[0];
  const relatedCodeIds = new Set(
    relationships.flatMap((relationship) => [
      relationship.source_code_id,
      relationship.target_code_id,
    ])
  );
  const isolated = codes.find((code) => !relatedCodeIds.has(code.id));

  const cards = [
    {
      icon: "hub",
      label: "Cruce principal",
      title: strongest
        ? `${getCodeName(codesById.get(strongest.source_code_id))} + ${getCodeName(
            codesById.get(strongest.target_code_id)
          )}`
        : "Sin cruces todavia",
      body: strongest
        ? `Comparten ${formatAnalysisNumber(
            strongest.shared_segment_count
          )} segmentos. Revisa si esta relacion indica dependencia, apoyo mutuo o tension.`
        : "Asigna varios codigos a un mismo segmento para empezar a ver relaciones.",
      value: strongest?.shared_segment_count ?? 0,
      max: Math.max(1, strongest?.shared_segment_count ?? 0),
      reading:
        "Un cruce no es una conclusión por sí mismo. Sirve para preguntar por qué dos códigos aparecen juntos y qué tipo de relación muestran los segmentos.",
      question:
        "¿Los segmentos compartidos muestran apoyo, tensión, dependencia o solo coincidencia de codificación?",
    },
    {
      icon: "center_focus_strong",
      label: "Categoria dominante",
      title: dominant ? getCodeName(dominant) : "Sin codigos",
      body: dominant
        ? `Tiene ${formatAnalysisNumber(
            getUsageForCode(dominant, statsByCodeId)
          )} segmentos. Pregunta si domina por relevancia teorica o por sobrerrepresentacion.`
        : "Crea codigos para identificar categorias dominantes.",
      value: dominant ? getUsageForCode(dominant, statsByCodeId) : 0,
      max: Math.max(
        1,
        ...codes.map((code) => getUsageForCode(code, statsByCodeId))
      ),
      reading:
        "Una categoría dominante puede ser central para la interpretación, pero también puede estar sobrerrepresentada por el tipo de documento o por cómo se segmentó.",
      question:
        "¿Este código domina porque explica mejor el fenómeno o porque aparece más en un documento específico?",
    },
    {
      icon: "scatter_plot",
      label: "Codigo aislado",
      title: isolated ? getCodeName(isolated) : "Sin aislamientos visibles",
      body: isolated
        ? "No aparece en cruces fuertes. Puede ser una excepcion, un caso limite o una categoria que necesita fusionarse."
        : "Todos los codigos visibles tienen algun cruce registrado.",
      value: isolated ? getUsageForCode(isolated, statsByCodeId) : 0,
      max: Math.max(
        1,
        ...codes.map((code) => getUsageForCode(code, statsByCodeId))
      ),
      reading:
        "Un código aislado no siempre está mal. En cualitativo puede señalar una excepción importante, un caso límite o una categoría que todavía necesita más evidencia.",
      question:
        "¿Este aislamiento revela un caso especial o conviene fusionarlo con otra categoría del codebook?",
    },
  ];
  const activeCard =
    cards.find((card) => card.label === selectedCard) ?? cards[0];
  const activePercent = Math.min(
    100,
    Math.round((Number(activeCard?.value ?? 0) / Math.max(1, activeCard?.max ?? 1)) * 100)
  );

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <VisualToolbar visual={visualActions} />
        <VisualAttachedMemos visual={visualActions} />
      </div>
      {cards.map((card, index) => (
        <button
          key={card.label}
          type="button"
          className={`analysis-reveal min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#005944]/30 ${
            activeCard?.label === card.label
              ? "border-[#005944]/30 bg-[#f3fbf7]"
              : "border-slate-200 bg-white"
          }`}
          style={{ animationDelay: `${index * 80}ms` }}
          onClick={() => setSelectedCard(card.label)}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
              <Icon name={card.icon} className="text-xl" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {card.label}
              </p>
              <h3 className="mt-1 break-words text-base font-black text-slate-950">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {card.body}
              </p>
            </div>
          </div>
        </button>
      ))}
      {activeCard ? (
        <div className="analysis-reveal rounded-2xl border border-[#005944]/20 bg-white p-4 lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                Lectura sugerida
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">
                {activeCard.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                {activeCard.reading}
              </p>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-bold leading-relaxed text-slate-700">
                {activeCard.question}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f8fbfa] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Soporte relativo
              </p>
              <p className="mt-1 text-3xl font-black text-slate-950">
                {formatAnalysisNumber(activeCard.value)}
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#005944] transition-[width] duration-300"
                  style={{ width: `${Math.max(6, activePercent)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {activePercent}% del máximo comparable en este panel.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SavedDashboardViews({
  views,
  viewName,
  onNameChange,
  onSave,
  onRestore,
  onRemove,
}) {
  return (
    <div className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Vistas guardadas
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Guarda el foco actual del dashboard para retomarlo despues.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={viewName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Nombre de vista"
            className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#005944]/40 focus:bg-white focus:ring-2 focus:ring-[#005944]/10"
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-sm font-black text-white transition hover:bg-[#004332] focus:outline-none focus:ring-2 focus:ring-[#005944]/25"
            onClick={onSave}
          >
            <Icon name="bookmark_add" className="text-base" />
            Guardar vista
          </button>
        </div>
      </div>

      {views.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {views.map((view) => (
            <span
              key={view.id}
              className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 text-xs font-black text-[#005944]"
            >
              <button
                type="button"
                className="min-w-0 truncate px-3 py-1.5 text-left"
                onClick={() => onRestore(view)}
                title={view.name}
              >
                {view.name}
              </button>
              <button
                type="button"
                className="border-l border-emerald-100 px-2 py-1.5 text-[#005944]/70 transition hover:text-red-600"
                onClick={() => onRemove(view.id)}
                title="Eliminar vista"
              >
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AnalysisOverviewSection() {
  const { projectId } = useAnalysisContext();
  const [exportError, setExportError] = useState("");
  const [activeStoryPage, setActiveStoryPage] = useState("evidence");
  const [savedViews, setSavedViews] = useState([]);
  const [dashboardViewName, setDashboardViewName] = useState("");
  const [memoVisual, setMemoVisual] = useState(null);
  const [memoError, setMemoError] = useState("");
  const [memoDraft, setMemoDraft] = useState({
    title: "",
    body: "",
    memo_type: "analytic",
    status: "draft",
    tags: "dashboard, visual",
  });
  const [savingMemo, setSavingMemo] = useState(false);
  const memoManager = useAnalysisMemos(projectId);
  const {
    overview,
    codeStats,
    codes,
    codeRelationships,
    documentPatterns,
    groupComparisons,
    uncodedSegments,
    loading,
    refreshing,
    errorMsg,
    reload,
  } = useAnalysisOverview(projectId);
  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;

    const storageKey = buildDashboardViewStorageKey(projectId);
    setSavedViews(parseDashboardViews(window.localStorage.getItem(storageKey)));
  }, [projectId]);

  function persistSavedViews(nextViews) {
    setSavedViews(nextViews);

    if (projectId && typeof window !== "undefined") {
      window.localStorage.setItem(
        buildDashboardViewStorageKey(projectId),
        JSON.stringify(nextViews)
      );
    }
  }

  function saveDashboardView() {
    const page = storyPages.find((item) => item.id === activeStoryPage);
    const name =
      dashboardViewName.trim() ||
      `${page?.title ?? "Dashboard"} - ${formatAnalysisDate(new Date().toISOString())}`;
    const nextViews = upsertDashboardView(savedViews, {
      id: `view-${activeStoryPage}-${Date.now()}`,
      name,
      storyPage: activeStoryPage,
      visualId: activeStoryPage,
      visualTitle: page?.title ?? "Dashboard analitico",
    });

    persistSavedViews(nextViews);
    setDashboardViewName("");
  }

  function restoreDashboardView(view) {
    if (view?.storyPage) {
      setActiveStoryPage(view.storyPage === "findings" ? "memos" : view.storyPage);
    }
  }

  function removeDashboardView(viewId) {
    persistSavedViews(savedViews.filter((view) => view.id !== viewId));
  }

  function getVisualMemos(visualId) {
    return memoManager.memos.filter(
      (memo) => memo?.metadata?.source_visual === visualId
    );
  }

  function discussVisual(visual) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent(ANALYSIS_VISUAL_EVENT, {
        detail: {
          id: visual.id,
          title: visual.title,
          prompt: visual.prompt,
          summary: visual.summary,
          metrics: visual.metrics,
          evidence: visual.evidence,
          targets: visual.targets,
          memoCount: visual.memos?.length ?? 0,
        },
      })
    );
  }

  function openAttachMemo(visual) {
    setMemoVisual(visual);
    setMemoDraft({
      title: "",
      body:
        visual.summary || visual.prompt || "Describe la interpretación que ves en este visual.",
      memo_type: "analytic",
      status: "draft",
      tags: "dashboard, visual",
    });
    setMemoError("");
  }

  async function saveAttachedMemo() {
    const title = memoDraft.title.trim();
    if (!title || !memoVisual) {
      setMemoError("Escribe un título para el memo.");
      return;
    }

    try {
      setSavingMemo(true);
      setMemoError("");
      const created = await createAnalysisMemo(projectId, {
        ...buildMemoCreatePayload(memoDraft),
        metadata: {
          source_visual: memoVisual.id,
          source_visual_title: memoVisual.title,
          source_visual_prompt: memoVisual.prompt,
          source_visual_summary: memoVisual.summary,
          suggested_targets: uniqueTargets(memoVisual.targets),
        },
      });
      const memoId = created?.memo?.id;
      const linkTargets = uniqueTargets(memoVisual.targets)
        .filter((target) =>
          ["document", "segment", "code", "participant"].includes(
            target.link_type
          )
        )
        .map(targetPayload)
        .filter(Boolean);

      if (memoId) {
        await Promise.allSettled(
          linkTargets.map((payload) =>
            createAnalysisMemoLink(projectId, memoId, payload)
          )
        );
      }
      setMemoVisual(null);
      setMemoDraft({
        title: "",
        body: "",
        memo_type: "analytic",
        status: "draft",
        tags: "dashboard, visual",
      });
      await Promise.all([reload(), memoManager.reload()]);
    } catch (error) {
      setMemoError(error?.message ?? "No se pudo crear el memo.");
    } finally {
      setSavingMemo(false);
    }
  }

  function buildVisualPayload(id) {
    const totalSegments = pickMetric(overview, [
      "total_segments",
      "segments_count",
    ]);
    const codedAssignments = pickMetric(overview, [
      "coded_segments",
      "coded_segments_count",
      "total_coded_segments",
    ]);
    const uncodedSegments = pickMetric(overview, [
      "uncoded_segments",
      "uncoded_segments_count",
      "total_uncoded_segments",
    ]);
    const totalCodes = pickMetric(overview, ["total_codes", "codes_count"]);
    const totalMemos = pickMetric(overview, ["total_memos", "memos_count"]);
    const totalQuotes = pickMetric(overview, ["total_quotes", "quotes_count"]);
    const coverage = totalSegments
      ? Math.min(
          100,
          Math.round((Math.min(codedAssignments, totalSegments) / totalSegments) * 100)
        )
      : 0;
    const strongestCode = codeStats[0];
    const strongestRelation = codeRelationships[0];
    const topCodes = codeStats.slice(0, 6).map((code) => ({
      code_id: code.code_id ?? code.id,
      name: code.code_name ?? code.name,
      segment_count: getCodeStatValue(code),
    }));
    const topDocuments = (documentPatterns?.documents ?? []).slice(0, 5).map((document) => ({
      document_id: document.document_id ?? document.id,
      title: document.title,
      type: document.document_type ?? document.type,
    }));
    const repeatedPatterns = (documentPatterns?.patterns ?? []).slice(0, 8).map((pattern) => ({
      code_id: pattern.code_id,
      code_name:
        codes.find((code) => code.id === pattern.code_id)?.name ??
        pattern.code_name,
      document_count: pattern.document_count,
      segment_count: pattern.segment_count,
    }));
    const relationshipEvidence = codeRelationships.slice(0, 8).map((relationship) => ({
      source_code: relationship.source_code_name,
      target_code: relationship.target_code_name,
      shared_segment_count: relationship.shared_segment_count,
    }));

    const payloads = {
      "evidence-command-center": {
        summary:
          "Vista de cobertura y salud analitica del corpus: muestra si la evidencia marcada ya permite discutir patrones.",
        metrics: [
          { label: "Segmentos", value: totalSegments },
          { label: "Codificaciones", value: codedAssignments },
          { label: "Pendientes sin codigo", value: uncodedSegments },
          { label: "Codigos activos", value: totalCodes },
          { label: "Memos", value: totalMemos },
          { label: "Citas", value: totalQuotes },
          { label: "Cobertura", value: `${coverage}%` },
          {
            label: "Codigo dominante",
            value: strongestCode?.code_name ?? strongestCode?.name ?? "Sin datos",
          },
          {
            label: "Cruce mas fuerte",
            value: strongestRelation
              ? `${strongestRelation.shared_segment_count} segmentos compartidos`
              : "Sin cruces",
          },
        ],
        evidence: [
          ...topCodes.map((code) => ({
            type: "codigo frecuente",
            label: code.name,
            value: `${code.segment_count} segmentos`,
          })),
          ...relationshipEvidence.slice(0, 3).map((relationship) => ({
            type: "relacion detectada",
            label: `${relationship.source_code} + ${relationship.target_code}`,
            value: `${relationship.shared_segment_count} segmentos compartidos`,
          })),
        ],
      },
      "findings-pipeline": {
        summary:
          "Funnel interpretativo que muestra como el analisis convierte evidencia cruda en codigos y memos antes de sintetizar una lectura.",
        metrics: [
          { label: "Segmentos", value: totalSegments },
          { label: "Codigos", value: totalCodes },
          { label: "Memos", value: totalMemos },
          { label: "Patrones entre documentos", value: repeatedPatterns.length },
          { label: "Memos vinculados", value: memoManager.memos.length },
        ],
        evidence: repeatedPatterns.slice(0, 5).map((pattern) => ({
          type: "patron transversal",
          label: pattern.code_name,
          value: `${pattern.document_count ?? 0} docs, ${pattern.segment_count ?? 0} segmentos`,
        })),
      },
      "thematic-saturation": {
        summary:
          "Lectura de saturacion: ayuda a ver si cada documento sigue aportando codigos nuevos o confirma patrones existentes.",
        metrics: topDocuments.map((document, index) => ({
          label: document.title ?? `Documento ${index + 1}`,
          value:
            (documentPatterns?.documents?.[index]?.new_code_count ??
              documentPatterns?.documents?.[index]?.codes_count ??
              0),
        })),
        evidence: repeatedPatterns.slice(0, 6).map((pattern) => ({
          type: "codigo repetido",
          label: pattern.code_name,
          value: `${pattern.document_count ?? 0} documentos`,
        })),
      },
      "code-tree": {
        summary:
          "Arbol conceptual del codebook: separa codigos padre e hijos para revisar jerarquia, peso y categorias sin evidencia directa.",
        metrics: [
          { label: "Codigos totales", value: codes.length },
          { label: "Codigos raiz", value: codes.filter((code) => !code.parent_code_id).length },
          { label: "Codigos hijos", value: codes.filter((code) => code.parent_code_id).length },
        ],
        evidence: topCodes.map((code) => ({
          type: "nodo con mayor peso",
          label: code.name,
          value: `${code.segment_count} segmentos`,
        })),
      },
      "document-pattern-map": {
        summary:
          "Matriz de patrones entre documentos: muestra que codigos se repiten y donde se concentra cada patron transversal.",
        metrics: [
          { label: "Documentos comparados", value: topDocuments.length },
          { label: "Patrones visibles", value: repeatedPatterns.length },
        ],
        evidence: repeatedPatterns,
      },
      "code-evidence-explorer": {
        summary:
          "Explorador de citas por codigo: permite ver en que documentos aparece un codigo y que segmentos sostienen esa lectura.",
        metrics: [
          { label: "Codigos con evidencia", value: repeatedPatterns.length },
          { label: "Documentos con evidencia", value: topDocuments.length },
        ],
        evidence: repeatedPatterns,
      },
      "code-relationship-network": {
        summary:
          "Red de co-ocurrencia: los nodos son codigos, el tamano representa frecuencia y las lineas muestran segmentos compartidos.",
        metrics: [
          { label: "Relaciones detectadas", value: codeRelationships.length },
          {
            label: "Relacion mas fuerte",
            value: strongestRelation
              ? `${strongestRelation.shared_segment_count} segmentos`
              : "Sin cruces",
          },
        ],
        evidence: relationshipEvidence,
      },
      "relationship-matrix": {
        summary:
          "Matriz de co-ocurrencia: cada celda indica cuantos segmentos comparten dos codigos y permite inspeccionar la evidencia del cruce.",
        metrics: [
          { label: "Cruces detectados", value: codeRelationships.length },
          {
            label: "Cruce mas fuerte",
            value: strongestRelation
              ? `${strongestRelation.shared_segment_count} segmentos`
              : "Sin cruces",
          },
        ],
        evidence: relationshipEvidence,
      },
      "context-comparison": {
        summary:
          "Comparacion por participante o grupo: ayuda a ver si un codigo pesa distinto segun submuestras reales.",
        metrics: [
          { label: "Codigos comparados", value: topCodes.length },
          { label: "Grupos", value: groupComparisons?.groups?.length ?? 0 },
        ],
        evidence: (groupComparisons?.rows ?? []).slice(0, 6).map((row) => ({
          type: "comparacion por grupo",
          label: row.code_name,
          value: `${row.total_segments ?? 0} segmentos`,
        })),
      },
      "relationship-insights": {
        summary:
          "Lecturas interpretativas sugeridas: resume cruces, categorias dominantes y posibles excepciones para convertirlas en memos.",
        metrics: [
          { label: "Lecturas sugeridas", value: 3 },
          { label: "Relaciones disponibles", value: codeRelationships.length },
        ],
        evidence: relationshipEvidence.slice(0, 6),
      },
    };

    return payloads[id] ?? {
      summary:
        "Visual analitico del dashboard con datos del corpus, codigos y evidencia cualitativa.",
      metrics: [
        { label: "Segmentos", value: totalSegments },
        { label: "Codigos", value: totalCodes },
        { label: "Memos", value: totalMemos },
      ],
      evidence: [...topCodes, ...relationshipEvidence].slice(0, 8),
    };
  }

  function buildVisualActions(id, title, prompt, options = {}) {
    const defaultPayload = buildVisualPayload(id);

    return {
      id,
      title,
      prompt,
      summary: options.summary ?? defaultPayload.summary,
      metrics: options.metrics ?? defaultPayload.metrics,
      evidence: options.evidence ?? defaultPayload.evidence,
      targets: uniqueTargets(options.targets),
      memos: getVisualMemos(id),
      onDiscuss: discussVisual,
      onAttach: openAttachMemo,
    };
  }

  const storyPages = [
    {
      id: "evidence",
      title: "1. Evidencia",
      subtitle: "Como avanza hacia memos",
    },
    {
      id: "patterns",
      title: "2. Patrones",
      subtitle: "Como se repiten entre documentos",
    },
    {
      id: "relations",
      title: "3. Relaciones",
      subtitle: "Como se conectan los codigos",
    },
    {
      id: "memos",
      title: "4. Memos",
      subtitle: "Interpretar antes de sintetizar",
    },
  ];

  return (
    <WorkspaceEditorCard
      title="Dashboard analitico"
      icon="analytics"
      savingState={refreshing ? "saving" : "idle"}
      savingError={exportError || errorMsg}
      secondaryActions={[
        {
          icon: "refresh",
          label: "Actualizar",
          onClick: reload,
          disabled: loading || refreshing,
        },
        createProjectExportAction({
          projectId,
          exportType: "dashboard",
          format: "pdf",
          label: "Exportar dashboard",
          onError: setExportError,
        }),
        createProjectExportAction({
          projectId,
          exportType: "evidence",
          format: "docx",
          label: "Evidencias",
          onError: setExportError,
        }),
        createProjectExportAction({
          projectId,
          exportType: "bundle",
          format: "zip",
          label: "Paquete evidencias",
          onError: setExportError,
          icon: "archive",
          query: { scope: "evidence" },
        }),
        createProjectExportAction({
          projectId,
          exportType: "bundle",
          format: "zip",
          label: "Paquete reporte",
          onError: setExportError,
          icon: "folder_zip",
          query: { scope: "report" },
        }),
        createProjectExportAction({
          projectId,
          exportType: "bundle",
          format: "zip",
          label: "Todo ZIP",
          onError: setExportError,
          icon: "inventory_2",
          query: { scope: "all" },
        }),
      ]}
    >
      {exportError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{exportError}</p> : null}
      <DashboardStyles />
      <ErrorBanner message={errorMsg} onRetry={reload} />

      {loading && !overview ? <AnalysisDashboardSkeleton /> : null}

      {!loading || overview ? (
      <SavedDashboardViews
        views={savedViews}
        viewName={dashboardViewName}
        onNameChange={setDashboardViewName}
        onSave={saveDashboardView}
        onRestore={restoreDashboardView}
        onRemove={removeDashboardView}
      />
      ) : null}

      {!loading || overview ? (
      <div className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-2">
        <div className="grid gap-2 md:grid-cols-4">
          {storyPages.map((page) => {
            const active = activeStoryPage === page.id;

            return (
              <button
                key={page.id}
                type="button"
                className={`rounded-xl px-4 py-3 text-left transition ${
                  active
                    ? "bg-[#005944] text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setActiveStoryPage(page.id)}
              >
                <p className="text-sm font-black">{page.title}</p>
                <p className={`mt-0.5 text-xs ${active ? "text-white/75" : "text-slate-500"}`}>
                  {page.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      ) : null}

      {(!loading || overview) && activeStoryPage === "evidence" ? (
        <>
          <EvidenceCommandCenter
            overview={overview}
            codeStats={codeStats}
            relationships={codeRelationships}
            visualActions={buildVisualActions(
              "evidence-command-center",
              "Lectura accionable del corpus",
              "¿Qué métrica cambia la interpretación del corpus y qué evidencia concreta la sostiene?"
            )}
          />
          <FindingsPipeline
            overview={overview}
            codeStats={codeStats}
            documentPatterns={documentPatterns}
            visualActions={buildVisualActions(
              "findings-pipeline",
              "Flujo de evidencia a memos",
              "¿En qué punto el análisis deja de ser conteo y empieza a tomar forma como memo?"
            )}
          />
          <ThematicSaturationChart
            documentPatterns={documentPatterns}
            visualActions={buildVisualActions(
              "thematic-saturation",
              "Saturación temática",
              "¿Los últimos documentos todavía aportan temas nuevos o confirman patrones existentes?"
            )}
          />
        </>
      ) : null}

      {(!loading || overview) && activeStoryPage === "patterns" ? (
        <>
          <CodeTreeVisual
            codes={codes}
            codeStats={codeStats}
            visualActions={buildVisualActions(
              "code-tree",
              "Árbol de códigos",
              "¿Qué rama del codebook organiza mejor la interpretación y cuál necesita revisión?"
            )}
          />
          <DocumentPatternMap
            codes={codes}
            documentPatterns={documentPatterns}
            visualActions={buildVisualActions(
              "document-pattern-map",
              "Códigos repetidos por documento",
              "¿Qué código aparece de forma transversal y qué significa que se repita en distintos documentos?"
            )}
          />
          <CodeEvidenceExplorer
            codes={codes}
            documentPatterns={documentPatterns}
            visualActions={buildVisualActions(
              "code-evidence-explorer",
              "Citas y segmentos por documento",
              "¿Qué citas sostienen mejor este código y cuáles muestran matices o contradicciones?"
            )}
          />
        </>
      ) : null}

      {(!loading || overview) && activeStoryPage === "relations" ? (
        <>
          <CodeRelationshipNetwork
            codes={codes}
            codeStats={codeStats}
            relationships={codeRelationships}
            visualActions={buildVisualActions(
              "code-relationship-network",
              "Red de relaciones entre códigos",
              "¿Qué conexión entre códigos parece antropológicamente más importante y por qué?"
            )}
          />
          <RelationshipMatrix
            codes={codes}
            codeStats={codeStats}
            relationships={codeRelationships}
            documentPatterns={documentPatterns}
            visualActions={buildVisualActions(
              "relationship-matrix",
              "Matriz de co-ocurrencia",
              "¿Qué celda de la matriz sugiere una relación teórica, una tensión o una excepción?"
            )}
          />
          <ContextComparison
            codes={codes}
            groupComparisons={groupComparisons}
            visualActions={buildVisualActions(
              "context-comparison",
              "Comparación por participante o grupo",
              "¿Qué cambia cuando miras el patrón por participante, grupo o contexto?"
            )}
          />
          <RelationshipInsights
            codes={codes}
            codeStats={codeStats}
            relationships={codeRelationships}
            visualActions={buildVisualActions(
              "relationship-insights",
              "Lecturas interpretativas sugeridas",
              "¿Cuál de estas lecturas merece convertirse en memo y qué evidencia necesita?"
            )}
          />
        </>
      ) : null}

      {(!loading || overview) && activeStoryPage === "memos" ? (
        <AnalysisMemosDashboardView projectId={projectId} manager={memoManager} />
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Acciones rapidas
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-900">
            Siguiente movimiento analitico
          </h3>
        </div>
        <AnalysisQuickActions />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Segmentos sin codificar
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              Evidencia pendiente
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            Usalos para mantener vivo el arbol de codigos.
          </p>
        </div>

        <AnalysisUncodedSegmentsPanel
          projectId={projectId}
          segments={uncodedSegments}
          loading={loading}
        />
      </div>

      <AnalysisMemoFormModal
        open={Boolean(memoVisual)}
        form={memoDraft}
        editingMemo={null}
        saving={savingMemo}
        error={memoError}
        onClose={() => setMemoVisual(null)}
        onFieldChange={(field, value) =>
          setMemoDraft((current) => ({ ...current, [field]: value }))
        }
        onSave={saveAttachedMemo}
      />
    </WorkspaceEditorCard>
  );
}
