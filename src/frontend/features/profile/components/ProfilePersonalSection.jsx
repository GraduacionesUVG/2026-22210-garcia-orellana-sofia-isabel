import Icon from "@/components/common/Icon";

export default function ProfilePersonalSection({ form, inputClassName, onFieldChange }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6 text-[#005944]">
        <Icon name="badge" className="text-[22px]" />
        <h2 className="text-lg font-bold">Información Personal</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Nombre Completo
          </label>
          <input
            type="text"
            className={inputClassName}
            value={form.full_name}
            onChange={(e) => onFieldChange("full_name", e.target.value)}
            placeholder="Ej. Juan Perez"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Correo Electrónico (Institucional)
          </label>
          <input
            type="email"
            readOnly
            className={`${inputClassName} bg-gray-50 cursor-not-allowed text-slate-600`}
            value={form.email}
          />
        </div>

      </div>
    </section>
  );
}
