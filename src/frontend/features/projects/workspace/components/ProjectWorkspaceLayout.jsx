"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import { handleWorkspaceDrawerKeyDown } from "@/features/projects/workspace/workspaceNavigation.helpers";

export default function ProjectWorkspaceLayout({
  statusSidebar,
  header,
  editor,
  assistantSidebar,
  contentMaxClass = "max-w-3xl",
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const contentRef = useRef(null);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);
  const hasOpenedRef = useRef(false);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  useEffect(() => {
    const contentElement = contentRef.current;

    if (contentElement) {
      contentElement.inert = isDrawerOpen;
    }

    if (!isDrawerOpen) {
      if (hasOpenedRef.current) {
        triggerRef.current?.focus();
        hasOpenedRef.current = false;
      }

      return undefined;
    }

    hasOpenedRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) =>
      handleWorkspaceDrawerKeyDown(event, {
        drawer: drawerRef.current,
        close: closeDrawer,
      });

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (contentElement) {
        contentElement.inert = false;
      }
    };
  }, [closeDrawer, isDrawerOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleDesktopViewport = (event) => {
      if (event.matches) {
        closeDrawer();
      }
    };

    desktopQuery.addEventListener("change", handleDesktopViewport);
    return () =>
      desktopQuery.removeEventListener("change", handleDesktopViewport);
  }, [closeDrawer]);

  return (
    <div className="responsive-workspace fixed inset-0 overflow-hidden bg-background-light text-slate-900">
      <div ref={contentRef} className="flex h-full min-h-0 overflow-hidden">
        <div className="hidden min-h-0 shrink-0 lg:flex">{statusSidebar}</div>

        <main className="workspace-main custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          <div className={`${contentMaxClass} mx-auto`}>
            <button
              ref={triggerRef}
              type="button"
              aria-controls="project-workspace-drawer"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
              className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
            >
              <Icon name="menu" className="text-[20px]" />
              Menú del proyecto
            </button>

            {header}
            {editor}
          </div>
        </main>

        {assistantSidebar}
      </div>

      {isDrawerOpen ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú del proyecto"
            onClick={closeDrawer}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
          />

          <div
            id="project-workspace-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-workspace-drawer-title"
            onClick={(event) => {
              if (event.target.closest("a[href]")) {
                closeDrawer();
              }
            }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4">
              <p
                id="project-workspace-drawer-title"
                className="text-sm font-bold text-slate-900"
              >
                Navegación del proyecto
              </p>

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Cerrar menú del proyecto"
                onClick={closeDrawer}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>

            <div className="min-h-0 flex-1">{statusSidebar}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
