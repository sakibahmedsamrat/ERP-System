export default function ModuleLoading({ title }: { title?: string }) {
  return (
    <div className="p-8 w-full animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-44 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-blue-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-44 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3 pt-2">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-50 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-50 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="flex justify-center items-center gap-2 mt-6 text-sm text-blue-600 font-medium">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>{title ? `${title} লোড হচ্ছে...` : 'লোড হচ্ছে...'}</span>
      </div>
    </div>
  );
}
