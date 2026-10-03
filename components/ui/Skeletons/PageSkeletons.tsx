// Skeleton screens shown instantly while a page loads (app/**/loading.tsx), shaped like the real pages.
// Each is at least a screen tall, so the footer never peeks out and then jumps when the page arrives.

const Bar = ({ className = '' }: { className?: string }) => <div className={`rounded-full bg-slate-800 animate-pulse ${className}`} />;
const Block = ({ className = '' }: { className?: string }) => <div className={`rounded-xl bg-slate-800/80 animate-pulse ${className}`} />;

// Same row height and columns as ToolRow (py-2.5 around a 32px logo; a 2-digit rank only on ranked
// lists), so swapping in the real rows moves nothing.
export function RowsSkeleton({ rows = 12, className = 'mt-10', ranked = false }: { rows?: number; className?: string; ranked?: boolean }) {
  return (
    <ul className={className} aria-hidden>
      {Array.from({ length: rows }, (_, idx) => (
        <li key={idx} className="flex items-center gap-x-3 py-2.5" style={{ opacity: 1 - idx * 0.06 }}>
          {ranked && <Bar className="h-3 w-3.5" />}
          <Block className="h-8 w-8 rounded-lg" />
          <Bar className="h-3 flex-1 max-w-md" />
          <Bar className="ml-auto h-6 w-14 rounded-lg" />
        </li>
      ))}
    </ul>
  );
}

export function ListPageSkeleton({ ranked = false }: { ranked?: boolean }) {
  return (
    <section className="max-w-4xl mt-10 mx-auto min-h-screen px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="pt-4 sm:pt-8">
        <Bar className="h-3 w-24" />
        <Bar className="mt-4 h-9 w-2/3 sm:h-12" />
        <Bar className="mt-5 h-3 w-1/2" />
      </div>
      <RowsSkeleton ranked={ranked} />
    </section>
  );
}

export function ToolPageSkeleton() {
  return (
    <section className="mt-10 min-h-screen pb-10 sm:mt-14" aria-busy="true" aria-label="Loading">
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
    <div className="container-custom-screen mt-10 mb-32 min-h-screen sm:mt-14" aria-busy="true" aria-label="Loading">
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
    <section className="max-w-4xl mt-5 lg:mt-10 mx-auto min-h-screen px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col items-center pt-6 pb-10 sm:pt-12">
        <Bar className="h-8 w-72" />
        <Bar className="mt-6 h-10 w-full max-w-xl sm:h-14" />
        <Bar className="mt-3 h-10 w-3/4 max-w-md sm:h-14" />
        <Bar className="mt-6 h-4 w-80 max-w-full" />
      </div>
      <Block className="h-[74px] w-full rounded-2xl" />
      <Bar className="mt-12 h-3 w-40" />
      <RowsSkeleton rows={10} className="mt-4" ranked />
    </section>
  );
}

const HeaderSkeleton = () => (
  <div className="pt-4 sm:pt-8">
    <Bar className="h-3 w-24" />
    <Bar className="mt-4 h-9 w-2/3 sm:h-12" />
    <Bar className="mt-5 h-3 w-1/2" />
  </div>
);

// Forms: account details, new/edit tool, tool profile.
export function FormPageSkeleton({ className = 'container-custom-screen' }: { className?: string }) {
  return (
    <section className={`${className} mt-10 mb-24 min-h-screen`} aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mt-10 space-y-7">
        {Array.from({ length: 5 }, (_, idx) => (
          <div key={idx} style={{ opacity: 1 - idx * 0.12 }}>
            <Bar className="h-3 w-28" />
            <Block className={`mt-3 w-full rounded-lg ${idx === 2 ? 'h-24' : 'h-10'}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Account pages: the gate (waiting for the session) and the route loaders show the page's own shape.
export function AccountSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/account/tools/new')) return <FormPageSkeleton className="mx-auto max-w-xl px-4" />;
  if (/^\/account\/(details|tools\/(edit|profile)\/)/.test(pathname)) return <FormPageSkeleton />;
  return <ListPageSkeleton />;
}

export function BlogListSkeleton() {
  return (
    <section className="max-w-3xl mt-10 mb-24 mx-auto min-h-screen px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mt-4 divide-y divide-slate-800/70">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="py-8" style={{ opacity: 1 - idx * 0.15 }}>
            <Bar className="h-3 w-40" />
            <Bar className="mt-4 h-5 w-3/4" />
            <Bar className="mt-4 h-3 w-full" />
            <Bar className="mt-2 h-3 w-5/6" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArticleSkeleton() {
  return (
    <section className="max-w-3xl mt-20 mx-auto min-h-screen px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <Bar className="h-3 w-24" />
      <Bar className="mt-6 h-9 w-5/6 sm:h-11" />
      <Bar className="mt-3 h-9 w-1/2 sm:h-11" />
      <Bar className="mt-6 h-3 w-48" />
      <Block className="mt-10 aspect-video w-full rounded-2xl" />
      <div className="mt-10 space-y-3">
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-11/12" />
        <Bar className="h-3 w-4/5" />
        <Bar className="h-3 w-full" />
      </div>
    </section>
  );
}

export function GridPageSkeleton() {
  return (
    <section className="max-w-6xl mt-10 mb-24 mx-auto min-h-screen px-4 md:px-8" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, idx) => (
          <Block key={idx} className="h-40 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

export function CompareSkeleton() {
  return (
    <section className="container-custom-screen mt-10 mb-20 min-h-screen" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Block className="h-36 rounded-2xl" />
        <Block className="h-36 rounded-2xl" />
      </div>
      <RowsSkeleton rows={8} />
    </section>
  );
}

export function StorySkeleton() {
  return (
    <section className="container-custom-screen mt-10 min-h-screen" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 10 }, (_, idx) => (
          <Bar key={idx} className={`h-3 ${idx % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    </section>
  );
}

// Same box as LoginPage: centered in a screen-tall section.
export function LoginSkeleton() {
  return (
    <section className="flex h-screen w-full items-center justify-center px-4" aria-busy="true" aria-label="Loading">
      <div className="flex w-full max-w-xl flex-col items-center">
        <Bar className="h-8 w-64" />
        <Bar className="mt-4 h-3 w-80 max-w-full" />
        <Block className="mt-8 h-11 w-72 rounded-lg" />
        <Block className="mt-3 h-11 w-72 rounded-lg" />
      </div>
    </section>
  );
}

// The skeleton each route's loading.tsx shows, picked from the URL alone. InstantNav shows it the
// moment a link is clicked, before the server has answered; null for pages without one.
export function skeletonForPath(pathname: string) {
  if (pathname === '/') return <HomeSkeleton />;
  if (pathname.startsWith('/@')) return <ProfileSkeleton />;
  if (/^\/tool\/[^/]+\/alternatives\/?$/.test(pathname)) return <ListPageSkeleton ranked />;
  if (/^\/tool\/[^/]+\/?$/.test(pathname)) return <ToolPageSkeleton />;
  if (/^\/(tools\/[^/]+|all-dev-tools|best-dev-tools-this-week-on-product-hunt)\/?$/.test(pathname)) return <ListPageSkeleton ranked />;
  if (pathname.startsWith('/upcoming')) return <ListPageSkeleton />;
  if (pathname.startsWith('/account')) return <AccountSkeleton pathname={pathname} />;
  if (/^\/blog\/(category|tag)\//.test(pathname) || /^\/blog\/?$/.test(pathname)) return <BlogListSkeleton />;
  if (pathname.startsWith('/blog/')) return <ArticleSkeleton />;
  if (pathname.startsWith('/compare/')) return <CompareSkeleton />;
  if (pathname.startsWith('/oss-friends')) return <GridPageSkeleton />;
  if (pathname.startsWith('/the-story')) return <StorySkeleton />;
  if (pathname.startsWith('/login')) return <LoginSkeleton />;
  return null;
}
