import { Fragment } from 'react';
import { DEMO_PROVIDERS } from '@/utils/demoEmbed';
import handleURLQuery from '@/utils/handleURLQuery';

// "Arcade, AtriumKit, Navattic, Storylane or Supademo", each name linking to the provider's site.
export default () => (
  <>
    {DEMO_PROVIDERS.map(({ name, homepage }, idx) => (
      <Fragment key={name}>
        {idx === 0 ? '' : idx === DEMO_PROVIDERS.length - 1 ? ' or ' : ', '}
        <a
          href={handleURLQuery(homepage)}
          target="_blank"
          rel="noopener"
          className="underline underline-offset-2 hover:text-slate-200 duration-150"
        >
          {name}
        </a>
      </Fragment>
    ))}
  </>
);
