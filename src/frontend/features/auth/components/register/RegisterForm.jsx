"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function handleRegistrationSuccess({
  needsEmailConfirmation,
  router,
  setSuccessMessage,
}) {
  if (needsEmailConfirmation) {
    setSuccessMessage("Cuenta creada. Revisa tu correo para confirmar tu email.");
    return;
  }

  router.push("/dashboard");
  router.refresh();
}

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const passwordsMatch = useMemo(() => password === password2, [password, password2]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const name = fullName.trim();
    const em = email.trim();

    if (!em) return setErrorMsg("El correo es requerido.");
    if (!password) return setErrorMsg("La contraseña es requerida.");
    if (!passwordsMatch) return setErrorMsg("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email: em,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error ?? "No se pudo crear la cuenta.");
        return;
      }

      handleRegistrationSuccess({
        needsEmailConfirmation: data.needsEmailConfirmation,
        router,
        setSuccessMessage: setSuccessMsg,
      });
    } catch {
      setErrorMsg("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
                             
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full_name">
          Nombre completo
        </label>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-rounded text-gray-400 text-[18px]">
              badge
            </span>
          </div>

          <input
            id="full_name"
            name="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

                    
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@uvg.edu.gt"
            autoComplete="email"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

                      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
          Contraseña
        </label>

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

                              
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="password2">
            Confirmar contraseña
          </label>

          {!passwordsMatch && password2 ? (
            <span className="text-xs text-red-600">No coincide</span>
          ) : null}
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-rounded text-gray-400 text-[18px]">
              lock
            </span>
          </div>

          <input
            id="password2"
            name="password2"
            type="password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-primary focus:border-primary
                       bg-white text-gray-900 placeholder-gray-400 sm:text-sm"
          />
        </div>
      </div>

                      
      {errorMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      ) : null}

                    
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium
                   text-white bg-primary hover:bg-green-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
