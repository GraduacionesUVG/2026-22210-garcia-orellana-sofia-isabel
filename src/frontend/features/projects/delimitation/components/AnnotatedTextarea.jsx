"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeuristicTooltip from "@/features/projects/delimitation/components/HeuristicTooltip";
import { shouldCloseHeuristicTooltip } from "@/features/projects/delimitation/helpers/heuristicTooltip.helpers";

function highlightClassName(highlight) {
  if (highlight?.severity === "critical") {
    return "rounded-[4px] bg-orange-100/70 ring-1 ring-orange-200 underline decoration-2 decoration-orange-500 underline-offset-4";
  }

  return "rounded-[4px] bg-amber-100/55 ring-1 ring-amber-200/70 underline decoration-2 decoration-amber-500 underline-offset-4";
}

function frameClassName(visualState) {
  if (visualState === "critical") {
    return "border-orange-300 bg-orange-50/25 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-300/60";
  }

  if (visualState === "warning") {
    return "border-amber-300 bg-amber-50/25 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-300/60";
  }

  if (visualState === "info") {
    return "border-slate-300 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-300/70";
  }

  return "border-transparent bg-[#F9F8F3] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#005944]";
}

function surfaceClassName(visualState) {
  if (visualState === "critical") return "bg-orange-50/35";
  if (visualState === "warning") return "bg-amber-50/35";
  if (visualState === "info") return "bg-slate-50";
  return "bg-[#F9F8F3]";
}

function getValidHighlights(text, highlights) {
  if (!text || !Array.isArray(highlights)) return [];

  return highlights
    .map((highlight, index) => {
      const start = Math.max(0, Number(highlight.start ?? 0));
      const end = Math.min(text.length, Number(highlight.end ?? 0));

      if (end <= start) return null;

      return {
        ...highlight,
        start,
        end,
        index,
        text: highlight.text || text.slice(start, end),
      };
    })
    .filter(Boolean);
}

function renderTextWithHighlights(text, highlights, registerHighlightRef) {
  if (!text) return null;

  const validHighlights = getValidHighlights(text, highlights);

  if (!validHighlights.length) return text;

  const nodes = [];
  let cursor = 0;

  validHighlights.forEach((highlight) => {
    const { start, end, index } = highlight;

    if (cursor < start) {
      nodes.push(
        <span key={`text-${index}-${cursor}`}>
          {text.slice(cursor, start)}
        </span>
      );
    }

    nodes.push(
      <span
        key={highlight.id ?? `${start}-${end}`}
        ref={(node) => registerHighlightRef(index, node)}
        data-highlight-index={index}
        className={highlightClassName(highlight)}
      >
        {text.slice(start, end)}
      </span>
    );

    cursor = end;
  });

  if (cursor < text.length) {
    nodes.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

export default function AnnotatedTextarea({
  value,
  onChange,
  placeholder,
  highlights = [],
  visualState = "",
  className = "",
  minHeightClass = "min-h-[100px]",
}) {
  const highlightRefs = useRef(new Map());
  const closeTimerRef = useRef(null);
  const fieldHoveredRef = useRef(false);
  const tooltipHoveredRef = useRef(false);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [activeAnchorRect, setActiveAnchorRect] = useState(null);

  const validHighlights = useMemo(
    () => getValidHighlights(value, highlights),
    [value, highlights]
  );

  function registerHighlightRef(index, node) {
    if (!node) {
      highlightRefs.current.delete(index);
      return;
    }

    highlightRefs.current.set(index, node);
  }

  function clearTooltipClose() {
    if (!closeTimerRef.current) return;

    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function closeTooltip() {
    clearTooltipClose();
    if (
      !shouldCloseHeuristicTooltip({
        fieldHovered: fieldHoveredRef.current,
        tooltipHovered: tooltipHoveredRef.current,
      })
    ) {
      return;
    }

    setActiveHighlight(null);
    setActiveAnchorRect(null);
  }

  function scheduleTooltipClose() {
    clearTooltipClose();
    closeTimerRef.current = window.setTimeout(closeTooltip, 220);
  }

  function handleFieldMouseEnter() {
    fieldHoveredRef.current = true;
    clearTooltipClose();
  }

  function handleMouseMove(event) {
    if (!validHighlights.length) return;

    const x = event.clientX;
    const y = event.clientY;

    let matchedHighlight = null;
    let matchedRect = null;

    for (const highlight of validHighlights) {
      const node = highlightRefs.current.get(highlight.index);
      if (!node) continue;

      const rects = Array.from(node.getClientRects());

      const matchingRect = rects.find(
        (rect) =>
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
      );

      if (matchingRect) {
        matchedHighlight = highlight;
        matchedRect = matchingRect;
        break;
      }
    }

    if (matchedHighlight && matchedRect) {
      clearTooltipClose();
      setActiveHighlight(matchedHighlight);
      setActiveAnchorRect(matchedRect);
    } else {
      scheduleTooltipClose();
    }
  }

  function handleMouseLeave() {
    fieldHoveredRef.current = false;
    scheduleTooltipClose();
  }

  function handleTooltipMouseEnter() {
    tooltipHoveredRef.current = true;
    clearTooltipClose();
  }

  function handleTooltipMouseLeave() {
    tooltipHoveredRef.current = false;
    scheduleTooltipClose();
  }

  useEffect(() => {
    return () => {
      clearTooltipClose();
    };
  }, []);

  const renderedText = useMemo(
                                                                          
    // eslint-disable-next-line react-hooks/refs
    () => renderTextWithHighlights(value, highlights, registerHighlightRef),
    [value, highlights]
  );

  return (
    <div
      className={`relative rounded-xl border transition-all ${frameClassName(
        visualState
      )} ${className}`}
      onMouseEnter={handleFieldMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-xl transition-all ${surfaceClassName(
          visualState
        )}`}
      />

      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
        <div
          className="px-4 py-4 text-sm font-serif leading-relaxed text-transparent whitespace-pre-wrap break-words"
          style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}
          aria-hidden="true"
        >
          {renderedText}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
          setScrollLeft(event.currentTarget.scrollLeft);
        }}
        className={`relative z-20 w-full resize-none rounded-xl border-transparent bg-transparent p-4 text-sm font-serif leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 ${minHeightClass}`}
        placeholder={placeholder}
        spellCheck={false}
      />

      <HeuristicTooltip
        open={Boolean(activeHighlight && activeAnchorRect)}
        highlight={activeHighlight}
        message={activeHighlight?.tooltip}
        anchorRect={activeAnchorRect}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />
    </div>
  );
}
