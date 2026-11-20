"use client";

export default function TeamHeader() {
  return (
    <div className="mb-6">
      <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
        Colaboracion
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Equipo del proyecto
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
        Invita personas, define permisos y revisa quien esta trabajando en el
        proyecto sin activar sincronizacion costosa en tiempo real.
      </p>
    </div>
  );
}
