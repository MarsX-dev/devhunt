'use client';

import ModalBannerCode from '@/components/ui/ModalBannerCode';
import { useState } from 'react';

export default () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [toolSlug, setToolSlug] = useState('');

  const copyDone = () => {
    localStorage.removeItem('last-tool');
    setModalOpen(false);
  };

  return (
    <ModalBannerCode
      isModalOpen={isModalOpen}
      toolSlug={toolSlug}
      setModalOpen={setModalOpen}
      setToolSlug={setToolSlug}
      copyDone={copyDone}
    />
  );
};
