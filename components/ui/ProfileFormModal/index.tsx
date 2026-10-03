'use client';

import Modal from '@/components/ui/Modal';
import { useSupabase } from '@/components/supabase/provider';
import ProfileFormModal from './ProfileFormModal';

// Asks signed-in users without a social link to complete their profile.
export default () => {
  const { loading, session, user } = useSupabase();
  const isModalOpen = !loading && !!session?.user && !!user && user.social_url == null;
  return (
    <Modal variant="custom" isActive={isModalOpen} onCancel={() => {}} className="max-w-2xl bg-slate-900">
      <ProfileFormModal key={user?.id} />
    </Modal>
  );
};
