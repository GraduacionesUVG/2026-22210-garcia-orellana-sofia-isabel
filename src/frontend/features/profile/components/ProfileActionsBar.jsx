export default function ProfileActionsBar({
  hasChanges,
  saving,
  loggingOut,
  onCancel,
  onLogout,
}) {
  return (
    <div className="profile-actions p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut || saving}
        className="px-6 py-2.5 border border-red-200 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loggingOut ? "Cerrando..." : "Cerrar sesión"}
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={!hasChanges || saving || loggingOut}
          className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving || loggingOut}
          className="px-8 py-2.5 bg-[#005944] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#004836] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
