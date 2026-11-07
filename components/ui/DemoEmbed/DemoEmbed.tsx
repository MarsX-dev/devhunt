import { IconArrowTopRight } from '@/components/Icons';
import { resolveDemoEmbed } from '@/utils/demoEmbed';
import mergeTW from '@/utils/mergeTW';

// Demos can run scripts, submit their lead forms and open links in a new tab, but without
// allow-top-navigation they can't navigate DevHunt itself away.
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';

export default ({ url, name, className = '' }: { url?: string | null; name: string; className?: string }) => {
  const demo = resolveDemoEmbed(url);
  if (!demo) return null;

  return (
    <div id="demo" className={mergeTW(`container-custom-screen ${className}`)}>
      <div className="flex items-center justify-between gap-x-3">
        <h3 className="text-slate-50 font-medium">Interactive demo</h3>
        <a
          href={demo.shareUrl}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-x-1 text-sm text-slate-400 hover:text-slate-200 duration-150"
        >
          Open in new tab
          <IconArrowTopRight className="w-4 h-4" />
        </a>
      </div>
      <div
        className="mt-4 relative w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-800/50"
        style={{ aspectRatio: demo.aspectRatio }}
      >
        <iframe
          src={demo.embedUrl}
          title={`${name} interactive demo`}
          allow={demo.allow}
          allowFullScreen
          sandbox={SANDBOX}
          loading="lazy"
          className="absolute inset-0 w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
};
