import { requestJson } from "@/lib/api/http";

export async function fetchMe() {
  return requestJson(
    "/api/users/me",
    { cache: "no-store" },
    "No se pudo cargar el perfil."
  );
}

export async function updateMe(input) {
  const result = await requestJson(
    "/api/users/me",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "No se pudo actualizar el perfil."
  );
  if (!result?.profile || typeof result.profile.full_name !== "string") {
    throw new Error("No se pudo actualizar el perfil.");
  }
  return result;
}

export async function changePassword(input) {
  return requestJson(
    "/api/auth/change-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    },
    "No se pudo cambiar la contraseña."
  );
}

export async function logout() {
  return requestJson(
    "/api/auth/logout",
    { method: "POST" },
    "No se pudo cerrar la sesión."
  );
}
