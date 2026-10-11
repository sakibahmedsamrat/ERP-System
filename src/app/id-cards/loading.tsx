export default function IdCardsLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="h-9 bg-gray-200 rounded w-56 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-2xl w-72"></div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[600px] flex items-center justify-center">
        <div className="text-gray-400 font-medium text-sm">Loading ID Card Module...</div>
      </div>
    </div>
  );
}
