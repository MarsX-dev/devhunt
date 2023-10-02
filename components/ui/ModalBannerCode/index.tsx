'use client';

import CodeBlock from '@/components/CodeBlock';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  const bannerIframeRef = useRef<HTMLIFrameElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const { slug } = params as { slug: string };
  const isBannerActive = pathname?.includes('/tool') && slug ? true : false;

  useEffect(() => {
    let getToolFromLocalStorage = localStorage.getItem('last-tool');

    if (getToolFromLocalStorage) {
      const parsedTool = JSON.parse(getToolFromLocalStorage) as { toolSlug: string; launchEnd: string; launchDate: string };
      if (new Date(parsedTool.launchEnd).getTime() >= Date.now()) {
        setToolSlug(parsedTool.toolSlug);
        setModalOpen(true);
      }
    }

    // if (isBannerActive) {
    //   setToolSlug(slug);
    //   setModalOpen(true);
    // }

    const handleBannerIframeHeight = () => {
      const iframeDoc = bannerIframeRef.current as HTMLIFrameElement;
      if (iframeDoc) {
        const iframeDocHeight = iframeDoc.contentDocument?.documentElement?.offsetHeight;
        iframeDoc.style.height = `${iframeDocHeight}px`;
      }
    };

    setTimeout(() => {
      handleBannerIframeHeight();
    }, 300);

    window.onresize = () => handleBannerIframeHeight();
  }, []);

  const srcDoc = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <script defer data-url="https://devhunt.org/tool/${toolSlug}" src="https://cdn.jsdelivr.net/gh/sidiDev/devhunt-banner/index.js"></script>
  </head>
  <body>
      
  </body>
  </html>`;

  return (
    <Modal variant="custom" isActive={isModalOpen} className="max-w-4xl">
      <h3 className="text-slate-50 font-medium">Add banner</h3>
      <p className="text-slate-300 text-sm mt-2">
        Add this code between <b>{'<head>'}</b> tags in your website to show a banner about your launch.
      </p>
      <div className="mt-3">
        <iframe ref={bannerIframeRef} srcDoc={srcDoc} className="w-full bg-transparent border-none rounded-xl" />
      </div>
      <div className="mt-2">
        <CodeBlock onCopy={copyDone}>
          {`<script defer data-url="https://devhunt.org/tool/${toolSlug}" src="https://cdn.jsdelivr.net/gh/sidiDev/devhunt-banner/index.js" />`}
        </CodeBlock>
      </div>
      <div className="mt-3 flex gap-x-3">
        <Button className="ring-offset-2 ring-orange-500 focus:ring-2" onClick={copyDone}>
          I've done this
        </Button>
        <Button className="bg-slate-700 hover:bg-slate-600" onClick={() => setModalOpen(false)}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

// {"toolSlug":"fdsfdsg","launchDate":"2023-10-10","launchEnd":"2023-10-16T23:59:59+00:00"}
