import {
  buildTreeLayout,
  getTreeCameraViewBox,
  getVisibleTreeNodes,
  getVisibleTreeLines,
} from "@/features/projects/analysis/helpers/codeTreeLayout.helpers";

describe("buildTreeLayout", () => {
  it("keeps root codes with children visible before low-value leaf roots are trimmed", () => {
    const codes = [
      { id: "leaf-1", name: "Leaf 1", parent_code_id: null },
      { id: "leaf-2", name: "Leaf 2", parent_code_id: null },
      { id: "leaf-3", name: "Leaf 3", parent_code_id: null },
      { id: "leaf-4", name: "Leaf 4", parent_code_id: null },
      { id: "leaf-5", name: "Leaf 5", parent_code_id: null },
      { id: "leaf-6", name: "Leaf 6", parent_code_id: null },
      { id: "leaf-7", name: "Leaf 7", parent_code_id: null },
      { id: "parent-low", name: "Parent low", parent_code_id: null },
      { id: "child-visible", name: "Child visible", parent_code_id: "parent-low" },
    ];
    const codeStats = [
      { code_id: "leaf-1", segment_count: 7 },
      { code_id: "leaf-2", segment_count: 6 },
      { code_id: "leaf-3", segment_count: 5 },
      { code_id: "leaf-4", segment_count: 4 },
      { code_id: "leaf-5", segment_count: 3 },
      { code_id: "leaf-6", segment_count: 2 },
      { code_id: "leaf-7", segment_count: 1 },
      { code_id: "parent-low", segment_count: 0 },
      { code_id: "child-visible", segment_count: 0 },
    ];

    const layout = buildTreeLayout(codes, codeStats, 1);
    const nodeIds = layout.nodes.map((node) => node.id);

    expect(nodeIds).toContain("parent-low");
    expect(nodeIds).toContain("child-visible");
  });

  it("places child lines exactly on the parent and child card edges", () => {
    const layout = buildTreeLayout(
      [
        { id: "parent", name: "Parent", parent_code_id: null },
        { id: "child", name: "Child", parent_code_id: "parent" },
      ],
      [],
      1.4
    );
    const parent = layout.nodes.find((node) => node.id === "parent");
    const child = layout.nodes.find((node) => node.id === "child");
    const line = layout.lines.find((item) => item.id === "parent-child");

    expect(line!.sourceX).toBe(parent!.x + layout.nodeWidth / 2);
    expect(line!.targetX).toBe(child!.x - layout.nodeWidth / 2);
  });

  it("zooms by reducing the camera viewBox instead of only changing the label", () => {
    const fit = getTreeCameraViewBox({
      graphWidth: 1000,
      graphHeight: 600,
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
    const zoomed = getTreeCameraViewBox({
      graphWidth: 1000,
      graphHeight: 600,
      zoom: 1.8,
      pan: { x: 0, y: 0 },
    });

    expect(zoomed.width).toBeLessThan(fit.width);
    expect(zoomed.height).toBeLessThan(fit.height);
    expect(zoomed.width).toBeLessThan(fit.width * 0.7);
    expect(zoomed.x).toBe(0);
  });

  it("hides lines whose source or target card is outside the camera", () => {
    const layout = buildTreeLayout(
      [
        { id: "parent", name: "Parent", parent_code_id: null },
        { id: "child", name: "Child", parent_code_id: "parent" },
      ],
      [],
      1
    );
    const viewBox = {
      x: 0,
      y: 0,
      width: layout.nodes.find((node) => node.id === "parent")!.x + 20,
      height: layout.graphHeight,
    };

    const visibleLineIds = getVisibleTreeLines(layout.lines, layout.nodes, viewBox).map(
      (line) => line.id
    );

    expect(visibleLineIds).toContain("root-parent");
    expect(visibleLineIds).not.toContain("parent-child");
  });

  it("hides child nodes when their connecting line is outside the camera", () => {
    const layout = buildTreeLayout(
      [
        { id: "parent", name: "Parent", parent_code_id: null },
        { id: "child", name: "Child", parent_code_id: "parent" },
      ],
      [],
      1
    );
    const child = layout.nodes.find((node) => node.id === "child");
    const viewBox = {
      x: child!.x - layout.nodeWidth / 2 - 8,
      y: 0,
      width: layout.nodeWidth + 16,
      height: layout.graphHeight,
    };
    const visibleLines = getVisibleTreeLines(layout.lines, layout.nodes, viewBox);
    const visibleNodeIds = getVisibleTreeNodes(layout.nodes, visibleLines, viewBox).map(
      (node) => node.id
    );

    expect(visibleNodeIds).not.toContain("child");
  });
});
