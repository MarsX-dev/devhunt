'use client';

import React, { type FormEventHandler, useEffect, useState } from 'react';
import UploadAvatar from '@/components/ui/UploadAvatar/UploadAvatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label/Label';
import Textarea from '@/components/ui/Textarea';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProfileService from '@/utils/supabase/services/profile';
import LabelError from '@/components/ui/LabelError/LabelError';
import SocialIcon from '@/components/ui/SocialIcon';
import { githubFromSession, linksValue } from '@/components/ui/ProfileLinksFields';
import { parseSocialLink, platformName } from '@/utils/socialLinks';
import Alert from '../Alert';

function ProfileFormModal() {
  const { session, user, refreshUser } = useSupabase();
  const userSession = session?.user;
  const verifiedGithub = githubFromSession(userSession);

  const [isLoad, setLoad] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');
  const [socialMediaLink, setSocialMediaLink] = useState('');

  const [avatar, setAvatar] = useState('/user.svg');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const detected = socialMediaLink.trim() ? parseSocialLink(socialMediaLink) : null;

  // Mounted only while the modal is open, i.e. once the signed-in user's profile is loaded.
  useEffect(() => {
    setAvatar((user?.avatar_url as string) || '/user.svg');
    setFullName(user?.full_name || '');
    setUsername(user?.username || '');
    setSocialMediaLink(linksValue(user).more[0] ?? '');
    setAbout(user?.about || '');
  }, []);

  const handleSubmit: FormEventHandler = async e => {
    e.preventDefault();
    setLoad(true);
    setFormError('');
    try {
      if (selectedImage) await new ProfileService(createBrowserClient()).updateAvatar(userSession?.id as string, selectedImage);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, username, about, links: { more: [socialMediaLink] } }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? {});
        setFormError(body.error ?? '');
        return;
      }
      await refreshUser(); // the profile now has a link, so the modal closes
    } catch {
      setFormError('Could not save your profile, please try again.');
    } finally {
      setLoad(false);
    }
  };

  const linkError = errors.more || errors.links;

  return (
    <>
      <div>
        <Alert
          variant="warning"
          context={"We need this to verify that you're a human so that we can monitor the voting and make sure there are no fake upvotes."}
        />
      </div>
      <div className="mt-14">
        <UploadAvatar
          avatarUrl={avatar}
          avatarPreview={avatarPreview}
          setSelectedImage={setSelectedImage}
          setAvatarPreview={setAvatarPreview}
        />
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div>
              <Label>Full name (required)</Label>
              <Input
                required
                value={fullName}
                onChange={e => {
                  setFullName((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError className="mt">{errors.full_name}</LabelError>
            </div>
            <div>
              <Label>Username (required)</Label>
              <Input
                required
                value={username}
                onChange={e => {
                  setUsername((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError className="mt">{errors.username}</LabelError>
            </div>
            <div>
              <Label>{verifiedGithub ? 'Another social profile (optional)' : 'Your X, LinkedIn or GitHub profile (required)'}</Label>
              {verifiedGithub && (
                <p className="mt-1 inline-flex items-center gap-x-1.5 text-sm text-slate-400">
                  <SocialIcon platform="github" className="h-3.5 w-3.5" />
                  github.com/{verifiedGithub} is linked from your GitHub sign-in.
                </p>
              )}
              <Input
                value={socialMediaLink}
                placeholder="x.com/yourname, linkedin.com/in/yourname…"
                onChange={e => {
                  setSocialMediaLink((e.target as HTMLInputElement).value);
                }}
                required={!verifiedGithub}
                className="w-full mt-2"
              />
              {detected && !linkError && (
                <p className="mt-1 inline-flex items-center gap-x-1.5 text-xs text-slate-500">
                  <SocialIcon platform={detected.platform} className="h-3 w-3" />
                  {platformName(detected.platform)}: {detected.url.replace(/^https:\/\/(www\.)?/, '')}
                </p>
              )}
              <LabelError className="mt">{linkError}</LabelError>
            </div>
            <div>
              <Label>About (optional)</Label>
              <Textarea
                placeholder="Tell a bit about yourself. This page is gonna be visited by other developers."
                value={about}
                maxLength={499}
                onChange={e => {
                  setAbout((e.target as HTMLInputElement).value);
                }}
                className="w-full h-28 mt-2"
              />
              <LabelError className="mt">{errors.about}</LabelError>
            </div>
            <Button isLoad={isLoad} className="flex justify-center w-full ring-offset-2 ring-orange-500 focus:ring-2 hover:bg-orange-400">
              {isLoad ? 'Updating' : 'save'}
            </Button>
            {formError && <LabelError className="text-center">{formError}</LabelError>}
          </div>
        </form>
      </div>
    </>
  );
}

export default ProfileFormModal;
