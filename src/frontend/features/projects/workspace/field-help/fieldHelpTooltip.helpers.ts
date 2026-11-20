export const FIELD_HELP_CLOSE_DELAY_MS = 700;

export function shouldCloseFieldHelpTooltip(state: {
  triggerHovered?: boolean;
  panelHovered?: boolean;
  triggerFocused?: boolean;
}) {
  return !(
    state.triggerHovered ||
    state.panelHovered ||
    state.triggerFocused
  );
}
