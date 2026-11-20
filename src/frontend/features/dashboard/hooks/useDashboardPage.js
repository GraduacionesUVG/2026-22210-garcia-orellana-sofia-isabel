"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchProjects,
  fetchCurrentUser,
} from "@/features/projects/api/projects.api";
import { formatDashboardDate } from "@/lib/format/date";
import {
  getFirstName,
  getUserDisplayEmail,
  getUserDisplayName,
} from "@/lib/format/user";
import {
  getProjectDateValue,
  normalizeProjectsResponse,
  resolveProjectActive,
} from "@/features/projects/helpers/project.helpers";

export function useDashboardPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const dashboardView = ["all", "shared", "reports"].includes(requestedView)
    ? requestedView
    : "all";
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [search, setSearch] = useState("");
  const [me, setMe] = useState({
    full_name: "Investigador",
    email: "",
    roleLabel: "Mi cuenta",
  });

  const refetchDashboard = useCallback(async () => {
    setLoadingProjects(true);
    setProjectsError("");

    const [projectsResult, userResult] = await Promise.allSettled([
      fetchProjects(),
      fetchCurrentUser(),
    ]);

    if (projectsResult.status === "fulfilled") {
      setProjects(normalizeProjectsResponse(projectsResult.value));
    } else {
      setProjects([]);
      setProjectsError(
        projectsResult.reason?.message || "Error cargando proyectos."
      );
    }

    if (userResult.status === "fulfilled") {
      const fullName = getUserDisplayName(userResult.value);
      const email = getUserDisplayEmail(userResult.value);

      setMe({
        full_name: fullName,
        email,
        roleLabel: "Mi cuenta",
      });
    }

    setLoadingProjects(false);
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) void refetchDashboard();
    });

    return () => {
      active = false;
    };
  }, [refetchDashboard]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matching = projects.filter((project) =>
      !query || [project.name, project.description].some((value) =>
        String(value ?? "").toLocaleLowerCase().includes(query)
      )
    );
    if (dashboardView === "shared") {
      return matching.filter(
        (project) => project.my_role && project.my_role !== "owner"
      );
    }

    return matching;
  }, [dashboardView, projects, search]);

  const stats = useMemo(() => {
    const total = visibleProjects.length;
    const activeCount = visibleProjects.filter(resolveProjectActive).length;
    const inactiveCount = total - activeCount;
    const progressPercent =
      total > 0
        ? Math.max(0, Math.min(100, Math.round((activeCount / total) * 100)))
        : 0;

    let latestProjectDate = null;

    for (const project of visibleProjects) {
      const projectDate = getProjectDateValue(project);
      if (!projectDate) continue;

      if (!latestProjectDate || projectDate > latestProjectDate) {
        latestProjectDate = projectDate;
      }
    }

    return {
      total,
      activeCount,
      inactiveCount,
      progressPercent,
      latestProjectDate,
    };
  }, [visibleProjects]);

  const firstName = useMemo(() => getFirstName(me.full_name), [me.full_name]);

  const pageCopy = useMemo(() => {
    if (dashboardView === "shared") {
      return {
        title: "Proyectos compartidos",
        subtitle: "Aquí están los proyectos donde colaboras con otros investigadores.",
        projectsHeading: "Proyectos compartidos",
        emptyMessage: "Todavía no participas en proyectos compartidos.",
        destination: "delimitation",
        statsTitle: "Proyectos compartidos",
      };
    }

    if (dashboardView === "reports") {
      return {
        title: "Reportes de proyectos",
        subtitle: "Abre el reporte de cualquier proyecto para revisar su síntesis.",
        projectsHeading: "Reportes disponibles",
        emptyMessage: "Crea un proyecto para comenzar a construir un reporte.",
        destination: "report",
        statsTitle: "Reportes disponibles",
      };
    }

    return {
      title: "Panel de Mis Proyectos",
      subtitle: `Bienvenido de nuevo, ${firstName}. Aquí está el resumen de tu investigación.`,
      projectsHeading: "Proyectos Recientes",
      emptyMessage: "Aún no hay proyectos. Crea tu primer proyecto con “Nuevo Proyecto”.",
      destination: "delimitation",
      statsTitle: `Proyectos de ${firstName}`,
    };
  }, [dashboardView, firstName]);

  return {
    open,
    search,
    setSearch,
    setOpen,
    me,
    firstName,
    stats,
    projects: visibleProjects,
    dashboardView,
    pageCopy,
    loadingProjects,
    projectsError,
    formatDashboardDate,
    refetchDashboard,
  };
}
