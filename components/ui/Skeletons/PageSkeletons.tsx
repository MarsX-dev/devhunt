// Skeleton screens shown instantly while a page loads (app/**/loading.tsx), shaped like the real pages.

const Bar = ({ className = '' }: { className?: string }) => <div className={`rounded-full bg-slate-800 animate-pulse ${className}`} />;
const Block = ({ className = '' }: { className?: string }) => <div className={`rounded-xl bg-slate-800/80 animate-pulse ${className}`} />;

export function RowsSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <ul className="mt-10 space-y-1" aria-hidden>
      {Array.from({ length: rows }, (_, idx) => (
        <li key={idx} className="flex items-center gap-x-3 py-2.5" style={{ opacity: 1 - idx * 0.06 }}>
          <Bar className="h-3 w-5" />
          <Block className="h-8 w-8 rounded-lg" />
          <Bar className="h-3 flex-1 max-w-md" />
          <Bar className="ml-auto h-6 w-14 rounded-lg" />
        </li>
      ))}
    </ul>
  );
}

export function ListPageSkeleton() {
  return (
    <section className="max-w-4xl mt-10 mx-auto px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="pt-4 sm:pt-8">
        <Bar className="h-3 w-24" />
        <Bar className="mt-4 h-9 w-2/3 sm:h-12" />
        <Bar className="mt-5 h-3 w-1/2" />
      </div>
      <RowsSkeleton />
    </section>
  );
}

export function ToolPageSkeleton() {
  return (
    <section className="mt-10 pb-10 sm:mt-14" aria-busy="true" aria-label="Loading">
      <div className="container-custom-screen">
        <Bar className="h-6 w-56" />
        <div className="mt-5 flex items-center gap-x-5">
          <Block className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20" />
          <div className="flex-1">
            <Bar className="h-8 w-48" />
            <Bar className="mt-3 h-4 w-72 max-w-full" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Bar className="h-9 w-32" />
          <Bar className="h-9 w-28" />
        </div>
        <Block className="mt-8 h-[74px] w-full rounded-2xl" />
        <div className="mt-6 flex -space-x-2">
          {Array.from({ length: 10 }, (_, idx) => (
            <div key={idx} className="h-8 w-8 rounded-full bg-slate-800 ring-2 ring-slate-900 animate-pulse" />
          ))}
        </div>
        <div className="mt-14 space-y-3">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-11/12" />
          <Bar className="h-3 w-4/5" />
        </div>
      </div>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container-custom-screen mt-10 mb-32 sm:mt-14" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-x-5">
        <div className="h-16 w-16 rounded-full bg-slate-800 animate-pulse sm:h-20 sm:w-20" />
        <div className="flex-1">
          <Bar className="h-7 w-48" />
          <Bar className="mt-3 h-4 w-64 max-w-full" />
        </div>
      </div>
      <Block className="mt-8 h-[74px] w-full rounded-2xl" />
      <RowsSkeleton rows={8} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col items-center pt-6 pb-10 sm:pt-12">
        <Bar className="h-8 w-72" />
        <Bar className="mt-6 h-10 w-full max-w-xl sm:h-14" />
        <Bar className="mt-3 h-10 w-3/4 max-w-md sm:h-14" />
        <Bar className="mt-6 h-4 w-80 max-w-full" />
      </div>
      <Block className="h-[74px] w-full rounded-2xl" />
      <Block className="mt-12 h-72 w-full rounded-2xl" />
      <RowsSkeleton rows={6} />
    </section>
  );
}
