"use client";

export default function SectionHeader({ title, description }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-serif font-bold text-slate-900">{title}</h1>

      <p className="mt-3 text-sm text-slate-500 max-w-2xl">{description}</p>
    </div>
  );
}