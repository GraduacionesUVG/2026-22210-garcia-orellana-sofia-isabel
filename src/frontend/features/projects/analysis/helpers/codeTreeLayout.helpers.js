const GRAPH_WIDTH = 860;
const GRAPH_LEFT = 88;
const NODE_WIDTH = 172;
const NODE_HEIGHT = 48;
const MIN_GRAPH_HEIGHT = 300;
const MAX_VISIBLE_ROOTS = 7;
const MAX_VISIBLE_CHILDREN = 4;

function getCodeStatValue(item) {
  return Number(
    item?.segment_count ??
      item?.coded_segments_count ??
      item?.usage_count ??
      item?.count ??
      0
  );
}

function buildStatsByCodeId(codeStats = []) {
  return new Map(codeStats.map((item) => [item.code_id ?? item.id, item]));
}

function getUsageForCode(code, statsByCodeId) {
  return getCodeStatValue(statsByCodeId.get(code.id));
}

function buildHierarchy(codes = []) {
  const childMap = new Map();

  codes.forEach((code) => {
    const parentId = code.parent_code_id || "__root";
    if (!childMap.has(parentId)) childMap.set(parentId, []);
    childMap.get(parentId).push(code);
  });

  return {
    childMap,
    roots: childMap.get("__root") ?? codes.filter((code) => !code.parent_code_id),
  };
}

function getAggregateUsage(root, childMap, statsByCodeId) {
  const rootUsage = getUsageForCode(root, statsByCodeId);
  const childUsage = (childMap.get(root.id) ?? []).reduce(
    (total, child) => total + getUsageForCode(child, statsByCodeId),
    0
  );

  return rootUsage + childUsage;
}

function sortByUsageDesc(statsByCodeId) {
  return (a, b) => getUsageForCode(b, statsByCodeId) - getUsageForCode(a, statsByCodeId);
}

function getVisibleRoots(roots, childMap, statsByCodeId) {
  const rootsWithChildren = roots
    .filter((root) => (childMap.get(root.id) ?? []).length > 0)
    .sort(
      (a, b) =>
        getAggregateUsage(b, childMap, statsByCodeId) -
        getAggregateUsage(a, childMap, statsByCodeId)
    );
  const leafRoots = roots
    .filter((root) => !(childMap.get(root.id) ?? []).length)
    .sort(sortByUsageDesc(statsByCodeId));

  return [...rootsWithChildren, ...leafRoots].slice(0, MAX_VISIBLE_ROOTS);
}

export function buildTreeLayout(codes = [], codeStats = [], zoom = 1) {
  const statsByCodeId = buildStatsByCodeId(codeStats);
  const { childMap, roots } = buildHierarchy(codes);
  const separation = 1 + Math.max(0, zoom - 1) * 0.35;
  const leftX = GRAPH_LEFT;
  const middleX = GRAPH_LEFT + 280 * separation;
  const rightX = GRAPH_LEFT + 610 * separation;
  const graphWidth = Math.max(GRAPH_WIDTH, rightX + NODE_WIDTH / 2 + 96);
  const sortedRoots = getVisibleRoots(roots, childMap, statsByCodeId);

  const rows = sortedRoots.map((root) => ({
    root,
    children: [...(childMap.get(root.id) ?? [])]
      .sort(sortByUsageDesc(statsByCodeId))
      .slice(0, MAX_VISIBLE_CHILDREN),
  }));

  const rowHeight =
    Math.max(
      88,
      ...rows.map((row) => Math.max(1, row.children.length) * 48 + 54)
    ) * separation;
  const graphHeight = Math.max(MIN_GRAPH_HEIGHT, rows.length * rowHeight + 112);
  const rootY = graphHeight / 2;
  const nodes = [
    {
      id: "__root",
      label: "Codebook",
      subtitle: `${codes.length} codigos`,
      color: "#005944",
      x: leftX,
      y: rootY,
      usage: codes.length,
      kind: "root",
    },
  ];
  const lines = [];

  rows.forEach((row, index) => {
    const y = 64 + index * rowHeight;
    const usage = getUsageForCode(row.root, statsByCodeId);

    nodes.push({
      id: row.root.id,
      label: row.root.name,
      subtitle: `${usage} segmentos`,
      color: row.root.color || "#0f766e",
      x: middleX,
      y,
      usage,
      kind: "code",
    });
    lines.push({
      id: `root-${row.root.id}`,
      sourceId: "__root",
      targetId: row.root.id,
      sourceX: leftX + NODE_WIDTH / 2,
      sourceY: rootY,
      targetX: middleX - NODE_WIDTH / 2,
      targetY: y,
      color: row.root.color || "#0f766e",
    });

    row.children.forEach((child, childIndex) => {
      const childOffset =
        (childIndex - (row.children.length - 1) / 2) * 44 * separation;
      const childY = y + childOffset;
      const childUsage = getUsageForCode(child, statsByCodeId);

      nodes.push({
        id: child.id,
        label: child.name,
        subtitle: `${childUsage} segmentos`,
        color: child.color || row.root.color || "#0f766e",
        x: rightX,
        y: childY,
        usage: childUsage,
        kind: "child",
      });
      lines.push({
        id: `${row.root.id}-${child.id}`,
        sourceId: row.root.id,
        targetId: child.id,
        sourceX: middleX + NODE_WIDTH / 2,
        sourceY: y,
        targetX: rightX - NODE_WIDTH / 2,
        targetY: childY,
        color: child.color || row.root.color || "#0f766e",
      });
    });
  });

  return { nodes, lines, graphHeight, graphWidth, nodeWidth: NODE_WIDTH };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getTreeCameraViewBox({
  graphWidth,
  graphHeight,
  zoom = 1,
  pan = { x: 0, y: 0 },
}) {
  const safeZoom = clamp(Number(zoom) || 1, 0.8, 1.8);
  const width = graphWidth / safeZoom;
  const height = graphHeight / safeZoom;
  const maxX = Math.max(0, graphWidth - width);
  const maxY = Math.max(0, graphHeight - height);
  const centeredY = maxY / 2;

  return {
    x: clamp(-(pan?.x ?? 0), 0, maxX),
    y: clamp(centeredY - (pan?.y ?? 0), 0, maxY),
    width,
    height,
  };
}

function nodeIntersectsViewBox(node, viewBox, padding = 10) {
  const left = node.x - NODE_WIDTH / 2;
  const right = node.x + NODE_WIDTH / 2;
  const top = node.y - NODE_HEIGHT / 2;
  const bottom = node.y + NODE_HEIGHT / 2;
  const viewLeft = viewBox.x - padding;
  const viewRight = viewBox.x + viewBox.width + padding;
  const viewTop = viewBox.y - padding;
  const viewBottom = viewBox.y + viewBox.height + padding;

  return right >= viewLeft && left <= viewRight && bottom >= viewTop && top <= viewBottom;
}

export function getVisibleTreeLines(lines = [], nodes = [], viewBox) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return lines.filter((line) => {
    const source = nodesById.get(line.sourceId);
    const target = nodesById.get(line.targetId);

    if (!source || !target) return false;

    return nodeIntersectsViewBox(source, viewBox) && nodeIntersectsViewBox(target, viewBox);
  });
}

export function getVisibleTreeNodes(nodes = [], visibleLines = [], viewBox) {
  const connectedNodeIds = new Set(["__root"]);

  visibleLines.forEach((line) => {
    connectedNodeIds.add(line.sourceId);
    connectedNodeIds.add(line.targetId);
  });

  return nodes.filter((node) => {
    if (!connectedNodeIds.has(node.id)) return false;
    return nodeIntersectsViewBox(node, viewBox);
  });
}
