"use client";

import { Children, useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import { handleDialogKeyDown } from "@/features/projects/workspace/accessibleDialog.helpers";

export default function AssistantSidebarContainer({ children, mobileLabels }) {
  const panels = Children.toArray(children);
  const labels = mobileLabels ?? (panels.length > 1 ? ["Revisión", "Jack AI"] : ["Ayuda"]);
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(0);
  const id = useId();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const main = document.querySelector("main");
    const previousInert = main?.inert;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    if (main) main.inert = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKey = event => handleDialogKeyDown(event, {
                                                                         
                                                                         
      dialog: {
        querySelectorAll: selector => Array.from(containerRef.current?.querySelectorAll(selector) ?? [])
          .filter(element => element.getClientRects().length > 0),
        focus: () => containerRef.current?.focus(),
      },
      close,
    });
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleDesktop = event => { if (event.matches) close(); };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", handleDesktop);
    return () => {
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", handleDesktop);
      if (main) main.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (!desktop.matches) trigger?.focus();
    };
  }, [close, isOpen]);

  function navigateTabs(event, index) {
    const keys = { ArrowRight: (index + 1) % panels.length, ArrowLeft: (index + panels.length - 1) % panels.length, Home: 0, End: panels.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = keys[event.key];
    setActivePanel(next);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus();
  }

  return (
    <div ref={containerRef} className="assistant-sidebar-container hidden min-h-0 h-full shrink-0 xl:flex"
      data-assistant-open={isOpen} role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? true : undefined} aria-label={isOpen ? "Herramientas del proyecto" : undefined}>
      <button ref={triggerRef} type="button" aria-controls={id} aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={`${isOpen ? "hidden" : "hidden max-lg:inline-flex"} min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#005944] shadow-sm focus-visible:ring-2 focus-visible:ring-[#005944]`}>
        <Icon name="forum" className="text-lg" />
        {panels.length > 1 ? "Revisión y Jack AI" : labels[0]}
      </button>
      <div className={`${isOpen ? "max-lg:flex" : ""} assistant-mobile-heading hidden items-center justify-between gap-3 border-b border-slate-200 px-4 py-3`}>
        <p className="text-sm font-bold">Herramientas del proyecto</p>
        <button ref={closeRef} type="button" aria-label="Cerrar herramientas" onClick={close}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 focus-visible:ring-2 focus-visible:ring-[#005944]">
          <Icon name="close" className="text-xl" />
        </button>
      </div>
      {panels.length > 1 ? (
        <div role="tablist" aria-label="Herramientas" className={`${isOpen ? "max-lg:flex" : ""} hidden gap-2 border-b border-slate-200 p-2`}>
          {panels.map((panel, index) => <button key={panel.key} id={`${id}-tab-${index}`} role="tab" type="button"
            aria-selected={activePanel === index} aria-controls={`${id}-panel-${index}`} tabIndex={activePanel === index ? 0 : -1}
            onClick={() => setActivePanel(index)} onKeyDown={event => navigateTabs(event, index)}
            className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-[#005944] ${activePanel === index ? "bg-emerald-50 text-[#005944]" : "text-slate-600"}`}>
            {labels[index]}
          </button>)}
        </div>
      ) : null}
      <div id={id} className="assistant-sidebar-content contents">
        {panels.map((panel, index) => <div key={panel.key} id={`${id}-panel-${index}`} className="assistant-panel contents"
          data-selected={activePanel === index} role={isOpen && panels.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={isOpen && panels.length > 1 ? `${id}-tab-${index}` : undefined}>{panel}</div>)}
      </div>
    </div>
  );
}
