'use client';

import { useEffect, useState } from 'react';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import SectionLabel from '@/components/ui/SectionLabel';
import { useSupabase } from '@/components/supabase/provider';

// "Danger zone" at the bottom of the profile settings: delete your account for good.
export default function DeleteAccount() {
  const { supabase, session, user } = useSupabase();
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<{ total: number; paid: number } | null>(null);

  useEffect(() => {
    if (!open || !session?.user.id) return;
    void supabase
      .from('products')
      .select('isPaid')
      .eq('owner_id', session.user.id)
      .eq('deleted', false)
      .then(({ data }) => setTools({ total: data?.length ?? 0, paid: (data ?? []).filter((t: any) => t.isPaid).length }));
  }, [open, session?.user.id]);

  if (!user?.username) return null;

  const remove = async (): Promise<string | null> => {
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: user.username }),
    });
    if (!res.ok) return (await res.json().catch(() => null))?.error ?? 'Could not delete your account, please try again.';
    await supabase.auth.signOut().catch(() => null);
    window.location.href = '/login?deleted=1';
    return null;
  };

  return (
    <div className="mt-16">
      <SectionLabel title="Danger zone" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/30 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-slate-100">Delete your account</p>
          <p className="mt-0.5 text-sm text-slate-400">Removes your profile and your tools from DevHunt. You won&apos;t be able to sign in again.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-none rounded-full border border-red-500/50 px-4 py-1.5 text-sm text-red-300 duration-150 hover:bg-red-500/10 hover:text-red-200"
        >
          Delete account
        </button>
      </div>
      <ConfirmDelete
        isActive={open}
        title="Delete your DevHunt account?"
        consequences={[
          'Your profile page goes away; your comments and votes stay, shown as "Deleted user".',
          tools === null
            ? 'Your tools will be deleted too.'
            : tools.total
              ? `Your ${tools.total} ${tools.total === 1 ? 'tool is' : 'tools are'} deleted too${tools.paid ? ` (paid launches are not refunded)` : ''}.`
              : 'You have no tools listed.',
          'You will be signed out and can’t sign in or sign up again with this account.',
        ]}
        confirmText={user.username}
        confirmLabel={
          <>
            Type your username <span className="font-mono text-slate-100">{user.username}</span> to confirm
          </>
        }
        buttonLabel="Delete my account"
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
