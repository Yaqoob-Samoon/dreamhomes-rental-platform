const Bar = ({ className = '' }) => (
  <div className={`bg-slate-200/70 rounded-md ${className}`} />
);

/**
 * Mirrors the real PropertyDetails layout (top bar, gallery, title, stats,
 * sidebar) so the page doesn't visually "jump" once data arrives.
 */
const PropertyDetailsSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8 font-sans animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Bar className="h-4 w-32" />
        <div className="flex items-center gap-4">
          <Bar className="h-4 w-16" />
          <Bar className="h-4 w-16" />
        </div>
      </div>

      {/* Title */}
      <Bar className="h-9 w-3/4 sm:w-1/2 mb-3" />
      <Bar className="h-9 w-1/2 sm:w-1/3 mb-6" />

      {/* Gallery */}
      <div className="w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden mb-12 flex gap-2">
        <div className="w-full md:w-1/2 h-full bg-slate-200/70 rounded-2xl md:rounded-r-none" />
        <div className="hidden md:grid w-1/2 h-full grid-cols-2 grid-rows-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200/70" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Left column */}
        <div className="lg:col-span-2">
          <div className="pb-8 border-b border-slate-200">
            <div className="flex gap-3 mb-4">
              <Bar className="h-7 w-28 rounded-full" />
              <Bar className="h-7 w-36 rounded-full" />
            </div>
            <Bar className="h-5 w-1/3" />
          </div>

          <div className="py-8 border-b border-slate-200 flex flex-wrap gap-8 sm:gap-12">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bar className="w-6 h-6 rounded-full" />
                <Bar className="h-4 w-24" />
              </div>
            ))}
          </div>

          <div className="py-8 border-b border-slate-200 space-y-3">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-2/3" />
          </div>

          <div className="py-8 space-y-4">
            <Bar className="h-6 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <Bar key={i} className="h-5 w-40" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <Bar className="h-8 w-32" />
            <Bar className="h-12 w-full rounded-xl" />
            <Bar className="h-12 w-full rounded-xl" />
          </div>
          <div className="mt-6 bg-slate-100 rounded-2xl p-5 space-y-3">
            <Bar className="h-5 w-40" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsSkeleton;