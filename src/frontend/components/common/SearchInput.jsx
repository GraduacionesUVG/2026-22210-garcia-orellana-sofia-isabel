import Icon from "@/components/common/Icon";

export default function SearchInput({ placeholder = "Buscar...", value, onChange }) {
  return (
    <div className="relative">
      <Icon name="search" className="absolute left-3 top-2.5 text-gray-400 text-lg" />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-64 shadow-sm transition-shadow"
      />
    </div>
  );
}
