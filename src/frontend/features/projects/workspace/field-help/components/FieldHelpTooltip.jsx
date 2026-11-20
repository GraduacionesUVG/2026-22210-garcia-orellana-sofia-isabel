"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/common/Icon";
import {
  FIELD_HELP_TONES,
  getFieldHelp,
  getFieldHelpByKey,
} from "@/features/projects/workspace/field-help";
import {
  FIELD_HELP_CLOSE_DELAY_MS,
  shouldCloseFieldHelpTooltip,
} from "@/features/projects/workspace/field-help/fieldHelpTooltip.helpers";

const TONE_STYLES = {
  [FIELD_HELP_TONES.action]: {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  [FIELD_HELP_TONES.topic]: {
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  [FIELD_HELP_TONES.population]: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  [FIELD_HELP_TONES.context]: {
    chip: "border-cyan-200 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
  },
  [FIELD_HELP_TONES.time]: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  [FIELD_HELP_TONES.resources]: {
    chip: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  [FIELD_HELP_TONES.method]: {
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  [FIELD_HELP_TONES.technique]: {
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
  },
  [FIELD_HELP_TONES.sample]: {
    chip: "border-pink-200 bg-pink-50 text-pink-700",
    dot: "bg-pink-500",
  },
  [FIELD_HELP_TONES.rationale]: {
    chip: "border-lime-200 bg-lime-50 text-lime-700",
    dot: "bg-lime-500",
  },
  [FIELD_HELP_TONES.warning]: {
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

function getToneStyle(tone) {
  return (
    TONE_STYLES[tone] || {
      chip: "border-slate-200 bg-slate-50 text-slate-700",
      dot: "bg-slate-400",
    }
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function MiniSection({ title, icon, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white/95 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon name={icon} className="text-[14px]" />
        </span>

        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>
      </div>

      {children}
    </section>
  );
}

function StructureColumn({ items = [] }) {
  if (!items.length) return null;

  return (
    <MiniSection title="Estructura esperada" icon="account_tree">
      <div className="space-y-2">
        {items.slice(0, 5).map((item, index) => {
          const toneStyle = getToneStyle(item.tone);

          return (
            <div key={`${item.label}-${index}`} className="flex gap-2">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneStyle.dot}`}
              />

              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${toneStyle.chip}`}
                >
                  {item.label}
                </span>

                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </MiniSection>
  );
}

function ExamplesColumn({ goodExample, weakExample }) {
  if (!goodExample && !weakExample) return null;

  return (
    <MiniSection title="Ejemplos" icon="compare_arrows">
      <div className="space-y-2">
        {goodExample ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5">
              <Icon name="check_circle" className="text-[14px] text-emerald-600" />
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                Fuerte
              </p>
            </div>

            <p className="text-[11px] leading-relaxed text-emerald-900">
              {goodExample}
            </p>
          </div>
        ) : null}

        {weakExample ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5">
              <Icon name="error" className="text-[14px] text-red-600" />
              <p className="text-[9px] font-black uppercase tracking-wider text-red-700">
                Débil
              </p>
            </div>

            <p className="text-[11px] leading-relaxed text-red-900">
              {weakExample}
            </p>
          </div>
        ) : null}
      </div>
    </MiniSection>
  );
}

function MistakesAndChecklistColumn({ mistakes = [], checklist = [] }) {
  return (
    <MiniSection title="Evita y revisa" icon="checklist">
      {mistakes.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-red-500">
            Errores comunes
          </p>

          <div className="space-y-1.5">
            {mistakes.slice(0, 3).map((mistake, index) => (
              <div key={`${mistake}-${index}`} className="flex gap-1.5">
                <Icon
                  name="close"
                  className="mt-0.5 shrink-0 text-[13px] text-red-500"
                />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {mistake}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {checklist.length > 0 ? (
        <div className={mistakes.length ? "mt-3" : ""}>
          <p className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-[#005944]">
            Checklist rápida
          </p>

          <div className="space-y-1.5">
            {checklist.slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-1.5">
                <Icon
                  name="done"
                  className="mt-0.5 shrink-0 text-[13px] text-[#005944]"
                />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </MiniSection>
  );
}

function TooltipPanel({ help, rect, open, onMouseEnter, onMouseLeave }) {
  const coords = useMemo(() => {
    if (!rect || typeof window === "undefined") {
      return { top: 0, left: 0, width: 780 };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(780, viewportWidth - 32);
    const preferredLeft = rect.left - 8;
    const left = clamp(preferredLeft, 16, viewportWidth - width - 16);

    let top = rect.bottom + 10;
    const estimatedHeight = 420;
    const wouldOverflowBottom = top + estimatedHeight > viewportHeight - 16;

    if (wouldOverflowBottom) {
      top = Math.max(16, rect.top - estimatedHeight - 10);
    }

    return { top, left, width };
  }, [rect]);

  if (!rect) return null;

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 999999,
      }}
      className={`max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain ${
        open
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-1 scale-[0.99] opacity-0"
      } transition-transform transition-opacity duration-150 ease-out`}
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-100 bg-[#005944] px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/65">
                Guía metodológica
              </p>

              <h4 className="mt-1 text-sm font-black leading-snug">
                {help.title}
              </h4>
            </div>

            <p className="max-w-[360px] text-[11px] leading-relaxed text-white/80">
              {help.shortHelp}
            </p>
          </div>
        </div>

        <div className="grid gap-3 bg-[#FCFCFA] p-3 lg:grid-cols-[1.2fr_1fr_1fr]">
          <StructureColumn items={help.expectedStructure} />

          <ExamplesColumn
            goodExample={help.goodExample}
            weakExample={help.weakExample}
          />

          <MistakesAndChecklistColumn
            mistakes={help.commonMistakes}
            checklist={help.quickChecklist}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FieldHelpTooltip({
  phase,
  field,
  helpKey,
  help: providedHelp,
  className = "",
}) {
  const buttonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const interactionRef = useRef({
    triggerHovered: false,
    panelHovered: false,
    triggerFocused: false,
  });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState(null);

  const help = useMemo(() => {
    if (providedHelp) return providedHelp;
    if (helpKey) return getFieldHelpByKey(helpKey);
    return getFieldHelp(phase, field);
  }, [providedHelp, helpKey, phase, field]);

  const openTooltip = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    const nextRect = buttonRef.current?.getBoundingClientRect();
    if (nextRect) setRect(nextRect);

    if (open) return;

    setMounted(true);
    setOpen(false);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(true);
    }
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      if (shouldCloseFieldHelpTooltip(interactionRef.current)) {
        setOpen(false);
        window.setTimeout(() => {
          if (shouldCloseFieldHelpTooltip(interactionRef.current)) {
            setMounted(false);
            setRect(null);
          }
        }, 160);
      }
    }, FIELD_HELP_CLOSE_DELAY_MS);
  };

  const updateInteraction = (key, active) => {
    interactionRef.current[key] = active;
    if (active) {
      openTooltip();
      return;
    }
    scheduleClose();
  };

  useEffect(() => {
    if (!open) return;

    function handleReposition() {
      const nextRect = buttonRef.current?.getBoundingClientRect();
      if (nextRect) setRect(nextRect);
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!help) return null;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => updateInteraction("triggerHovered", true)}
      onMouseLeave={() => updateInteraction("triggerHovered", false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Ayuda para ${help.title}`}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openTooltip();
        }}
        onFocus={() => updateInteraction("triggerFocused", true)}
        onBlur={() => updateInteraction("triggerFocused", false)}
        className="group flex h-[16px] w-[16px] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
       <span className="block translate-y-[-0.5px] text-[9px] font-black leading-none text-current">
  ?
</span>
      </button>

      {mounted ? (
        <TooltipPanel
          help={help}
          rect={rect}
          open={open}
          onMouseEnter={() => updateInteraction("panelHovered", true)}
          onMouseLeave={() => updateInteraction("panelHovered", false)}
        />
      ) : null}
    </span>
  );
}
