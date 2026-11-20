"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/common/Icon";

const TOOLTIP_WIDTH = 380;
const VIEWPORT_MARGIN = 12;

const FIELD_META = {
  topic: {
    label: "Tema de investigación",
    title: "El tema todavía necesita más precisión",
    correction:
      "Aterriza el tema en una dimensión observable: efecto, relación, percepción, uso, experiencia, incidencia o comparación.",
    checklist: [
      "Fenómeno específico",
      "Dimensión observable",
      "Relación con población o contexto",
    ],
  },
  context_place: {
    label: "Contexto espacial",
    title: "El lugar todavía está poco delimitado",
    correction:
      "Baja el alcance a un lugar concreto: ciudad, municipio, comunidad, institución, sede o zona específica.",
    checklist: ["Lugar exacto", "Institución o comunidad", "Alcance manejable"],
  },
  time_period: {
    label: "Periodo",
    title: "El tiempo todavía está ambiguo",
    correction:
      "Convierte expresiones generales en fechas, meses, ciclos o años concretos.",
    checklist: ["Año inicial", "Año final", "Periodo acotado"],
  },
  population: {
    label: "Población de estudio",
    title: "La población todavía es muy general",
    correction:
      "Indica exactamente quiénes son los sujetos: edad, rol, institución, condición, grado, cargo o ubicación.",
    checklist: ["Grupo específico", "Rasgo diferenciador", "Ubicación o pertenencia"],
  },
  resources: {
    label: "Recursos",
    title: "Los recursos necesitan más concreción",
    correction:
      "Menciona fuentes, bases, herramientas, documentos, instituciones o accesos reales disponibles.",
    checklist: ["Fuente concreta", "Acceso disponible", "Herramienta viable"],
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getTooltipContent(message, highlight) {
  const field = normalizeText(highlight?.field);
  const meta = FIELD_META[field] ?? {
    label: "Campo evaluado",
    title: "Hay un punto que conviene revisar",
    correction:
      "Revisa el fragmento marcado y cámbialo por una formulación más concreta, verificable y delimitada.",
    checklist: ["Qué se quiere observar", "A quién aplica", "Dónde ocurre"],
  };

  return {
    label: meta.label,
    title: normalizeText(highlight?.title) || meta.title,
    markedText: normalizeText(highlight?.text),
    explanation:
      normalizeText(highlight?.message) ||
      normalizeText(highlight?.tooltip) ||
      normalizeText(message) ||
      "Este fragmento puede hacer que el alcance quede demasiado abierto.",
    correction: normalizeText(highlight?.suggestion) || meta.correction,
    checklist: Array.isArray(highlight?.checklist)
      ? highlight.checklist.filter(Boolean).slice(0, 3)
      : meta.checklist,
  };
}

function getTooltipPosition(anchorRect) {
  if (!anchorRect || typeof window === "undefined") {
    return {
      left: 0,
      top: 0,
      maxHeight: 360,
      placement: "bottom",
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = clamp(
    anchorRect.left + anchorRect.width / 2,
    VIEWPORT_MARGIN + TOOLTIP_WIDTH / 2,
    viewportWidth - VIEWPORT_MARGIN - TOOLTIP_WIDTH / 2
  );

  const preferredTop = anchorRect.bottom + 10;
  const availableBelow = viewportHeight - preferredTop - VIEWPORT_MARGIN;
  const availableAbove = anchorRect.top - VIEWPORT_MARGIN - 10;

  if (availableBelow >= 220 || availableBelow >= availableAbove) {
    return {
      left,
      top: preferredTop,
      maxHeight: Math.max(180, availableBelow),
      placement: "bottom",
    };
  }

  return {
    left,
    top: Math.max(VIEWPORT_MARGIN, anchorRect.top - 10),
    maxHeight: Math.max(180, availableAbove),
    placement: "top",
  };
}

export default function HeuristicTooltip({
  message,
  highlight,
  open = false,
  anchorRect = null,
  onMouseEnter,
  onMouseLeave,
}) {
  const [position, setPosition] = useState(() =>
    getTooltipPosition(anchorRect)
  );

  const content = useMemo(
    () => getTooltipContent(message, highlight),
    [message, highlight]
  );

  useEffect(() => {
    if (!open) return;

    function update() {
      setPosition(getTooltipPosition(anchorRect));
    }

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRect]);

  if (typeof document === "undefined" || !open || !anchorRect) return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed z-[300]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform:
          position.placement === "top"
            ? "translate(-50%, -100%)"
            : "translate(-50%, 0)",
      }}
    >
      <div
        className="relative w-[380px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
        style={{
          maxHeight: `${position.maxHeight}px`,
        }}
      >
        <div className="border-b border-slate-100 bg-[#FCFCFA] px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-[#854D0E]">
              <Icon name="help" className="text-[15px]" />
            </span>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                {content.label}
              </p>
              <p className="mt-1 text-sm font-black leading-snug text-slate-900">
                {content.title}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          {content.markedText ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
              <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700/70">
                Fragmento marcado
              </p>
              <p className="font-serif text-xs leading-relaxed text-slate-800">
                “{content.markedText}”
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Qué pasa
            </p>
            <p className="font-serif text-xs leading-relaxed text-slate-700">
              {content.explanation}
            </p>
          </div>

          <div className="rounded-xl border border-[#005944]/10 bg-[#005944]/5 px-3 py-2.5">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#005944]/70">
              Cómo corregirlo
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              {content.correction}
            </p>
          </div>

          {content.checklist.length ? (
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                Revisa que incluya
              </p>

              <div className="flex flex-wrap gap-1.5">
                {content.checklist.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600"
                  >
                    <Icon
                      name="check_circle"
                      className="text-[12px] text-[#005944]"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <span
          className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white ${
            position.placement === "top"
              ? "top-full -translate-y-1.5 border-b border-r border-slate-200"
              : "bottom-full translate-y-1.5 border-t border-l border-slate-200"
          }`}
        />
      </div>
    </div>,
    document.body
  );
}
