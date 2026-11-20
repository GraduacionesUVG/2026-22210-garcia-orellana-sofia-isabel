"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/common/Icon";
import {
  getInitials,
  getUserDisplayEmail,
  getUserDisplayName,
} from "@/lib/format/user";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ user = null, dashboardView = "all" }) {
  const pathname = usePathname();

  const [resolvedUser, setResolvedUser] = useState(() => ({
    full_name: user?.full_name?.trim() || user?.name?.trim() || "",
    email: user?.email?.trim() || "",
    roleLabel: user?.roleLabel?.trim() || "Mi cuenta",
  }));

  useEffect(() => {
    let mounted = true;

    async function loadSidebarUser() {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!mounted || !res.ok || json?.ok === false) return;

        setResolvedUser((prev) => ({
          full_name: getUserDisplayName(json) || prev.full_name,
          email: getUserDisplayEmail(json) || prev.email,
          roleLabel: prev.roleLabel || "Mi cuenta",
        }));
      } catch {
                     
      }
    }

    loadSidebarUser();

    return () => {
      mounted = false;
    };
  }, []);

  const isProjectsActive =
    pathname.startsWith("/projects") ||
    (pathname === "/dashboard" && dashboardView === "all");
  const isSharedActive = pathname === "/dashboard" && dashboardView === "shared";
  const isReportsActive = pathname === "/dashboard" && dashboardView === "reports";
  const isProfileActive = pathname.startsWith("/profile");

  const displayName = useMemo(() => {
    return resolvedUser.full_name?.trim() || "Mi cuenta";
  }, [resolvedUser.full_name]);

  const displaySubtext = useMemo(() => {
    return resolvedUser.email?.trim() || resolvedUser.roleLabel || "Mi cuenta";
  }, [resolvedUser.email, resolvedUser.roleLabel]);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const navItemClass = (active) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors",
      active
        ? "bg-green-50 text-primary border border-green-100"
        : "text-gray-700 hover:bg-gray-50 hover:text-primary"
    );

  return (
    <aside className="dashboard-sidebar w-64 bg-surface-light border-r border-gray-200 flex-col h-full flex-shrink-0 z-20 hidden md:flex shadow-sm">
      <div className="dashboard-brand h-20 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <span className="font-bold text-xl tracking-tighter">UVG</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary uppercase tracking-wide leading-none mb-0.5">
              Universidad
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide leading-none">
              Del Valle
            </span>
          </div>
        </div>
      </div>

      <nav aria-label="Proyectos" className="dashboard-nav flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <Link href="/dashboard" className={navItemClass(isProjectsActive)}>
          <Icon name="dashboard" className="text-[22px]" />
          <span className="font-medium text-sm">Mis Proyectos</span>
        </Link>

        <Link href="/dashboard?view=shared" className={navItemClass(isSharedActive)}>
          <Icon name="group_work" className="text-[22px]" />
          <span className="font-medium text-sm">Compartidos</span>
        </Link>

        <Link href="/dashboard?view=reports" className={navItemClass(isReportsActive)}>
          <Icon name="analytics" className="text-[22px]" />
          <span className="font-medium text-sm">Reportes</span>
        </Link>

      </nav>

      <div className="dashboard-account p-4 border-t border-gray-200">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 w-full p-2 rounded-lg transition-colors",
            isProfileActive
              ? "bg-green-50 border border-green-100"
              : "hover:bg-gray-50"
          )}
        >
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border",
              isProfileActive
                ? "border-green-200 bg-green-100 text-primary"
                : "border-gray-200 bg-gray-100 text-gray-700"
            )}
          >
            {initials}
          </div>

          <div className="dashboard-account-copy flex flex-col items-start min-w-0 flex-1">
            <span
              className={cn(
                "text-sm font-medium truncate w-full text-left",
                isProfileActive ? "text-primary" : "text-gray-700"
              )}
            >
              {displayName}
            </span>
            <span className="text-xs text-gray-500 truncate w-full text-left">
              {displaySubtext}
            </span>
          </div>
          <span className="dashboard-account-label hidden">Perfil</span>
        </Link>
      </div>
    </aside>
  );
}
