import StatCard from "@/components/common/StatCard";

export default function DashboardStatsSection({
  stats,
  firstName,
  totalTitle,
  formatDashboardDate,
}) {
  return (
    <div className="dashboard-stats grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <StatCard
        title="Activos"
        value={`${stats.activeCount} ${
          stats.activeCount === 1 ? "Proyecto" : "Proyectos"
        }`}
        icon="pending_actions"
        accent="primary"
        kind="progress"
        progressPercent={stats.progressPercent}
        hint={
          stats.total > 0
            ? `${stats.progressPercent}% del total`
            : "Aún no tienes proyectos"
        }
      />

      <StatCard
        title="Inactivos"
        value={`${stats.inactiveCount} ${
          stats.inactiveCount === 1 ? "Proyecto" : "Proyectos"
        }`}
        icon="pause_circle"
        accent="secondary"
        hint={
          stats.total > 0
            ? `${stats.inactiveCount} de ${stats.total} marcados como inactivos`
            : "Aún no tienes proyectos"
        }
      />

      <StatCard
        title={totalTitle || `Proyectos de ${firstName}`}
        value={`${stats.total} Totales`}
        icon="folder"
        accent="yellow"
        hint={
          stats.latestProjectDate
            ? `Última actividad: ${formatDashboardDate(stats.latestProjectDate)}`
            : "Crea tu primer proyecto"
        }
      />
    </div>
  );
}
