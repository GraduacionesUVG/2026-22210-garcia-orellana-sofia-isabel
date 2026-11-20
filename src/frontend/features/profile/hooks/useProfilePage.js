"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchMe,
  updateMe,
  changePassword,
  logout,
} from "@/features/profile/api/profile.api";
import {
  PROFILE_DEFAULT_FORM,
  buildSavedProfileForm,
  buildSidebarUser,
  getProfileSnapshot,
  hasProfileChanges,
  normalizeProfileResponse,
  validateProfileForm,
  wantsPasswordChange,
} from "@/features/profile/helpers/profile.helpers";

export function useProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState(PROFILE_DEFAULT_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const sidebarUser = useMemo(() => buildSidebarUser(form), [form]);

  const hasChanges = useMemo(() => {
    return hasProfileChanges(form, initialSnapshot);
  }, [form, initialSnapshot]);

  function onFieldChange(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function onCancel() {
    if (!initialSnapshot) return;

    setForm({
      ...PROFILE_DEFAULT_FORM,
      ...initialSnapshot,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    setErrorMsg("");
    setSuccessMsg("");
  }

  async function onLogout() {
    try {
      setLoggingOut(true);
      setErrorMsg("");
      setSuccessMsg("");

      await logout();
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setErrorMsg(e?.message ?? "No se pudo cerrar la sesión.");
    } finally {
      setLoggingOut(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validateProfileForm(form);

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSaving(true);

      const shouldChangePassword =
        wantsPasswordChange(form) && Boolean(form.newPassword);

      if (shouldChangePassword) {
        await changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      }

      const updated = await updateMe({
        full_name: form.full_name.trim(),
      });

      const nextForm = buildSavedProfileForm(form, updated);

      setForm(nextForm);
      setInitialSnapshot(getProfileSnapshot(nextForm));

      setSuccessMsg(
        shouldChangePassword
          ? "El perfil y la contraseña se actualizaron correctamente."
          : "Los cambios se guardaron correctamente."
      );
    } catch (e) {
      setErrorMsg(e?.message ?? "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMsg("");

        const data = await fetchMe();

        if (!mounted) return;

        const nextForm = normalizeProfileResponse(data);

        setForm(nextForm);
        setInitialSnapshot(getProfileSnapshot(nextForm));
      } catch (e) {
        if (!mounted) return;

        if (e?.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorMsg(e?.message ?? "No se pudo cargar el perfil.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const inputClassName =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-[#005944] focus:ring-2 focus:border-[#005944]/10";

  return {
    form,
    loading,
    saving,
    loggingOut,
    errorMsg,
    successMsg,
    sidebarUser,
    hasChanges,
    inputClassName,
    onFieldChange,
    onCancel,
    onLogout,
    onSubmit,
  };
}
