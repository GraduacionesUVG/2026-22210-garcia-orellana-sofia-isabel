export function shouldCloseHeuristicTooltip({
  fieldHovered = false,
  tooltipHovered = false,
} = {}) {
  return !fieldHovered && !tooltipHovered;
}
