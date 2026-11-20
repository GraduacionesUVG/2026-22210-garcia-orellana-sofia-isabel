import { shouldCloseHeuristicTooltip } from "@/features/projects/delimitation/helpers/heuristicTooltip.helpers";

describe("heuristic tooltip interaction helpers", () => {
  it("keeps the tooltip open while the pointer is over the floating panel", () => {
    expect(
      shouldCloseHeuristicTooltip({
        fieldHovered: false,
        tooltipHovered: true,
      })
    ).toBe(false);
  });

  it("closes the tooltip only after the pointer leaves the field and panel", () => {
    expect(
      shouldCloseHeuristicTooltip({
        fieldHovered: false,
        tooltipHovered: false,
      })
    ).toBe(true);
  });
});
