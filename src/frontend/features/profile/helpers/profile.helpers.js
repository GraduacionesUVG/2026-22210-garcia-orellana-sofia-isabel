export const PROFILE_DEFAULT_FORM = {
  full_name: "",
  email: "",
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

export function getProfileSnapshot(form) {
  return {
    full_name: form.full_name,
    email: form.email,
  };
}

export function wantsPasswordChange(form) {
  return Boolean(
    form.currentPassword || form.newPassword || form.confirmNewPassword
  );
}

export function hasProfileChanges(form, initialSnapshot) {
  if (!initialSnapshot) return false;

  return (
    JSON.stringify(getProfileSnapshot(form)) !==
      JSON.stringify(initialSnapshot) || wantsPasswordChange(form)
  );
}

export function normalizeProfileResponse(data) {
  return {
    ...PROFILE_DEFAULT_FORM,
    full_name: data?.profile?.full_name ?? "",
    email: data?.user?.email ?? "",
  };
}

export function buildSidebarUser(form) {
  return {
    full_name: form.full_name || "Mi cuenta",
    email: form.email || "",
    roleLabel: "Mi cuenta",
  };
}

export function validateProfileForm(form) {
  const fullName = form.full_name.trim();

  if (!fullName) {
    return "El nombre completo es obligatorio.";
  }

  if (wantsPasswordChange(form)) {
    if (!form.currentPassword) {
      return "Ingresa tu contraseña actual para continuar.";
    }

    if (!form.newPassword) {
      return "Ingresa una nueva contraseña.";
    }

    if (!form.newPassword.trim()) {
      return "La nueva contraseña no puede estar vacía.";
    }

    if (form.newPassword.length < 6) {
      return "La nueva contraseña debe tener al menos 6 caracteres.";
    }

    if (form.newPassword.length > 128) {
      return "La nueva contraseña es demasiado larga.";
    }

    if (form.currentPassword === form.newPassword) {
      return "La nueva contraseña debe ser diferente a la contraseña actual.";
    }

    if (form.newPassword !== form.confirmNewPassword) {
      return "La confirmación de la nueva contraseña no coincide.";
    }
  }

  return null;
}

export function buildSavedProfileForm(form, updatedUserPayload) {
  return {
    ...form,
    full_name: updatedUserPayload?.profile?.full_name ?? form.full_name.trim(),
    email: updatedUserPayload?.user?.email ?? form.email,
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  };
}
