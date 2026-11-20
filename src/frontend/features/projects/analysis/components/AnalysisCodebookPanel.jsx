"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/common/Icon";
import AnalysisCodeFormModal from "@/features/projects/analysis/components/AnalysisCodeFormModal";
import AnalysisCodeTree from "@/features/projects/analysis/components/AnalysisCodeTree";
import {
  buildCodeTreeIndex,
  compareCodeBranches,
  downloadCodebookHierarchyExport,
  extractCodeKeywords,
  validateCodebookIntegrity,
} from "@/features/projects/analysis/helpers/analysisCodebook.helpers";

function CodeSelectOptions({ codes = [], index, excludeIds = new Set() }) {
  return codes
    .filter((code) => !excludeIds.has(code.id))
    .map((code) => {
      const depth = Math.max(0, (index?.getPath(code.id)?.length ?? 1) - 1);
      return (
        <option key={code.id} value={code.id}>
          {"--".repeat(depth)} {code.name}
        </option>
      );
    });
}

export default function AnalysisCodebookPanel({ manager }) {
  const [leafOnly, setLeafOnly] = useState(false);
  const [moveCodeId, setMoveCodeId] = useState("");
  const [moveParentId, setMoveParentId] = useState("");
  const [movePosition, setMovePosition] = useState(0);
  const [leftBranchId, setLeftBranchId] = useState("");
  const [rightBranchId, setRightBranchId] = useState("");

  const treeIndex = useMemo(
    () => buildCodeTreeIndex(manager.codes),
    [manager.codes]
  );
  const integrityIssues = useMemo(
    () => validateCodebookIntegrity(manager.codes),
    [manager.codes]
  );

  const activeMoveCode = useMemo(
    () => manager.codes.find((code) => code.id === moveCodeId) ?? null,
    [manager.codes, moveCodeId]
  );

  const selectedMoveCode = activeMoveCode ?? manager.codes[0] ?? null;
  const selectedMoveId = selectedMoveCode?.id ?? "";
  const effectiveMoveParentId = moveCodeId
    ? moveParentId
    : selectedMoveCode?.parent_code_id ?? "";
  const effectiveMovePosition = moveCodeId
    ? movePosition
    : selectedMoveCode?.position ?? 0;
  const blockedParentIds = useMemo(() => {
    if (!selectedMoveId) return new Set();
    return new Set([selectedMoveId, ...treeIndex.getDescendantIds(selectedMoveId)]);
  }, [selectedMoveId, treeIndex]);

  const displayedCodes = useMemo(() => {
    if (!leafOnly) return manager.codes;
    const leafIds = new Set(treeIndex.leafIds);
    return manager.codes.filter((code) => leafIds.has(code.id));
  }, [leafOnly, manager.codes, treeIndex]);

  const branchIds = treeIndex.rootIds.length >= 2 ? treeIndex.rootIds : manager.codes.map((code) => code.id);
  const activeLeftBranchId = leftBranchId || branchIds[0] || "";
  const activeRightBranchId = rightBranchId || branchIds[1] || branchIds[0] || "";
  const branchComparison =
    activeLeftBranchId && activeRightBranchId
      ? compareCodeBranches({
          codes: manager.codes,
          statsByCodeId: manager.statsByCodeId,
          leftCodeId: activeLeftBranchId,
          rightCodeId: activeRightBranchId,
        })
      : null;

  function handleSelectMoveCode(codeId) {
    const code = manager.codes.find((item) => item.id === codeId);
    setMoveCodeId(codeId);
    setMoveParentId(code?.parent_code_id ?? "");
    setMovePosition(code?.position ?? 0);
  }

  async function handleSaveMove() {
    if (!selectedMoveCode) return;
    await manager.moveCode(selectedMoveCode, {
      parent_code_id: effectiveMoveParentId || null,
      position: Number(effectiveMovePosition || 0),
    });
  }

  function handleExportTree() {
    downloadCodebookHierarchyExport({
      projectName: "Codebook del proyecto",
      codes: manager.codes,
      statsByCodeId: manager.statsByCodeId,
    });
  }

  return (
    <>
      <div>
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#005944]/20 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                  Libro de códigos
                </p>
                <h3 className="mt-1 text-base font-black text-slate-950">
                  Define y organiza tus códigos.
                </h3>
              </div>

              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
                onClick={manager.openCreateModal}
              >
                <Icon name="add" className="text-base" />
                Crear código
              </button>
            </div>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-white">
            <summary className="hide-details-marker group flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#005944] sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                  Árbol operativo
                </p>
                <h3 className="mt-1 text-base font-black text-slate-950">
                  Ordena y compara códigos
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Abre para revisar alertas, mover códigos o comparar ramas.
                </p>
              </div>
              <Icon
                name="expand_more"
                className="shrink-0 text-xl text-slate-500 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="border-t border-slate-100 p-4 sm:p-5">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2 ${
                    leafOnly
                      ? "border-[#005944] bg-[#005944] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#005944]/40"
                  }`}
                  onClick={() => setLeafOnly((value) => !value)}
                  aria-pressed={leafOnly}
                >
                  <Icon name="filter_list" className="text-base" />
                  Solo hojas
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:border-[#005944]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
                  onClick={handleExportTree}
                >
                  <Icon name="download" className="text-base" />
                  Exportar árbol
                </button>
              </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Integridad
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {integrityIssues.length
                      ? `${integrityIssues.length} alertas por revisar`
                      : "Sin alertas críticas"}
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
                  {treeIndex.leafIds.length} hojas
                </span>
              </div>

              <div className="mt-3 max-h-28 space-y-2 overflow-y-auto">
                {integrityIssues.length ? (
                  integrityIssues.slice(0, 4).map((issue, index) => (
                    <p
                      key={`${issue.type}-${issue.codeId}-${index}`}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900"
                    >
                      {issue.message}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-slate-600">
                    La estructura está lista.
                  </p>
                )}
              </div>
            </div>

            <section
              aria-labelledby="move-code-heading"
              className="mt-5 border-t border-slate-100 pt-5"
            >
              <div>
                <h4
                  id="move-code-heading"
                  className="text-sm font-black text-slate-950"
                >
                  Reordenar códigos
                </h4>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="block min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Código a mover
                  </span>
                  <select
                    className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                    value={selectedMoveId}
                    onChange={(event) => handleSelectMoveCode(event.target.value)}
                  >
                    <CodeSelectOptions codes={manager.codes} index={treeIndex} />
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Código padre
                  </span>
                  <select
                    className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                    value={effectiveMoveParentId}
                    onChange={(event) => setMoveParentId(event.target.value)}
                  >
                    <option value="">Sin padre</option>
                    <CodeSelectOptions
                      codes={manager.codes}
                      index={treeIndex}
                      excludeIds={blockedParentIds}
                    />
                  </select>
                </label>

                <label className="block min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Posición
                  </span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                    type="number"
                    min="0"
                    value={effectiveMovePosition}
                    onChange={(event) => setMovePosition(event.target.value)}
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-xs font-bold text-white transition-colors hover:bg-[#004232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2 disabled:opacity-60"
                    onClick={handleSaveMove}
                    disabled={!selectedMoveCode || manager.movingId === selectedMoveId}
                  >
                    <Icon
                      name={manager.movingId === selectedMoveId ? "sync" : "drive_file_move"}
                      className={`text-base ${
                        manager.movingId === selectedMoveId ? "animate-spin" : ""
                      }`}
                    />
                    Guardar posición
                  </button>
                </div>
              </div>
            </section>

            {branchComparison ? (
              <section
                aria-labelledby="compare-branches-heading"
                className="mt-5 border-t border-slate-100 pt-5"
              >
                <div>
                  <div>
                    <h4
                      id="compare-branches-heading"
                      className="text-sm font-black text-slate-950"
                    >
                      Comparar ramas
                    </h4>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Primera rama
                      </span>
                    <select
                        className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                      value={activeLeftBranchId}
                      onChange={(event) => setLeftBranchId(event.target.value)}
                    >
                      <CodeSelectOptions codes={manager.codes} index={treeIndex} />
                    </select>
                    </label>

                    <label className="block min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Segunda rama
                      </span>
                    <select
                        className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                      value={activeRightBranchId}
                      onChange={(event) => setRightBranchId(event.target.value)}
                    >
                      <CodeSelectOptions codes={manager.codes} index={treeIndex} />
                    </select>
                    </label>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  {[branchComparison.left, branchComparison.right].map((branch) => (
                    <div
                      key={branch.codeId}
                      className="min-w-0 rounded-xl bg-slate-50 p-3"
                    >
                      <p className="break-words text-sm font-black text-slate-900">
                        {branch.name}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {branch.totalCodes} códigos · {branch.leafCodes} hojas ·{" "}
                        {branch.segmentCount} segmentos
                      </p>
                      <p className="mt-2 break-words text-xs font-bold text-[#005944]">
                        {branch.keywords.slice(0, 4).join(" · ") ||
                          "Sin términos suficientes"}
                      </p>
                    </div>
                  ))}
                  <div className="min-w-0 rounded-xl bg-[#005944]/10 p-3">
                    <p className="text-sm font-black text-slate-900">
                      Lectura comparativa
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Diferencia: {branchComparison.difference.segmentCount}{" "}
                      segmentos. Términos compartidos:{" "}
                      {branchComparison.sharedKeywords.join(", ") || "ninguno"}.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
            </div>
          </details>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Buscar
              </span>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                value={manager.filters.search}
                onChange={(event) =>
                  manager.updateFilter("search", event.target.value)
                }
                placeholder="Nombre, descripción o definición"
              />
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Padre
              </span>
              <select
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                value={manager.filters.parent_code_id}
                onChange={(event) =>
                  manager.updateFilter("parent_code_id", event.target.value)
                }
              >
                <option value="">Todos</option>
                {manager.codes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {manager.errorMsg ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {manager.errorMsg}
            </div>
          ) : null}

          {manager.successMsg ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-slate-700">
              {manager.successMsg}
            </div>
          ) : null}

          {manager.loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
            </div>
          ) : (
            <AnalysisCodeTree
              codes={displayedCodes}
              statsByCodeId={manager.statsByCodeId}
              deletingId={manager.deletingId}
              onEdit={manager.openEditModal}
              onDelete={manager.removeCode}
              onCreate={manager.openCreateModal}
              getKeywords={(code) => extractCodeKeywords(code, { limit: 5 })}
            />
          )}
        </section>
      </div>

      <AnalysisCodeFormModal
        open={manager.modalOpen}
        form={manager.form}
        codes={manager.codes}
        editingCode={manager.editingCode}
        saving={manager.saving}
        onClose={manager.closeModal}
        onFieldChange={manager.setFormField}
        onSave={manager.saveCode}
      />
    </>
  );
}
