"use client";

import Icon from "@/components/common/Icon";
import EvaluationSummaryCard from "@/features/projects/workspace/components/EvaluationSummaryCard";
import {
  getDelimitationFieldTarget,
  navigateToWorkspaceField,
} from "@/features/projects/workspace/field-navigation";
import {
  buildDelimitationHeuristicSummary,
  buildDelimitationSummaryMetrics,
} from "@/features/projects/workspace/reviewSidebar.helpers";

function LoadingSignalCard({ icon }) {
  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
        <Icon name={icon} className="text-lg text-slate-300" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-[88%] animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-[66%] animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function verdictLabel(verdict) {
  switch (verdict) {
    case "bien_delimitada":
      return "Bien delimitada";
    case "mejorable":
      return "Mejorable";
    case "muy_amplia":
      return "Muy amplia";
    default:
      return "Sin evaluación";
  }
}

function scoreBadgeClasses(score) {
  if (score >= 80) {
    return "border-[#005944]/20 bg-[#005944]/8 text-[#005944]";
  }

  if (score >= 60) {
    return "border-yellow-200 bg-yellow-50 text-[#854D0E]";
  }

  return "border-orange-200 bg-orange-50 text-[#C2410C]";
}

function fieldLabel(field) {
  switch (field) {
    case "topic":
      return "Tema de investigación";
    case "context_place":
      return "Contexto espacial";
    case "time_period":
      return "Periodo";
    case "population":
      return "Población";
    case "resources":
      return "Recursos";
    case "include":
      return "Criterios de inclusión";
    case "exclude":
      return "Criterios de exclusión";
    case "overall":
      return "Delimitación general";
    default:
      return "Campo evaluado";
  }
}

function defaultSignalTitle(signal) {
  const field = signal?.field;

  if (field === "topic") return "El tema todavía está demasiado abierto";
  if (field === "context_place") return "Falta acotar mejor el lugar";
  if (field === "time_period") return "Falta cerrar mejor el periodo";
  if (field === "population") return "La población necesita más precisión";
  if (field === "resources") return "Los recursos necesitan mayor concreción";
  if (field === "include") return "Los criterios de inclusión necesitan claridad";
  if (field === "exclude") return "Los criterios de exclusión necesitan claridad";

  return signal?.level || "Señal detectada";
}

function defaultSignalSuggestion(signal) {
  const field = signal?.field;

  if (field === "topic") {
    return "Reformula el tema agregando una dimensión observable. Por ejemplo: efecto, relación, percepción, uso, experiencia, incidencia o comparación.";
  }

  if (field === "context_place") {
    return "Indica el lugar exacto donde ocurrirá el estudio: ciudad, municipio, comunidad, institución, sede o zona específica.";
  }

  if (field === "time_period") {
    return "Cambia expresiones como “actualmente” o “últimos años” por fechas, meses, ciclos o años concretos.";
  }

  if (field === "population") {
    return "Agrega rasgos que diferencien al grupo: edad, grado, rol, institución, condición, sector, cargo o ubicación.";
  }

  if (field === "resources") {
    return "Menciona fuentes, bases, documentos, instituciones, herramientas o accesos reales disponibles.";
  }

  if (field === "include") {
    return "Especifica qué casos, documentos, personas o unidades sí entran en el estudio y bajo qué condición.";
  }

  if (field === "exclude") {
    return "Especifica qué casos, documentos, personas o unidades quedan fuera para evitar que el alcance se abra demasiado.";
  }

  return "Revisa este punto y conviértelo en una acción concreta de edición.";
}

function normalizeSignal(signal = {}) {
  return {
    ...signal,
    field: String(signal?.field ?? "overall").trim(),
    level: String(signal?.level ?? "Detalle").trim(),
    title: String(signal?.title ?? "").trim() || defaultSignalTitle(signal),
    message:
      String(signal?.message ?? "").trim() ||
      String(signal?.text ?? "").trim() ||
      "Hay un punto de la delimitación que conviene revisar.",
    suggestion:
      String(signal?.suggestion ?? "").trim() || defaultSignalSuggestion(signal),
  };
}

function canNavigateToField(field) {
  return Boolean(field && field !== "overall" && field !== "coherence");
}

function SignalCard({ signal }) {
  const item = normalizeSignal(signal);
  const canNavigate = canNavigateToField(item.field);

  function handleNavigate() {
    if (!canNavigate) return;

    navigateToWorkspaceField(getDelimitationFieldTarget(item.field));
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      disabled={!canNavigate}
      className={`group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all ${
        canNavigate
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[#005944]/25 hover:shadow-md"
          : "cursor-default"
      }`}
      title={canNavigate ? `Ir a ${fieldLabel(item.field)}` : undefined}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              {fieldLabel(item.field)}
            </p>

            {canNavigate ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#005944]/10 bg-[#005944]/5 px-2 py-0.5 text-[9px] font-black text-[#005944] opacity-0 transition-opacity group-hover:opacity-100">
                <Icon name="ads_click" className="text-[12px]" />
                Ir al campo
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm font-black leading-snug text-slate-900">
            {item.title}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black ${item.bg} ${item.color}`}
        >
          {item.level}
        </span>
      </div>

      <div className={`rounded-xl border border-slate-200 ${item.bg} p-3`}>
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
          Qué pasa
        </p>
        <p className="font-serif text-xs leading-relaxed text-slate-700">
          {item.message}
        </p>
      </div>

      {item.suggestion ? (
        <div className="mt-3 rounded-xl border border-[#005944]/10 bg-[#005944]/5 px-3 py-2.5">
          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#005944]/70">
            Cómo corregirlo
          </p>
          <p className="text-xs leading-relaxed text-slate-700">
            {item.suggestion}
          </p>
        </div>
      ) : null}
    </button>
  );
}

function SignalGroup({ title, signals }) {
  if (!signals.length) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      {signals.map((signal, index) => (
        <SignalCard
          key={`${signal?.field ?? "signal"}-${index}`}
          signal={signal}
        />
      ))}
    </div>
  );
}

export default function QualityPanel({
  loading = false,
  model = {},
  heuristics = {},
  signals = [],
  review = null,
}) {
  const safeSignals = Array.isArray(signals) ? signals.slice(0, 4) : [];
  const signalSource =
    Array.isArray(review?.signals) && review.signals.length
      ? review.signals
      : safeSignals;
  const activeSignals = signalSource.filter(
    (signal) => signal?.field !== "overall",
  );

  const activeSummary = review?.summary || "";
  const activeNextStep = review?.suggestedNextStep || "";
  const heuristicSummary = buildDelimitationHeuristicSummary({
    model,
    heuristics,
  });
  const score =
    typeof review?.overall?.score === "number"
      ? review.overall.score
      : heuristicSummary.score;
  const verdict = review?.overall?.verdict
    ? verdictLabel(review.overall.verdict)
    : heuristicSummary.verdict;
  const isHeuristicReview = review?.source === "heuristic";
  const summaryMetrics = review
    ? buildDelimitationSummaryMetrics(review)
    : heuristicSummary.metrics;
  const summaryBadge =
    score !== null
      ? scoreBadgeClasses(score)
      : "border-slate-200 bg-slate-50 text-slate-500";
  const signalGroups = [
    ["Tema", "topic"],
    ["Población", "population"],
    ["Contexto espacial", "context_place"],
    ["Periodo", "time_period"],
    ["Recursos", "resources"],
    ["Criterios de inclusión", "include"],
    ["Criterios de exclusión", "exclude"],
  ].map(([title, field]) => ({
    title,
    signals: activeSignals.filter((signal) => signal?.field === field),
  }));

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-100 p-6">
        <Icon name="analytics" className="text-[#005944]" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          Señales de calidad
        </h3>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {loading ? (
          <>
            <LoadingSignalCard icon="edit_note" />
            <LoadingSignalCard icon="location_on" />
            <LoadingSignalCard icon="event" />
          </>
        ) : (
          <>
            <EvaluationSummaryCard
              statusTitle="Estado general de la delimitación"
              statusLabel={verdict}
              statusBadge={summaryBadge}
              metrics={summaryMetrics}
            />

            {review ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {isHeuristicReview
                      ? "Evaluación heurística"
                      : "Evaluación IA"}
                  </p>

                  <p className="font-serif text-xs leading-relaxed text-slate-700">
                    {activeSummary}
                  </p>

                  {isHeuristicReview ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                      El AI Gateway está temporalmente limitado. Esta evaluación
                      usa las señales metodológicas locales y puedes volver a
                      evaluarla más adelante.
                    </div>
                  ) : null}

                  {activeNextStep ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-[#FCFCFA] px-3 py-2">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Siguiente paso sugerido
                      </p>
                      <p className="font-serif text-xs leading-relaxed text-slate-600">
                        {activeNextStep}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {activeSignals.length ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon name="hub" className="text-[#005944]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Observaciones por campo
                  </p>
                </div>

                <div className="space-y-4">
                  {signalGroups.map((group) => (
                    <SignalGroup
                      key={group.title}
                      title={group.title}
                      signals={group.signals}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
