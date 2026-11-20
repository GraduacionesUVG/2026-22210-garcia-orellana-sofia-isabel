import Icon from "@/components/common/Icon";

export default function StatCard({
  title,
  value,
  icon,
  accent = "primary",
  hint,
  kind,
  clickable,
  progressPercent = 60,
}) {
  const iconColor =
    accent === "primary"
      ? "text-primary"
      : accent === "secondary"
      ? "text-secondary"
      : "text-yellow-500";

  const cardHover = clickable ? "cursor-pointer hover:border-secondary" : "";
  const safeProgress = Math.max(0, Math.min(100, Number(progressPercent) || 0));

  return (
    <div
      className={`bg-surface-light p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group transition-colors ${cardHover}`}
    >
      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon name={icon} className={`text-6xl ${iconColor}`} />
      </div>

      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
        {title}
      </h3>

      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>

      {kind === "progress" ? (
        <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      ) : null}

      {hint ? (
        <div className="flex items-center gap-1 mt-4 text-xs font-semibold">
          {accent === "secondary" ? (
            <Icon name="trending_up" className="text-secondary text-sm" />
          ) : null}

          <span
            className={
              accent === "yellow"
                ? "text-gray-500 font-medium"
                : accent === "secondary"
                ? "text-secondary"
                : "text-gray-500"
            }
          >
            {hint}
          </span>
        </div>
      ) : null}
    </div>
  );
}