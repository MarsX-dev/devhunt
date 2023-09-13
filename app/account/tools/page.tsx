'use client';

import { IconCodeBracket, IconLoading, IconPencilSquare, IconTrash } from '@/components/Icons';
import { useSupabase } from '@/components/supabase/provider';
import LinkItem from '@/components/ui/Link/LinkItem';
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

export default () => {
  const { session } = useSupabase();
  const user = session?.user;
  const browserService = createBrowserClient();
  const toolsService = new ProductsService(browserService);
  const toolsList = new ProductsService(browserService).getUserProductsById(user?.id as string);
  const [isLoad, setLoad] = useState(true);
  const [tools, setTools] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [toolSlug, setToolSlug] = useState('');

  useEffect(() => {
    toolsList.then(data => {
      setTools([...(data as [])]);
      setLoad(false);
    });
  }, []);

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
    <section className="container-custom-screen min-h-screen mt-14">
      <div className="items-start justify-between py-4 md:flex">
        <div className="max-w-lg">
          <h1 className="text-slate-50 text-2xl font-bold">Tools</h1>
          <p className="text-slate-300 mt-1">You can launch a new tool, or edit and delete.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <LinkItem href="/account/tools/new" className="text-sm shadow hover:bg-slate-700">
            New tool
          </LinkItem>
        </div>
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
                      <Name>{tool.name}</Name>
                      <Title className="line-clamp-2">{tool.slogan}</Title>
                      <Tags
                        items={[
                          (tool.product_pricing_types as { title: string }).title || 'Free',
                          ...(tool.product_categories as { name: string }[]).map((c: { name: string }) => c.name),
                        ]}
                      />
                    </Link>
                    <div className="mt-2.5 flex items-center gap-x-4">
                      <Link
                        href={`/account/tools/edit/${tool.id}`}
                        className="inline-block text-slate-400 hover:text-slate-500 duration-150"
                      >
                        <IconPencilSquare />
                      </Link>
                      <button
                        onClick={() => {
                          handleDeleteConfirm(tool.id, idx);
                        }}
                        className="inline-block text-slate-400 hover:text-slate-500 duration-150"
                      >
                        <IconTrash />
                      </button>
                      <button
                        onClick={() => {
                          setToolSlug(tool.slug);
                          setModalOpen(true);
                        }}
                        className="inline-block text-slate-400 hover:text-slate-500 duration-150"
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
          <div className="font-medium text-slate-400">No launches found.</div>
        )}
      </ul>
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
