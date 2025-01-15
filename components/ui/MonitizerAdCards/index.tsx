import { useEffect, useState } from 'react';
import Script from "next/script";

const SponsorSkeleton = () => (
  <div className="mt-3 w-60 text-left sm:block border border-slate-700 bg-slate-900 rounded-md p-4 animate-pulse">
    <div className="h-4 w-16 bg-slate-700 rounded mb-2"></div>
    <div className="h-7 w-3/4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 w-full bg-slate-700 rounded mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
      <div className="h-5 w-3/4 bg-slate-700 rounded"></div>
      <div className="h-5 w-3/4 bg-slate-700 rounded"></div>
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
    </div>
    <div className="h-8 w-full bg-orange-900/50 rounded mt-4"></div>
  </div>
);

function MonitizorAdCards() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true); // Only enable rendering after hydration
  }, []);

  const iframe = <>
    <Script
        src="https://selldigitals.com/libs/widget.js"
        strategy="lazyOnload"
      />
    <Script
        src="https://selldigitals.com/libs/manager.js?widgetId=67694f18ba7de28681af6e17"
        strategy="lazyOnload"
      />
    <iframe
      width="100%"
      height="150"
      frameborder="0"
      style={{ minHeight: '300px' }}
      className="selldigitals-widget"
      data-min-height="15"
      id="676951abba7de28681af6e32-6998"
      src="https://selldigitals.com/widgets/676951abba7de28681af6e32?seed=6998&showInPopup=false"
    ></iframe>
  </>;

  if (!loaded) {
    return <div className="block sm:flex gap-5"  style={{ minHeight: '305px' }}>
      <SponsorSkeleton/>
      <SponsorSkeleton/>
      <SponsorSkeleton/>
      <div style={{ display: 'none' }}>{iframe}</div>
    </div>;
  }

  return iframe;
}

export default MonitizorAdCards;
