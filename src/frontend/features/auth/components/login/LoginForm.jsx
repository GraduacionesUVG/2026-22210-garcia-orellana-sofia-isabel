"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se pudo iniciar sesión.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="email"
        >
          Correo electrónico
        </label>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-rounded text-gray-400 text-[18px]">
              mail
            </span>
          </div>

          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="nombre@uvg.edu.gt"
            autoComplete="email"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Contraseña
          </label>

          <a
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:text-green-700 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-rounded text-gray-400 text-[18px]">
              lock
            </span>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label
          htmlFor="remember-me"
          className="ml-2 block text-sm text-gray-700"
        >
          Recordar este dispositivo
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium
                   text-white bg-primary hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}
