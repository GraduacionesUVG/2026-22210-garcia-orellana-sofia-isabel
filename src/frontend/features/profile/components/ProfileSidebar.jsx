import Link from "next/link";

const sidebarAvatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDKustpK7ReDF3Zne5B38tPAknwAwIulZbY0q8xBJRrkEdVv__UGFxU_ZnjHNbnE_QnhvZdbgEj2SKab2zm-fvDitWl7BxOpLqD3v6mPgjyPlVikDWp6QkIVeF4vMoFoMXV-9uoK2R7y3Lg5bHwVuM8Z8eDMOYhhcqD67zWEuZVaBGhfwtg2WqC0Vqpd4Z1HlY90jXVkTrF3V4aD3TNv0-E0u7xuWKu4GDuptd-CoA8BofOAYcgxx9tC6PTI5kk-KZeE-wJcp5-0Fjx";

export default function ProfileSidebar({ user }) {
  const displayName = user?.full_name?.trim() || "Investigador UVG";
  const displayEmail = user?.email?.trim() || "uvg.edu.gt";

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#005944] rounded-lg p-2 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>

          <div className="flex flex-col">
            <h1 className="text-[#005944] text-lg font-bold leading-tight">
              UVG Análisis
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Plataforma Cualitativa
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-[#F9F8F3] transition-colors"
            href="/dashboard"
          >
            <span className="material-symbols-outlined">folder</span>
            <span className="text-sm font-medium">Proyectos</span>
          </Link>

          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-[#F9F8F3] transition-colors text-left"
            type="button"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="text-sm font-medium">Jack AI</span>
          </button>

          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-[#F9F8F3] transition-colors text-left"
            type="button"
          >
            <span className="material-symbols-outlined">verified_user</span>
            <span className="text-sm font-medium">Auditoría</span>
          </button>

          <Link
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#e6f4f1] text-[#005944] border border-[#005944]/10"
            href="/profile"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm font-semibold">Perfil activo</span>
          </Link>
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div
            aria-label="Avatar circular del usuario actual"
            className="h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center"
            style={{ backgroundImage: `url('${sidebarAvatar}')` }}
          />

          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}