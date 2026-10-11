export default function WorkersLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 bg-gray-200 rounded w-48"></div>
        <div className="flex gap-2">
          <div className="h-9 bg-gray-200 rounded w-28"></div>
          <div className="h-9 bg-gray-200 rounded w-28"></div>
          <div className="h-9 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-5">
        <div className="h-5 bg-gray-200 rounded w-36 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100"></div>
        <div className="divide-y divide-gray-100">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-14 bg-white flex items-center px-4 gap-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
              <div className="h-4 bg-gray-100 rounded w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
