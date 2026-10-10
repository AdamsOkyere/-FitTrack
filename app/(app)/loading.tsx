export default function TrackedLoading() {
  return (
    <div role="status" aria-label="Loading page" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div className="mb-7 flex animate-pulse flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="bg-ink/10 h-3 w-28 rounded" />
          <div className="bg-ink/10 h-9 w-64 max-w-[75vw] rounded" />
          <div className="bg-ink/10 h-4 w-52 max-w-[65vw] rounded" />
        </div>
        <div className="bg-ink/10 h-11 w-56 rounded-lg" />
      </div>
      <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="bg-surface h-36 rounded-lg shadow-sm" />
        ))}
      </div>
      <div className="mt-7 grid animate-pulse gap-4 xl:grid-cols-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`bg-surface h-[310px] rounded-lg shadow-sm ${item === 2 ? "xl:col-span-2" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
