import Icon from "@/components/common/Icon";

export default function ProfileSecuritySection({
  form,
  inputClassName,
  onFieldChange,
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6 text-[#005944]">
        <Icon name="lock_reset" className="text-[22px]" />
        <h2 className="text-lg font-bold">Seguridad</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Contraseña actual
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            value={form.currentPassword}
            onChange={(e) => onFieldChange("currentPassword", e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Nueva contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            value={form.newPassword}
            onChange={(e) => onFieldChange("newPassword", e.target.value)}
            placeholder="Mín. 6 caracteres"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            value={form.confirmNewPassword}
            onChange={(e) =>
              onFieldChange("confirmNewPassword", e.target.value)
            }
            placeholder="••••••••"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        La contraseña solo se actualiza si escribes una nueva.
      </p>
    </section>
  );
}