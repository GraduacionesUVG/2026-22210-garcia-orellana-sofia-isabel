import {
  FIELD_HELP_CLOSE_DELAY_MS,
  shouldCloseFieldHelpTooltip,
} from "@/features/projects/workspace/field-help/fieldHelpTooltip.helpers";

describe("field help tooltip interaction", () => {
  it("keeps the portal open while either trigger or panel remains interactive", () => {
    expect(shouldCloseFieldHelpTooltip({ triggerHovered: true })).toBe(false);
    expect(shouldCloseFieldHelpTooltip({ panelHovered: true })).toBe(false);
    expect(shouldCloseFieldHelpTooltip({ triggerFocused: true })).toBe(false);
  });

  it("closes only after every interactive surface is left", () => {
    expect(shouldCloseFieldHelpTooltip({})).toBe(true);
  });

  it("provides enough transfer time to cross the portal gap", () => {
    expect(FIELD_HELP_CLOSE_DELAY_MS).toBeGreaterThanOrEqual(600);
  });
});
