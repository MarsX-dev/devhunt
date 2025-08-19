'use client';

import { useSupabase } from '@/components/supabase/provider';
import { useCallback, useEffect, useState, useRef } from 'react';
import AvatarMenu from '../AvatarMenu';
import axios from 'axios';
import usermaven from '@/utils/usermaven';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Brand from '@/components/ui/Brand';
import { GithubProvider, GoogleProvider } from '../AuthProviderButtons';
import ProfileService from '@/utils/supabase/services/profile';
import { createBrowserClient } from '@/utils/supabase/browser';
import { useRouter } from 'next/navigation';
import sendWelcomeEmail from '@/utils/sendWelcomeEmail';
// Supabase auth needs to be triggered client-side
import { createClient } from '@supabase/supabase-js';

export default function Auth({ onLogout }: { onLogout?: () => void }) {
  const { supabase, session, user } = useSupabase();
  const [isGoogleAuthLoad, setGoogleAuthLoad] = useState<boolean>(false);
  const [isGithubAuthLoad, setGithubAuthLoad] = useState<boolean>(false);
  const [isModalActive, setModalActive] = useState<boolean>(false);

  // Track if we've already processed a sign-in to prevent duplicates
  const isProcessingRef = useRef<boolean>(false);
  const processedUsersRef = useRef<Set<string>>(new Set());

  const router = useRouter();

  const profile = new ProfileService(createBrowserClient());

  const handleGoogleLogin = async () => {
    setGoogleAuthLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error != null) {
      console.log({ error });
    }
    setGoogleAuthLoad(false);
    setModalActive(false);
  };

  const handleGitHubLogin = async () => {
    setGithubAuthLoad(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });

    if (error != null) {
      console.log({ error });
    }
    setGithubAuthLoad(false);
    setModalActive(false);
  };

  const handleSignInNotification = useCallback(
    async (userId: string, userEmail: string) => {
      // Check if we're already processing this user or have processed them
      if (isProcessingRef.current || processedUsersRef.current.has(userId)) {
        console.log(`Skipping duplicate sign-in notification for user ${userId}`);
        return;
      }

      // Set processing flag immediately
      isProcessingRef.current = true;
      processedUsersRef.current.add(userId);

      try {
        // Fetch user profile
        const userProfile = await profile.getById(userId);

        // Only process new users (no updated_at field)
        if (!userProfile?.updated_at) {
          console.log(`Processing new user sign-in for ${userProfile?.full_name}`);

          // Prepare all notification data
          const discordWebhook = process.env.DISCORD_USER_WEBHOOK;
          const discordContent = `**${userProfile?.full_name}** [open the profile](https://devhunt.org/@${userProfile?.username})`;

          // Execute all notifications in parallel for better performance
          const notificationPromises = [];

          // Discord notification
          if (discordWebhook) {
            notificationPromises.push(
              axios
                .post(discordWebhook, { content: discordContent })
                .catch((err: any) => console.error('Discord notification failed:', err)),
            );
          }

          // Email notification
          notificationPromises.push(
            axios
              .post('/api/login', {
                firstName: userProfile?.full_name as string,
                personalEMail: userEmail,
              })
              .catch((err: any) => console.error('Email notification failed:', err)),
          );

          // Analytics tracking
          if (usermaven) {
            notificationPromises.push(
              usermaven
                .id({
                  id: userProfile?.id,
                  email: userEmail,
                  created_at: new Date().toISOString(), // Fixed: Use ISO string instead of toLocaleString
                  first_name: userProfile?.full_name,
                })
                .catch((err: any) => console.error('Usermaven tracking failed:', err)),
            );
          }

          // Update profile to mark as processed
          notificationPromises.push(
            profile
              .update(userId, {
                updated_at: new Date().toISOString(),
              })
              .catch((err: any) => console.error('Profile update failed:', err)),
          );

          // Wait for all notifications to complete
          await Promise.allSettled(notificationPromises);
          console.log(`Successfully processed sign-in for ${userProfile?.full_name}`);
        } else {
          console.log(`User ${userId} already has updated_at, skipping notifications`);
        }
      } catch (error) {
        console.error('Error processing sign-in notification:', error);
      } finally {
        // Reset processing flag after a delay to handle edge cases
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 5000);
      }
    },
    [profile],
  );

  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('event', event);
        // Process the sign-in notification
        await handleSignInNotification(session.user.id, session.user.email || '');
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, handleSignInNotification]);

  // console.log(session && session.user)

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration

  return Boolean(session) ? (
    <div className="hidden md:block">
      <AvatarMenu session={session} onLogout={onLogout} />
    </div>
  ) : (
    <div className="flex items-center">
      <Button variant="shiny" onClick={() => setModalActive(true)}>
        Sign In
      </Button>
      <Modal variant="custom" isActive={isModalActive} onCancel={() => setModalActive(false)} className="max-w-md">
        <div className="text-center p-2">
          <div className="">
            <Brand w="130" h="40" className="mx-auto" />
            <h1 className="text-slate-50 text-lg font-semibold">Log in to your account</h1>
            <p className="text-slate-300">Let's explore together, the legit way!</p>
          </div>
          <GithubProvider isLoad={isGithubAuthLoad} onClick={handleGitHubLogin} className="w-full justify-center mt-4" />
          <GoogleProvider isLoad={isGoogleAuthLoad} onClick={handleGoogleLogin} className="w-full justify-center mt-2" />
        </div>
      </Modal>
    </div>
  );
}
