'use client';

import PageHeader from '@/components/ui/PageHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import moment from 'moment';

import { IconCodeBracket, IconLoading, IconPencilSquare, IconTrash } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import ModalBannerCode from '@/components/ui/ModalBannerCode';

import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import { type ProductType } from '@/type';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Launch status of one of the owner's tools.
function StatusChip({ tool }: { tool: ProductType }) {
  const now = Date.now();
  const start = tool.launch_start ? Date.parse(tool.launch_start) : NaN;
  const end = tool.launch_end ? Date.parse(tool.launch_end as string) : NaN;
  const chip = 'rounded-full border px-2 py-0.5 text-[11px] font-medium';
  const status =
    start <= now && end >= now ? (
      <span className={`${chip} border-green-500/40 bg-green-500/10 text-green-300`}>Live now</span>
    ) : start > now ? (
      <span className={`${chip} border-slate-700 text-slate-400`}>Launching {moment.utc(start).format('MMM D, YYYY')}</span>
    ) : (
      <span className={`${chip} border-slate-700 text-slate-500`}>Launched {moment.utc(start).format('MMM D, YYYY')}</span>
    );
  return (
    <>
      {status}
      {tool.isPaid && <span className={`${chip} border-orange-500/40 bg-orange-500/10 text-orange-300`}>Paid</span>}
    </>
  );
}

export default () => {
  const { session } = useSupabase();
  const user = session?.user;
  const browserService = createBrowserClient();
  const toolsService = new ProductsService(browserService);
  const [isLoad, setLoad] = useState(true);
  const [tools, setTools] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [toolSlug, setToolSlug] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    toolsService.getUserProductsById(user.id).then(data => {
      setTools([...((data ?? []) as [])]);
      setLoad(false);
    });
  }, [user?.id]);

  const handleDeleteConfirm = (id: number, idx: number) => {
    const confirm = window.confirm('Are you sure you want to delete this?');
    if (confirm) {
      toolsService.delete(id).then(() => {
        setTools(tools.filter((_, i) => i !== idx));
      });
    }
  };

  const copyDone = () => {
    localStorage.removeItem('last-tool');
    setModalOpen(false);
  };

  return (
    <section className="container-custom-screen min-h-screen mt-10 mb-24">
      <div className="items-end justify-between gap-6 md:flex">
        <PageHeader eyebrow="Dashboard" title="Your launches">
          Edit your tools, pick launch dates and share your launch badge.
        </PageHeader>
        <Link
          href="/account/tools/new"
          className="mt-6 inline-flex flex-none rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 duration-150 hover:bg-white md:mt-0"
        >
          + Launch a tool
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-slate-800/60">
        {isLoad ? (
          <div>
            <IconLoading className="w-6 h-6 mx-auto text-orange-500" />
          </div>
        ) : tools.length > 0 ? (
          tools.map((tool: ProductType, idx: number) => (
            <>
              <li key={idx} className="py-3">
                <div className="p-2 flex items-start gap-x-4">
                  <Logo src={tool.logo_url || ''} alt={tool.name} className="w-14 h-14 sm:w-16 sm:h-16" />
                  <div>
                    <Link href={`/tool/${tool.slug}`}>
                      <span className="flex flex-wrap items-center gap-2">
                        <Name>{tool.name}</Name>
                        <StatusChip tool={tool} />
                      </span>
                      {/* {!tool.isPaid && (
                        <p className="text-slate-300 text-sm">
                          Status: <span className="text-orange-400">draft</span>
                        </p>
                      )} */}
                      <Title className="line-clamp-2">{tool.slogan}</Title>
                      <Tags
                        items={[
                          (tool.product_pricing_types as { title: string }).title || 'Free',
                          ...(tool.product_categories as { name: string }[]).map((c: { name: string }) => c.name),
                        ]}
                      />
                    </Link>
                    <div className="mt-2.5 flex items-center gap-x-4">
                      {!tool.isPaid && !(new Date(tool.launch_end as any).getTime() <= Date.now()) && (
                        <Link
                          href={`/account/tools/activate-launch/${tool.slug}`}
                          className="text-sm inline-block bg-orange-500 px-2 py-1 rounded-md text-white font-medium hover:bg-orange-600 duration-150"
                        >
                          Skip the queue
                        </Link>
                      )}
                      <Link
                        href={`/account/tools/edit/${tool.id}`}
                        className="inline-flex items-center gap-x-2 text-orange-500 hover:text-orange-600 duration-150 font-medium"
                      >
                        <IconPencilSquare /> Edit your tool
                      </Link>
                      {tool.isPaid && (
                        <Link
                          href={`/account/tools/highlights/${tool.id}`}
                          className="inline-flex items-center gap-x-1.5 text-sm text-slate-300 hover:text-slate-50 duration-150"
                        >
                          ✨ Awards &amp; reviews
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleDeleteConfirm(tool.id, idx);
                        }}
                        className="inline-block text-slate-400 hover:text-slate-500 duration-150"
                        aria-label="Delete tool"
                        title="Delete tool"
                      >
                        <IconTrash />
                      </button>
                      <button
                        onClick={() => {
                          setToolSlug(tool.slug);
                          setModalOpen(true);
                        }}
                        className="inline-block text-slate-400 hover:text-slate-500 duration-150"
                        aria-label="Get launch banner code"
                        title="Get launch banner code"
                      >
                        <IconCodeBracket />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 self-center flex justify-end">
                    <Votes
                      count={tool.votes_count}
                      productId={tool?.id}
                      launchDate={tool.launch_date}
                      launchEnd={tool.launch_end as string}
                    />
                  </div>
                </div>
              </li>
            </>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <p className="font-medium text-slate-200">No launches yet</p>
            <p className="mt-1 text-sm text-slate-500">Submit your dev tool and pick a launch date in two steps.</p>
            <Link href="/account/tools/new" className="mt-4 inline-block rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">
              Launch your first tool
            </Link>
          </div>
        )}
      </ul>
      <div className="mt-14">
        <SectionLabel title="Resources" />
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>
            <a className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50" href="/the-story">
              Read the rules
            </a>{' '}
            for voting and which dev tools you can submit.
          </li>
          <li>
            <a className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50" href="/the-story#ads">
              Advertising
            </a>{' '}
            and other premium options to grow your dev tool.
          </li>
          <li>
            Consider launching on{' '}
            <a className="text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-slate-50" href="https://uneed.best/?aff=A6pv1">
              Uneed.best
            </a>{' '}
            for even more traffic.
          </li>
        </ul>
      </div>

      <ModalBannerCode
        isModalOpen={isModalOpen}
        toolSlug={toolSlug}
        setModalOpen={setModalOpen}
        setToolSlug={setToolSlug}
        copyDone={copyDone}
      />
    </section>
  );
};
