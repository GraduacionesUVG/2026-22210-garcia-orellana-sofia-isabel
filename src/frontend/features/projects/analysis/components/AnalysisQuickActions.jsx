"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";

function ActionCard({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#005944]/30"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
        <Icon name={icon} className="text-xl" />
      </span>
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </button>
  );
}

export default function AnalysisQuickActions() {
  const router = useRouter();
  const { routes } = useAnalysisContext();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ActionCard
        icon="account_tree"
        title="Abrir códigos"
        description="Revisar categorías, jerarquía y criterios de uso."
        onClick={() => router.push(routes.codesHref)}
      />
      <ActionCard
        icon="playlist_add_check"
        title="Revisar pendientes"
        description="Encontrar evidencia marcada que aún no tiene código."
        onClick={() => router.push(routes.segmentsHref)}
      />
      <ActionCard
        icon="edit_note"
        title="Abrir memos"
        description="Leer interpretaciones y dudas metodológicas."
        onClick={() => router.push(routes.memosHref)}
      />
    </div>
  );
}
