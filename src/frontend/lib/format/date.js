function toValidDate(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

const dashboardDateFormatter = new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const projectTimestampFormatter = new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDashboardDate(value) {
  const date = toValidDate(value);
  if (!date) return "Sin actividad reciente";

  return dashboardDateFormatter.format(date);
}

export function formatProjectTimestamp(value) {
  if (!value) return "Sin fecha registrada";

  const date = toValidDate(value);
  if (!date) return String(value);

  return projectTimestampFormatter.format(date);
}