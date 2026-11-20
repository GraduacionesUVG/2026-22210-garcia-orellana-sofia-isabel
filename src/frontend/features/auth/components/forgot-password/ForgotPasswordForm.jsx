"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se pudo enviar el correo.");
        return;
      }

      setMsg("Listo. Revisa tu correo (y spam) para el link de recuperación.");
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="nombre@uvg.edu.gt"
          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 sm:text-sm"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar link de recuperación"}
      </button>
    </form>
  );
}