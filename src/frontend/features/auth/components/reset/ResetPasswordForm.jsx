"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const e = sp.get("e");

  async function onSubmit(ev) {
    ev.preventDefault();

    setError("");
    setOkMsg("");
    setLoading(true);

    const form = new FormData(ev.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirm = String(form.get("confirm") || "");

    if (!newPassword) {
      setLoading(false);
      setError("Ingresa una nueva contraseña.");
      return;
    }

    if (!newPassword.trim()) {
      setLoading(false);
      setError("La nueva contraseña no puede estar vacía.");
      return;
    }

    if (newPassword.length < 6) {
      setLoading(false);
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword.length > 128) {
      setLoading(false);
      setError("La nueva contraseña es demasiado larga.");
      return;
    }

    if (newPassword !== confirm) {
      setLoading(false);
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se pudo actualizar la contraseña.");
        return;
      }

      setOkMsg("Contraseña actualizada. Ya puedes iniciar sesión.");

      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {e ? (
        <p className="text-sm text-red-600">{decodeURIComponent(e)}</p>
      ) : null}

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="newPassword"
        >
          Nueva contraseña
        </label>

        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          maxLength={128}
          autoComplete="new-password"
          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 sm:text-sm"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="confirm"
        >
          Confirmar contraseña
        </label>

        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          maxLength={128}
          autoComplete="new-password"
          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 sm:text-sm"
          placeholder="••••••••"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {okMsg ? <p className="text-sm text-green-700">{okMsg}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}