"use client";

function getSaveBadge(state) {
  if (state === "saving") {
    return { text: "Guardando...", cls: "text-slate-400" };
  }

  if (state === "error") {
    return {
      text: "Error al guardar",
      cls: "text-red-600 border-red-200",
    };
  }

  return {
    text: "Draft Guardado",
    cls: "text-slate-400",
  };
}

export default function SaveStateBadge({ savingState, savingError }) {
  const badge = getSaveBadge(savingState);

  return (
    <span
      className={`text-[10px] font-bold bg-white px-2 py-1 rounded border border-slate-200 uppercase ${badge.cls}`}
      title={savingState === "error" ? savingError : ""}
    >
      {badge.text}
    </span>
  );
}