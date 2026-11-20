"use client";

import AssistantSidebarContainer from "@/features/projects/workspace/components/AssistantSidebarContainer";
import JackSidebarFrame from "@/features/projects/workspace/components/JackSidebarFrame";
import Icon from "@/components/common/Icon";

export default function CorpusAssistantSidebar() {
  return (
    <AssistantSidebarContainer>
      <JackSidebarFrame
        title="Corpus"
        description="Guía para preparar datos cualitativos antes del análisis."
      >
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
                <Icon name="tips_and_updates" className="text-lg" />
              </span>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Recomendación metodológica
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Usa alias para participantes, clasifica cada texto por tipo de
                  fuente y evita pegar datos personales innecesarios en las
                  transcripciones.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Esta fase acepta
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Texto pegado manualmente desde entrevistas, notas de campo,
                observaciones o diarios.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Todavía no acepta
              </p>
              <p className="mt-2 text-sm text-slate-600">
                PDF, Word, audio, imágenes escaneadas ni OCR automático.
              </p>
            </div>
          </div>
        </div>
      </JackSidebarFrame>
    </AssistantSidebarContainer>
  );
}