"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import {
  formatCorpusDate,
  formatCorpusNumber,
  getDocumentArchiveMetadata,
  getDocumentHref,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getParticipantGroupLabel,
} from "@/features/projects/corpus/helpers/corpus.helpers";
import { getCorpusDocumentExportUrl } from "@/features/projects/corpus/api/corpus.api";

function findSourceLabel(sources, sourceId) {
  if (!sourceId) return "Sin fuente";
  return sources.find((source) => source.id === sourceId)?.label ?? "Fuente";
}

function findParticipantLabel(participants, participantId) {
  if (!participantId) return "Sin participante";

  const participant = participants.find((item) => item.id === participantId);

  if (!participant) return "Participante";

  return participant.display_name
    ? `${participant.alias} · ${participant.display_name}`
    : participant.alias;
}

function findParticipantGroup(participants, participantId) {
  if (!participantId) return "";

  const participant = participants.find((item) => item.id === participantId);

  return participant ? getParticipantGroupLabel(participant) : "";
}

function MetadataItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon name={icon} className="mt-0.5 shrink-0 text-base text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function CorpusDocumentCard({
  projectId,
  document,
  sources = [],
  participants = [],
}) {
  const router = useRouter();

  const sourceLabel = findSourceLabel(sources, document.source_id);
  const participantLabel = findParticipantLabel(
    participants,
    document.participant_id
  );
  const participantGroup = findParticipantGroup(
    participants,
    document.participant_id
  );
  const participantDetail = [
    participantLabel,
    participantGroup && participantLabel !== participantGroup
      ? participantGroup
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const archiveMeta = getDocumentArchiveMetadata(document);

  function openDocument() {
    router.push(getDocumentHref(projectId, document.id));
  }

  function handleCardKeyDown(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDocument();
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Abrir documento ${document.title}`}
      onClick={openDocument}
      onKeyDown={handleCardKeyDown}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#005944]/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005944]/20"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
              {getDocumentTypeLabel(document.document_type)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {getDocumentStatusLabel(document.status)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-slate-900">
            {document.title}
          </h3>

          <div className="mt-4 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <MetadataItem icon="source" label="Fuente" value={sourceLabel} />
            <MetadataItem
              icon="person"
              label="Participante"
              value={participantDetail}
            />
            <MetadataItem
              icon="format_align_left"
              label="Extensión"
              value={`${formatCorpusNumber(document.word_count)} palabras`}
            />
            <MetadataItem
              icon="event"
              label="Fecha de campo"
              value={archiveMeta.dateLabel}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-start">
          <button
            type="button"
            aria-label="Descargar documento como TXT"
            title="Descargar TXT"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#005944]/10 hover:text-[#005944]"
            onClick={(event) => {
              event.stopPropagation();
              window.location.assign(
                getCorpusDocumentExportUrl(projectId, document.id)
              );
            }}
          >
            <Icon name="download" className="text-[18px]" />
          </button>
        </div>
      </div>

      {archiveMeta.notesPreview ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Nota contextual
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {archiveMeta.notesPreview}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>
          <span className="font-bold text-slate-400">Lugar:</span>{" "}
          {archiveMeta.locationLabel}
        </span>
        <span>
          <span className="font-bold text-slate-400">Idioma:</span>{" "}
          {archiveMeta.languageLabel}
        </span>
        <span>
          <span className="font-bold text-slate-400">Editado:</span>{" "}
          {formatCorpusDate(document.updated_at)}
        </span>
      </div>
    </article>
  );
}
