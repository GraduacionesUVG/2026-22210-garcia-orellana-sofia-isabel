"use client";

import { useEffect, useId, useRef } from "react";
import Icon from "@/components/common/Icon";
import {
  PARTICIPANT_ATTRIBUTE_FIELDS,
  PARTICIPANT_STATUSES,
  formatCorpusDate,
  getParticipantAttributeChips,
  getParticipantStatusLabel,
} from "@/features/projects/corpus/helpers/corpus.helpers";
import { useCorpusCatalogManager } from "@/features/projects/corpus/hooks/useCorpusCatalogManager";

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition",
        active
          ? "bg-[#005944] text-white shadow-sm"
          : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
      onClick={onClick}
    >
      <Icon name={icon} className="text-base" />
      {label}
    </button>
  );
}

function Field({ label, children, hint, required = false, optional = false }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
        {optional && !required ? (
          <span className="ml-1 normal-case tracking-normal text-slate-400">
            (opcional)
          </span>
        ) : null}
      </span>

      <div className="mt-1">{children}</div>

      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={[
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition",
        "focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={[
        "w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-700 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Feedback({ errorMsg, successMsg }) {
  if (!errorMsg && !successMsg) return null;

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700">
            <Icon name="error" className="text-lg" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-800">
              Error
            </p>
            <p className="mt-1 text-sm text-red-900">{errorMsg}</p>
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
            Listo
          </p>
          <p className="mt-1 text-sm text-slate-700">{successMsg}</p>
        </div>
      </div>
    </div>
  );
}

function ParticipantForm({
  form,
  isEditing,
  saving,
  onFieldChange,
  onCancel,
  onSave,
}) {
  function setAttributeField(name, value) {
    onFieldChange("attributes", {
      ...(form.attributes ?? {}),
      [name]: value,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
            {isEditing ? "Editar participante" : "Nuevo participante"}
          </p>
        </div>

        {isEditing ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-[#005944]"
            onClick={onCancel}
          >
            <Icon name="close" className="text-base" />
            Cancelar
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Alias" required>
          <Input
            value={form.alias}
            onChange={(event) => onFieldChange("alias", event.target.value)}
            placeholder="Ej. P01"
            maxLength={120}
          />
        </Field>

        <Field label="Nombre visible" optional>
          <Input
            value={form.display_name}
            onChange={(event) =>
              onFieldChange("display_name", event.target.value)
            }
            placeholder="Ej. Participante 01"
            maxLength={180}
          />
        </Field>

        <Field label="Estado" optional>
          <Select
            value={form.status}
            onChange={(event) => onFieldChange("status", event.target.value)}
          >
            {PARTICIPANT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="hidden sm:block" />

        <div className="sm:col-span-2">
          <Field label="Notas" optional>
            <Textarea
              value={form.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              placeholder="Contexto metodológico opcional sobre el participante."
              rows={4}
              maxLength={10000}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            Atributos para submuestras
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Usa categorías amplias para proteger identidad.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PARTICIPANT_ATTRIBUTE_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} optional>
              <Input
                value={form.attributes?.[field.key] ?? ""}
                onChange={(event) =>
                  setAttributeField(field.key, event.target.value)
                }
                placeholder={field.placeholder}
                maxLength={160}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSave}
          disabled={saving}
        >
          <Icon
            name={saving ? "sync" : "save"}
            className={`text-base ${saving ? "animate-spin" : ""}`}
          />
          {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </button>
      </div>
    </section>
  );
}

function ParticipantList({
  participants,
  deletingId,
  onEdit,
  onDelete,
}) {
  if (!participants.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
          <Icon name="person_add" className="text-xl" />
        </div>

        <p className="mt-3 text-sm font-black text-slate-900">
          Todavía no hay participantes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => {
        const isDeleting = deletingId === participant.id;

        return (
          <article
            key={participant.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
                    {participant.alias}
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {getParticipantStatusLabel(participant.status)}
                  </span>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
                    {participant.linked_document_count ?? 0} docs
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-black text-slate-900">
                  {participant.display_name || "Sin nombre visible"}
                </h4>

                {participant.notes ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {participant.notes}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {getParticipantAttributeChips(participant)
                    .slice(0, 5)
                    .map((chip) => (
                      <span
                        key={chip.key}
                        className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                        title={chip.label}
                      >
                        {chip.value}
                      </span>
                    ))}
                </div>

                {participant.last_document_at ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Último documento: {formatCorpusDate(participant.last_document_at)}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Editar participante ${participant.alias}`}
                  title="Editar participante"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#005944]"
                  onClick={() => onEdit(participant)}
                >
                  <Icon name="edit" className="text-base" />
                </button>

                <button
                  type="button"
                  aria-label={`Eliminar participante ${participant.alias}`}
                  title="Eliminar participante"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onDelete(participant)}
                  disabled={Boolean(deletingId)}
                >
                  <Icon
                    name={isDeleting ? "sync" : "delete"}
                    className={`text-base ${isDeleting ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SourceForm({
  form,
  isEditing,
  saving,
  onFieldChange,
  onCancel,
  onSave,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
            {isEditing ? "Editar fuente" : "Nueva fuente"}
          </p>
        </div>

        {isEditing ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-[#005944]"
            onClick={onCancel}
          >
            <Icon name="close" className="text-base" />
            Cancelar
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Código" required>
          <Input
            value={form.code}
            onChange={(event) => onFieldChange("code", event.target.value)}
            placeholder="entrevista_docente"
            maxLength={80}
          />
        </Field>

        <Field label="Etiqueta" required>
          <Input
            value={form.label}
            onChange={(event) => onFieldChange("label", event.target.value)}
            placeholder="Entrevista docente"
            maxLength={160}
          />
        </Field>

        <Field label="Posición" optional>
          <Input
            type="number"
            min="0"
            value={form.position}
            onChange={(event) => onFieldChange("position", event.target.value)}
            placeholder="100"
          />
        </Field>

        <Field label="Activa" optional>
          <Select
            value={form.is_active ? "true" : "false"}
            onChange={(event) =>
              onFieldChange("is_active", event.target.value === "true")
            }
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Descripción" optional>
            <Textarea
              value={form.description}
              onChange={(event) =>
                onFieldChange("description", event.target.value)
              }
              placeholder="Descripción breve de esta fuente."
              rows={4}
              maxLength={5000}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSave}
          disabled={saving}
        >
          <Icon
            name={saving ? "sync" : "save"}
            className={`text-base ${saving ? "animate-spin" : ""}`}
          />
          {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </button>
      </div>
    </section>
  );
}

function SourceList({ sources, deletingId, onEdit, onDelete }) {
  if (!sources.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
          <Icon name="source" className="text-xl" />
        </div>

        <p className="mt-3 text-sm font-black text-slate-900">
          No hay fuentes activas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => {
        const isDeleting = deletingId === source.id;

        return (
          <article
            key={source.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
                    {source.code}
                  </span>

                  {source.is_default ? (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                      Predeterminada
                    </span>
                  ) : null}

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {source.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-black text-slate-900">
                  {source.label}
                </h4>

                {source.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {source.description}
                  </p>
                ) : null}

                <p className="mt-2 text-xs text-slate-400">
                  Posición: {source.position}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Editar fuente ${source.label}`}
                  title="Editar fuente"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#005944]"
                  onClick={() => onEdit(source)}
                >
                  <Icon name="edit" className="text-base" />
                </button>

                <button
                  type="button"
                  aria-label={`Eliminar fuente ${source.label}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onDelete(source)}
                  disabled={Boolean(deletingId) || source.is_default}
                  title={
                    source.is_default
                      ? "Las fuentes predeterminadas no se pueden eliminar"
                      : "Eliminar fuente"
                  }
                >
                  <Icon
                    name={isDeleting ? "sync" : "delete"}
                    className={`text-base ${isDeleting ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function CorpusCatalogModal({
  projectId,
  open,
  onClose,
  onChanged,
  initialTab = "participants",
  returnFocusRef,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const catalog = useCorpusCatalogManager(projectId, open, {
    onChanged,
    initialTab,
  });

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
                                                                           
                                                                  
    const trigger = returnFocusRef?.current ?? document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, returnFocusRef]);

  if (!open) return null;

  function containTab(event) {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll("button, input, textarea, select, a[href], [tabindex]")]
      .filter((node) => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-modal="true"
      onKeyDown={containTab}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-slate-950/40 px-4 py-6 backdrop-blur-sm overscroll-contain">
      <section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                Configuración del corpus
              </p>

              <h2 id={titleId} className="mt-1 text-xl font-black text-slate-950">
                Participantes y fuentes
              </h2>

            </div>

            <div className="flex items-center gap-2">
              <TabButton
                active={catalog.activeTab === "participants"}
                icon="groups"
                label="Participantes"
                onClick={() => catalog.setActiveTab("participants")}
              />

              <TabButton
                active={catalog.activeTab === "sources"}
                icon="source"
                label="Fuentes"
                onClick={() => catalog.setActiveTab("sources")}
              />

              <button
                type="button"
                className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
                onClick={onClose}
                aria-label="Cerrar configuración"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="space-y-4">
            {catalog.loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
                    <Icon name="sync" className="animate-spin text-xl" />
                  </span>

                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
                      Cargando catálogos
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Preparando participantes y fuentes del proyecto.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <Feedback
              errorMsg={catalog.errorMsg}
              successMsg={catalog.successMsg}
            />

            {catalog.activeTab === "participants" ? (
              <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                <ParticipantForm
                  form={catalog.participantForm}
                  isEditing={catalog.isEditingParticipant}
                  saving={catalog.savingParticipant}
                  onFieldChange={catalog.setParticipantField}
                  onCancel={catalog.resetParticipantForm}
                  onSave={catalog.saveParticipant}
                />

                <ParticipantList
                  participants={catalog.participants}
                  deletingId={catalog.deletingId}
                  onEdit={catalog.editParticipant}
                  onDelete={catalog.removeParticipant}
                />
              </div>
            ) : null}

            {catalog.activeTab === "sources" ? (
              <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                <SourceForm
                  form={catalog.sourceForm}
                  isEditing={catalog.isEditingSource}
                  saving={catalog.savingSource}
                  onFieldChange={catalog.setSourceField}
                  onCancel={catalog.resetSourceForm}
                  onSave={catalog.saveSource}
                />

                <SourceList
                  sources={catalog.sources}
                  deletingId={catalog.deletingId}
                  onEdit={catalog.editSource}
                  onDelete={catalog.removeSource}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </dialog>
  );
}
