"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  findDocumentTextMatches,
  formatCorpusNumber,
} from "@/features/projects/corpus/helpers/corpus.helpers";

function FieldShell({ label, hint, children, required = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </p>

        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function SelectInput({ children, ...props }) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition",
        "focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

const TextAreaInput = forwardRef(function TextAreaInput(props, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      className={[
        "w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
});

function CatalogNotice({ catalogStatus, catalogError, onReload }) {
  if (catalogStatus === "success") return null;

  if (catalogStatus === "loading") {
    return (
      <div className="rounded-2xl border border-[#005944]/15 bg-[#005944]/5 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#005944]">
            <Icon name="sync" className="animate-spin text-lg" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
              Cargando catálogos
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Estamos preparando fuentes y participantes del proyecto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <Icon name="warning" className="text-lg" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-800">
              No se pudieron cargar las opciones
            </p>
            <p className="mt-1 text-sm text-amber-900">{catalogError}</p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-800"
          onClick={onReload}
        >
          <Icon name="refresh" className="text-base" />
          Reintentar
        </button>
      </div>
    </div>
  );
}

function FeedbackBanner({ savingError, successMsg }) {
  if (!savingError && !successMsg) return null;

  if (savingError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700">
            <Icon name="error" className="text-lg" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-800">
              No se pudo guardar
            </p>
            <p className="mt-1 text-sm text-red-900">{savingError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#005944]">
          <Icon name="check_circle" className="text-lg" />
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
            Guardado
          </p>
          <p className="mt-1 text-sm text-slate-600">{successMsg}</p>
        </div>
      </div>
    </div>
  );
}

function DocumentTextSearch({ content, onActiveMatch }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(
    () => findDocumentTextMatches(content, query, { context: 56, limit: 200 }),
    [content, query]
  );

  const safeActiveIndex = matches.length
    ? Math.min(activeIndex, matches.length - 1)
    : 0;
  const activeMatch = matches[safeActiveIndex] ?? null;

  useEffect(() => {
    onActiveMatch(activeMatch);
  }, [activeMatch, onActiveMatch]);

  function move(step) {
    if (!matches.length) return;
    setActiveIndex((safeActiveIndex + step + matches.length) % matches.length);
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar dentro del documento</span>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
            />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              placeholder="Buscar dentro del texto, citas o palabras clave"
            />
          </div>
        </label>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500">
            {matches.length
              ? `${safeActiveIndex + 1} de ${matches.length}`
              : query.trim()
                ? "0 resultados"
                : "Sin búsqueda"}
          </span>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-[#005944] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => move(-1)}
            disabled={!matches.length}
            aria-label="Resultado anterior"
          >
            <Icon name="keyboard_arrow_up" className="text-xl" />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-[#005944] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => move(1)}
            disabled={!matches.length}
            aria-label="Resultado siguiente"
          >
            <Icon name="keyboard_arrow_down" className="text-xl" />
          </button>
        </div>
      </div>

      {activeMatch ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
          <span>{activeMatch.before}</span>
          <mark className="rounded bg-amber-100 px-1 font-bold text-amber-900">
            {activeMatch.text}
          </mark>
          <span>{activeMatch.after}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function CorpusDocumentForm({
  form,
  sourceOptions,
  participantOptions,
  metrics,
  catalogStatus,
  catalogError,
  savingError,
  successMsg,
  onFieldChange,
  onReloadCatalogs,
}) {
  const contentRef = useRef(null);
  const [activeTextMatch, setActiveTextMatch] = useState(null);

  const selectedParticipant = participantOptions.find(
    (participant) => participant.value === form.participant_id
  );

  useEffect(() => {
    if (!activeTextMatch || !contentRef.current) return;

    contentRef.current.focus();
    contentRef.current.setSelectionRange(activeTextMatch.start, activeTextMatch.end);
  }, [activeTextMatch]);

  return (
    <div className="space-y-5">
      <CatalogNotice
        catalogStatus={catalogStatus}
        catalogError={catalogError}
        onReload={onReloadCatalogs}
      />

      <FeedbackBanner savingError={savingError} successMsg={successMsg} />

      <FieldShell
        label="Título"
        hint="Usa un título claro para identificar la entrevista o el texto en el corpus."
        required
      >
        <TextInput
          value={form.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          placeholder="Ej. Entrevista P01 sobre prácticas educativas"
          maxLength={250}
        />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          label="Tipo de documento"
          hint="Clasifica el texto según la naturaleza de la fuente."
          required
        >
          <SelectInput
            value={form.document_type}
            onChange={(event) =>
              onFieldChange("document_type", event.target.value)
            }
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Estado"
          hint="Indica qué tan listo está el texto para análisis posterior."
        >
          <SelectInput
            value={form.status}
            onChange={(event) => onFieldChange("status", event.target.value)}
          >
            {DOCUMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </SelectInput>
          {selectedParticipant ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                Vinculo de muestra
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {selectedParticipant.groupLabel || "Sin submuestra"} -{" "}
                {selectedParticipant.linkedDocumentCount ?? 0} documentos
                vinculados
              </p>
            </div>
          ) : null}
        </FieldShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          label="Fuente del corpus"
          hint="Puedes dejarlo vacío si todavía no aplica."
        >
          <SelectInput
            value={form.source_id}
            onChange={(event) => onFieldChange("source_id", event.target.value)}
          >
            <option value="">Sin fuente específica</option>
            {sourceOptions.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>

        <FieldShell
          label="Participante"
          hint="Vincula el texto a un alias como P01 o P02 si corresponde."
        >
          <SelectInput
            value={form.participant_id}
            onChange={(event) =>
              onFieldChange("participant_id", event.target.value)
            }
          >
            <option value="">Sin participante</option>
            {participantOptions.map((participant) => (
              <option key={participant.value} value={participant.value}>
                {participant.label}
              </option>
            ))}
          </SelectInput>
        </FieldShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FieldShell label="Fecha de entrevista">
          <TextInput
            type="date"
            value={form.interview_date}
            onChange={(event) =>
              onFieldChange("interview_date", event.target.value)
            }
          />
        </FieldShell>

        <FieldShell label="Fecha de campo">
          <TextInput
            type="date"
            value={form.field_date}
            onChange={(event) =>
              onFieldChange("field_date", event.target.value)
            }
          />
        </FieldShell>

        <FieldShell label="Idioma">
          <TextInput
            value={form.language}
            onChange={(event) => onFieldChange("language", event.target.value)}
            placeholder="es"
            maxLength={20}
          />
        </FieldShell>
      </div>

      <FieldShell
        label="Ubicación"
        hint="Lugar de recolección del dato, si es relevante para el estudio."
      >
        <TextInput
          value={form.location}
          onChange={(event) => onFieldChange("location", event.target.value)}
          placeholder="Ej. Ciudad de Guatemala"
          maxLength={250}
        />
      </FieldShell>

      <FieldShell
        label="Transcripción o texto cualitativo"
        hint="Pega aquí el texto. Esta fase no procesa PDF, Word, audio ni OCR."
      >
        <DocumentTextSearch
          content={form.content}
          onActiveMatch={setActiveTextMatch}
        />

        <TextAreaInput
          ref={contentRef}
          value={form.content}
          onChange={(event) => onFieldChange("content", event.target.value)}
          placeholder="Pega aquí la entrevista, nota de campo, observación o texto cualitativo..."
          rows={16}
          maxLength={1000000}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {formatCorpusNumber(metrics.words)} palabras
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {formatCorpusNumber(metrics.characters)} caracteres
          </span>
        </div>
      </FieldShell>

      <FieldShell
        label="Notas contextuales"
        hint="Agrega contexto metodológico, observaciones o advertencias sobre la calidad del dato."
      >
        <TextAreaInput
          value={form.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          placeholder="Ej. Entrevista realizada en ambiente ruidoso; algunas respuestas fueron resumidas..."
          rows={5}
          maxLength={20000}
        />
      </FieldShell>
    </div>
  );
}
