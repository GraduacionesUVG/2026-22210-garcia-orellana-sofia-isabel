export default function LoadingCardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse"
        >
          <div className="h-6 w-24 bg-gray-100 rounded mb-4" />
          <div className="h-6 w-3/4 bg-gray-100 rounded mb-3" />
          <div className="h-4 w-full bg-gray-100 rounded mb-2" />
          <div className="h-4 w-5/6 bg-gray-100 rounded mb-6" />
          <div className="h-10 w-32 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
