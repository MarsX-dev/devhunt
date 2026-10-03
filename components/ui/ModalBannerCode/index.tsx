'use client';

import CodeBlock from '@/components/CodeBlock';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { bannerPreviewDoc, bannerScript } from './bannerScript';

export default ({
  toolSlug = '',
  isModalOpen,
  setModalOpen,
  setToolSlug,
  copyDone,
}: {
  toolSlug: string;
  isModalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  setToolSlug: (val: string) => void;
  copyDone: () => void;
}) => {
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const supabaseBrowserClient = createBrowserClient();

  const productsService = new ProductsService(supabaseBrowserClient);

  const bannerIframeRef = useRef<HTMLIFrameElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const searchParams: any = useSearchParams();
  const search = searchParams.get('banner');
  const { slug } = params as { slug: string };
  const isBannerActive = pathname?.includes('/tool') && !pathname?.includes('/activate-launch') && search == 'true' ? true : false;

  const handleBannerIframeHeight = () => {
    const iframeDoc = bannerIframeRef.current as HTMLIFrameElement;
    if (iframeDoc) {
      const iframeDocHeight = iframeDoc.contentDocument?.documentElement?.offsetHeight;
      iframeDoc.style.height = `${iframeDocHeight}px`;
    }
  };

  useEffect(() => {
    let getToolFromLocalStorage = localStorage.getItem('last-tool');

    const inLaunchFlow = pathname?.includes('/activate-launch') || pathname?.includes('/account/tools/highlights');
    if (getToolFromLocalStorage && !inLaunchFlow) {
      const parsedTool = JSON.parse(getToolFromLocalStorage) as { toolSlug: string; launchEnd: string; launchDate: string };
      if (new Date(parsedTool.launchEnd).getTime() >= Date.now()) {
        setToolSlug(parsedTool.toolSlug);
        setModalOpen(true);
      }
    }

    if (user && isBannerActive) {
      productsService.getBySlug(slug, false).then(data => {
        if (user.id == data?.owner_id) {
          setToolSlug(slug);
          setModalOpen(true);
        }
      });
    }

    setTimeout(() => {
      bannerIframeRef.current?.addEventListener('load', () => {
        handleBannerIframeHeight();
      });
    }, 200);

    window.onresize = () => handleBannerIframeHeight();
    // Re-check on navigation so the modal shows right after submitting (client-side redirect).
  }, [pathname, user?.id]);

  useEffect(() => {
    setTimeout(() => {
      bannerIframeRef.current?.addEventListener('load', () => {
        handleBannerIframeHeight();
      });
    }, 200);
  }, [pathname, isModalOpen]);

  const srcDoc = bannerPreviewDoc(toolSlug);

  return (
    <Modal variant="custom" isActive={isModalOpen} className="max-w-4xl">
      <h3 className="text-slate-50 font-medium">Add banner</h3>
      <p className="text-slate-300 text-sm mt-2">
        Add this code between <b>{'<head>'}</b> tags in your website to show a banner about your launch.
      </p>
      <div className="mt-3">
        <iframe ref={bannerIframeRef} srcDoc={srcDoc} className="w-full h-12 bg-transparent border-none rounded-xl" />
      </div>
      <div className="mt-2">
        <CodeBlock onCopy={copyDone}>
          {bannerScript(toolSlug)}
        </CodeBlock>
      </div>
      <div className="mt-3 flex gap-x-3">
        <Button className="ring-offset-2 ring-orange-500 focus:ring-2" onClick={copyDone}>
          I've done this
        </Button>
        <Button
          className="bg-slate-700 hover:bg-slate-600"
          onClick={() => {
            // Dismiss for good; otherwise it reopens on every page until the launch ends.
            localStorage.removeItem('last-tool');
            setModalOpen(false);
          }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

// {"toolSlug":"fdsfdsg","launchDate":"2023-10-10","launchEnd":"2023-10-16T23:59:59+00:00"}
