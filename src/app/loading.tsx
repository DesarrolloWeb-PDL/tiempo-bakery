export default function Loading() {
  return (
    <div className="min-h-screen relative">
      {/* Hero skeleton */}
      <section className="flex items-center min-h-[80vh] bg-black/50">
        <div className="container mx-auto px-4 py-12 relative z-10 w-full">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="h-12 bg-white/10 rounded-lg animate-pulse mx-auto max-w-md" />
            <div className="h-6 bg-white/10 rounded-lg animate-pulse mx-auto max-w-sm" />
            <div className="h-10 bg-white/10 rounded-lg animate-pulse mx-auto max-w-xs mt-6" />
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="container mx-auto px-4 py-12 bg-black/25">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="h-6 bg-white/10 rounded animate-pulse w-1/3" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex gap-3">
                    <div className="w-16 h-16 bg-white/10 rounded-lg animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-white/10 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
