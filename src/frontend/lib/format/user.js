export function getUserDisplayName(payload) {
  const profileName = payload?.profile?.full_name?.trim();
  if (profileName) return profileName;

  const metaName = payload?.user?.user_metadata?.full_name?.trim();
  if (metaName) return metaName;

  const email = payload?.user?.email?.trim();
  if (email) return email.split("@")[0];

  return "Investigador";
}

export function getUserDisplayEmail(payload) {
  return payload?.user?.email?.trim() || "";
}

export function getFirstName(fullName) {
  const clean = String(fullName || "").trim();
  if (!clean) return "Investigador";

  return clean.split(/\s+/)[0];
}

export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "UV";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}