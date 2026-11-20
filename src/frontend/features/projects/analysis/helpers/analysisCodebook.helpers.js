const COMMON_TERMS = new Set([
  "a",
  "al",
  "con",
  "como",
  "de",
  "del",
  "desde",
  "donde",
  "e",
  "el",
  "en",
  "entre",
  "es",
  "esta",
  "este",
  "estos",
  "incluye",
  "la",
  "las",
  "lo",
  "los",
  "o",
  "para",
  "por",
  "que",
  "se",
  "sin",
  "su",
  "sus",
  "un",
  "una",
  "y",
]);

function getCodeId(code) {
  return String(code?.id ?? "").trim();
}

function getParentId(code) {
  const parentId = String(code?.parent_code_id ?? "").trim();
  return parentId || null;
}

function getCodePosition(code) {
  const position = Number(code?.position ?? 0);
  return Number.isFinite(position) ? position : 0;
}

function sortCodes(a, b) {
  const positionDiff = getCodePosition(a) - getCodePosition(b);
  if (positionDiff !== 0) return positionDiff;
  return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "es");
}

function getStatCount(stats) {
  return Number(
    stats?.coded_segments_count ??
      stats?.segment_count ??
      stats?.usage_count ??
      stats?.count ??
      0
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildCodeTreeIndex(codes = []) {
  const nodesById = new Map();
  const childrenByParentId = new Map();

  codes.forEach((code) => {
    const id = getCodeId(code);
    if (!id) return;
    nodesById.set(id, code);
  });

  codes.forEach((code) => {
    const id = getCodeId(code);
    if (!id) return;

    const parentId = getParentId(code);
    const bucketKey = parentId && nodesById.has(parentId) ? parentId : "__root__";
    const bucket = childrenByParentId.get(bucketKey) ?? [];
    bucket.push(code);
    childrenByParentId.set(bucketKey, bucket);
  });

  childrenByParentId.forEach((bucket) => bucket.sort(sortCodes));

  const rootIds = (childrenByParentId.get("__root__") ?? []).map(getCodeId);
  const leafIds = [];

  function collectLeaves(code) {
    const id = getCodeId(code);
    if (!id) return;

    const children = childrenByParentId.get(id) ?? [];
    if (!children.length) {
      leafIds.push(id);
      return;
    }

    children.forEach(collectLeaves);
  }

  (childrenByParentId.get("__root__") ?? []).forEach(collectLeaves);

  function getChildren(codeId) {
    return childrenByParentId.get(codeId) ?? [];
  }

  function getDescendantIds(codeId) {
    const result = [];
    const seen = new Set();
    const stack = getChildren(codeId).map(getCodeId).reverse();

    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || seen.has(currentId)) continue;
      seen.add(currentId);
      result.push(currentId);
      getChildren(currentId)
        .map(getCodeId)
        .reverse()
        .forEach((childId) => stack.push(childId));
    }

    return result;
  }

  function getPath(codeId) {
    const path = [];
    const seen = new Set();
    let current = nodesById.get(codeId);

    while (current) {
      const currentId = getCodeId(current);
      if (!currentId || seen.has(currentId)) break;
      seen.add(currentId);
      path.unshift(current);
      const parentId = getParentId(current);
      current = parentId ? nodesById.get(parentId) : null;
    }

    return path;
  }

  function getBranchCodes(codeId) {
    return [codeId, ...getDescendantIds(codeId)]
      .map((id) => nodesById.get(id))
      .filter(Boolean);
  }

  return {
    nodesById,
    childrenByParentId,
    rootIds,
    leafIds,
    getChildren,
    getDescendantIds,
    getPath,
    getBranchCodes,
    isLeaf: (codeId) => leafIds.includes(codeId),
  };
}

export function validateCodebookIntegrity(codes = []) {
  const issues = [];
  const index = buildCodeTreeIndex(codes);
  const positionBuckets = new Map();

  codes.forEach((code) => {
    const id = getCodeId(code);
    if (!id) return;

    const parentId = getParentId(code);
    if (parentId && !index.nodesById.has(parentId)) {
      issues.push({
        type: "orphan_parent",
        severity: "high",
        codeId: id,
        message: `"${code.name}" apunta a un padre que no existe.`,
      });
    }

    const bucketKey = parentId ?? "__root__";
    const positionKey = `${bucketKey}:${getCodePosition(code)}`;
    const duplicate = positionBuckets.get(positionKey);
    if (duplicate) {
      issues.push({
        type: "duplicate_sibling_position",
        severity: "medium",
        codeId: id,
        relatedCodeId: duplicate,
        message: `"${code.name}" comparte posicion con otro codigo hermano.`,
      });
    } else {
      positionBuckets.set(positionKey, id);
    }

    if (!String(code.definition ?? "").trim()) {
      issues.push({
        type: "missing_definition",
        severity: "low",
        codeId: id,
        message: `"${code.name}" no tiene definicion metodologica.`,
      });
    }
  });

  codes.forEach((code) => {
    const id = getCodeId(code);
    if (!id) return;

    const seen = new Set([id]);
    let parentId = getParentId(code);

    while (parentId) {
      if (seen.has(parentId)) {
        issues.push({
          type: "cycle",
          severity: "critical",
          codeId: id,
          relatedCodeId: parentId,
          message: `"${code.name}" participa en un ciclo jerarquico.`,
        });
        break;
      }
      seen.add(parentId);
      parentId = getParentId(index.nodesById.get(parentId));
    }
  });

  return issues;
}

export function extractCodeKeywords(code = {}, { limit = 8 } = {}) {
  const weightedText = [
    code.name,
    code.name,
    code.description,
    code.definition,
    code.inclusion_criteria,
    code.exclusion_criteria,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const scores = new Map();
  const terms = weightedText.match(/[a-z0-9]{4,}/g) ?? [];

  terms.forEach((term) => {
    if (COMMON_TERMS.has(term)) return;
    scores.set(term, (scores.get(term) ?? 0) + 1);
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, limit)
    .map(([term]) => term);
}

export function compareCodeBranches({
  codes = [],
  statsByCodeId = new Map(),
  leftCodeId,
  rightCodeId,
} = {}) {
  const index = buildCodeTreeIndex(codes);

  function summarize(codeId) {
    const branchCodes = index.getBranchCodes(codeId);
    const branchIds = branchCodes.map(getCodeId);
    const leafCodes = branchIds.filter((id) => index.isLeaf(id));
    const keywords = [
      ...new Set(branchCodes.flatMap((code) => extractCodeKeywords(code, { limit: 5 }))),
    ].slice(0, 10);

    return {
      codeId,
      name: index.nodesById.get(codeId)?.name ?? "",
      totalCodes: branchCodes.length,
      leafCodes: leafCodes.length,
      segmentCount: branchIds.reduce(
        (total, id) => total + getStatCount(statsByCodeId.get(id)),
        0
      ),
      keywords,
    };
  }

  const left = summarize(leftCodeId);
  const right = summarize(rightCodeId);

  return {
    left,
    right,
    sharedKeywords: left.keywords.filter((term) => right.keywords.includes(term)),
    difference: {
      totalCodes: left.totalCodes - right.totalCodes,
      leafCodes: left.leafCodes - right.leafCodes,
      segmentCount: left.segmentCount - right.segmentCount,
    },
  };
}

export function buildCodebookHierarchyExportHtml({
  projectName = "Proyecto cualitativo",
  codes = [],
  statsByCodeId = new Map(),
} = {}) {
  const index = buildCodeTreeIndex(codes);
  const issues = validateCodebookIntegrity(codes);
  const generatedAt = new Date().toISOString().slice(0, 10);

  function renderNode(code, depth = 0) {
    const id = getCodeId(code);
    const segmentCount = getStatCount(statsByCodeId.get(id));
    const keywords = extractCodeKeywords(code, { limit: 6 });
    const children = index.getChildren(id);
    const indent = depth * 22;

    return `
      <section class="node" style="margin-left:${indent}px;border-left-color:${escapeHtml(
      code.color || "#0f766e"
    )}">
        <div class="node-head">
          <div>
            <p class="eyebrow">${depth === 0 ? "Rama" : "Subcodigo"}</p>
            <h2>${escapeHtml(code.name)}</h2>
          </div>
          <strong>${segmentCount} segmentos</strong>
        </div>
        ${
          code.description
            ? `<p class="body">${escapeHtml(code.description)}</p>`
            : ""
        }
        ${
          code.definition
            ? `<p class="definition">${escapeHtml(code.definition)}</p>`
            : ""
        }
        <p class="terms"><span>Terminos clave</span> ${
          keywords.length ? keywords.map(escapeHtml).join(" · ") : "Sin terminos suficientes"
        }</p>
      </section>
      ${children.map((child) => renderNode(child, depth + 1)).join("")}
    `;
  }

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Codebook jerarquico - ${escapeHtml(projectName)}</title>
  <style>
    body { margin: 0; background: #f5f8f6; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 48px 32px; }
    .cover { border: 1px solid #cfe4dd; border-radius: 28px; background: linear-gradient(135deg, #ffffff, #edf8f4); padding: 34px; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08); }
    .eyebrow { margin: 0 0 8px; color: #005944; font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 40px; line-height: 1.05; letter-spacing: -0.02em; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
    .metric { border: 1px solid #dbe7e4; border-radius: 18px; background: #fff; padding: 18px; }
    .metric strong { display:block; font-size: 28px; }
    .metric span { color:#49647a; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; }
    .node { margin-top: 18px; border-left: 6px solid #0f766e; border-radius: 18px; background: #fff; padding: 18px 20px; box-shadow: 0 12px 36px rgba(15,23,42,.06); }
    .node-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
    h2 { margin:0; font-size: 20px; }
    .node-head strong { border-radius:999px; background:#e7f4f0; color:#005944; padding:8px 12px; font-size:12px; white-space:nowrap; }
    .body { color:#3d5870; line-height:1.65; }
    .definition { border-radius:16px; background:#f4f7f6; padding:12px 14px; color:#234158; line-height:1.55; }
    .terms { color:#49647a; font-size:13px; }
    .terms span { color:#005944; font-weight:900; text-transform:uppercase; letter-spacing:.12em; margin-right:10px; }
  </style>
</head>
<body>
  <main>
    <section class="cover">
      <p class="eyebrow">Codebook jerarquico premium</p>
      <h1>${escapeHtml(projectName)}</h1>
      <p>Export generado el ${generatedAt}. Este documento resume jerarquia, uso, terminos clave y alertas de integridad del arbol de codigos.</p>
      <div class="summary">
        <div class="metric"><strong>${codes.length}</strong><span>codigos</span></div>
        <div class="metric"><strong>${index.leafIds.length}</strong><span>hojas</span></div>
        <div class="metric"><strong>${issues.length ? issues.length : "0"}</strong><span>${
    issues.length ? "alertas" : "Sin alertas criticas"
  }</span></div>
      </div>
    </section>
    ${index.rootIds
      .map((id) => index.nodesById.get(id))
      .filter(Boolean)
      .map((code) => renderNode(code, 0))
      .join("")}
  </main>
</body>
</html>`;
}

export function downloadCodebookHierarchyExport({
  projectName,
  codes,
  statsByCodeId,
} = {}) {
  if (typeof window === "undefined") return;

  const html = buildCodebookHierarchyExportHtml({
    projectName,
    codes,
    statsByCodeId,
  });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `codebook-jerarquico-${new Date()
    .toISOString()
    .slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
