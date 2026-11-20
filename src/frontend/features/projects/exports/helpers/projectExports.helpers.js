const EXPORT_FORMATS = {
  docx: "docx",
  pdf: "pdf",
  md: "md",
  zip: "zip",
};

export function buildProjectExportUrl(
  projectId,
  exportType,
  format = EXPORT_FORMATS.docx,
  query = {}
) {
  const safeProjectId = encodeURIComponent(projectId);
  const safeExportType = encodeURIComponent(exportType);
  const safeFormat = encodeURIComponent(format);
  const searchParams = new URLSearchParams({ format: safeFormat });

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return `/api/projects/${safeProjectId}/exports/${safeExportType}?${searchParams.toString()}`;
}

export async function fetchProjectExport(projectId, exportType, format = EXPORT_FORMATS.docx, query = {}) {
  const response = await fetch(buildProjectExportUrl(projectId, exportType, format, query), {
    cache: "no-store", credentials: "same-origin", redirect: "error",
  });
  const failure = () => new Error("No se pudo exportar el archivo. Reintenta la descarga.");
  if (!response.ok || response.redirected) throw failure();
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const acceptedTypes = {
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    pdf: ["application/pdf"], zip: ["application/zip", "application/x-zip-compressed"],
    md: ["text/markdown", "text/plain"],
  };
  if (!acceptedTypes[format]?.includes(type)) throw failure();
  const bytes = new Uint8Array(await response.arrayBuffer());
  const zip = bytes.length >= 4 && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
  const pdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (!bytes.length || ((format === "docx" || format === "zip") && !zip) || (format === "pdf" && !pdf)) throw failure();
  const disposition = response.headers.get("content-disposition") ?? "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let filename = disposition.match(/filename="([^"]+)"|filename=([^;]+)/i)?.slice(1).find(Boolean);
  if (encodedName) {
    try { filename = decodeURIComponent(encodedName); } catch { /* Use the ordinary filename fallback. */ }
  }
  filename = String(filename ?? `${exportType}.${format}`).split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f]/g, "").trim();
  return { blob: new Blob([bytes], { type }), filename: filename || `export.${format}` };
}

export async function downloadProjectExport(
  projectId,
  exportType,
  format = EXPORT_FORMATS.docx,
  query = {}
) {
  if (!projectId || typeof window === "undefined") return;

  const { blob, filename } = await fetchProjectExport(projectId, exportType, format, query);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Give browsers time to acquire the Blob before releasing its backing URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function createProjectExportAction({
  projectId,
  exportType,
  format = EXPORT_FORMATS.docx,
  label,
  icon = "file_download",
  disabled = false,
  query,
  onError,
}) {
  return {
    icon,
    label,
    disabled: disabled || !projectId,
    onClick: async () => {
      if (typeof onError === "function") onError("");
      try {
        await downloadProjectExport(projectId, exportType, format, query);
      } catch {
        const message = "No se pudo exportar el archivo. Reintenta la descarga.";
        if (typeof onError === "function") onError(message);
        else window.alert(message);
      }
    },
  };
}
