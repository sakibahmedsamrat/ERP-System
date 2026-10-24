export default function ModuleLoading({ title }: { title?: string }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 bg-slate-200/70 backdrop-blur-sm rounded-xl animate-pulse" />
          <div className="h-6 w-20 bg-blue-100/70 backdrop-blur-sm rounded-full animate-pulse" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-9 w-28 bg-slate-200/60 backdrop-blur-sm rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-blue-200/60 backdrop-blur-sm rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="glass-card rounded-2xl p-4 border border-white/70 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="h-10 w-64 bg-slate-200/60 backdrop-blur-sm rounded-xl animate-pulse" />
          <div className="h-10 w-44 bg-slate-200/50 backdrop-blur-sm rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-slate-200/50 backdrop-blur-sm rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/70 shadow-sm space-y-4">
        <div className="h-6 w-1/4 bg-slate-200/70 backdrop-blur-sm rounded-lg animate-pulse" />
        <div className="space-y-3 pt-2">
          <div className="h-12 bg-white/60 backdrop-blur-xs rounded-xl border border-white/80 animate-pulse" />
          <div className="h-12 bg-white/40 backdrop-blur-xs rounded-xl border border-white/60 animate-pulse" />
          <div className="h-12 bg-white/60 backdrop-blur-xs rounded-xl border border-white/80 animate-pulse" />
          <div className="h-12 bg-white/40 backdrop-blur-xs rounded-xl border border-white/60 animate-pulse" />
          <div className="h-12 bg-white/60 backdrop-blur-xs rounded-xl border border-white/80 animate-pulse" />
        </div>
      </div>

      <div className="flex justify-center items-center pt-2">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-white/80 shadow-sm text-xs font-bold text-blue-600">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>{title ? `Loading ${title}...` : 'Loading module...'}</span>
        </div>
      </div>
    </div>
  );
}
