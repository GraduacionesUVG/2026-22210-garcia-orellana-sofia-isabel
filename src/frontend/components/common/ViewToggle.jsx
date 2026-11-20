import Icon from "@/components/common/Icon";

export default function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <button
        className={`p-1 transition-colors ${value === "grid" ? "text-primary" : "hover:text-primary"}`}
        onClick={() => onChange("grid")}
        type="button"
        title="Grid"
      >
        <Icon name="grid_view" />
      </button>
      <button
        className={`p-1 transition-colors ${value === "list" ? "text-primary" : "hover:text-primary"}`}
        onClick={() => onChange("list")}
        type="button"
        title="List"
      >
        <Icon name="list" />
      </button>
    </div>
  );
}
