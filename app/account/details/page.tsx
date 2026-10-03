'use client';

import PageHeader from '@/components/ui/PageHeader';
import React, { type FormEventHandler, useEffect, useRef, useState } from 'react';
import UploadAvatar from '@/components/ui/UploadAvatar/UploadAvatar';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label/Label';
import Textarea from '@/components/ui/Textarea';
import { useSupabase } from '@/components/supabase/provider';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProfileService from '@/utils/supabase/services/profile';
import LabelError from '@/components/ui/LabelError/LabelError';
import DeleteAccount from '@/components/ui/DeleteAccount';
import ProfileLinksFields, { githubFromSession, linksInput, linksValue, type LinksValue } from '@/components/ui/ProfileLinksFields';

const ABOUT_MAX = 499; // profiles_about_check: length(about) < 500

function Profile() {
  const { session, user, refreshUser } = useSupabase();
  const userSession = session?.user;
  const verifiedGithub = githubFromSession(userSession);

  const [isLoad, setLoad] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailTyping, setEmailTyping] = useState(false);
  const [about, setAbout] = useState('');
  const [headline, setHeadLine] = useState('');
  const [links, setLinks] = useState<LinksValue>(linksValue(null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const [avatar, setAvatar] = useState('/user.svg');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Filled once from the signed-in user's profile (loaded by the Supabase provider).
  const filled = useRef(false);
  useEffect(() => {
    if (!user || filled.current) return;
    filled.current = true;
    setAvatar((user.avatar_url as string) || '/user.svg');
    setFullName(user.full_name || '');
    setUsername(user.username || '');
    setLinks(linksValue(user));
    setAbout(user.about || '');
    setWebsiteUrl(user.website_url || '');
    setEmail(userSession?.user_metadata.email || '');
    setHeadLine(user.headline || '');
  }, [user]);

  const handleSubmit: FormEventHandler = async e => {
    e.preventDefault();
    setLoad(true);
    setSaved(false);
    setFormError('');
    try {
      if (selectedImage) await new ProfileService(createBrowserClient()).updateAvatar(userSession?.id as string, selectedImage);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, username, headline, about, website_url: websiteUrl, links: linksInput(links) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? {});
        setFormError(body.error ?? 'Please fix the fields marked in red.');
        return;
      }
      setErrors({});
      setLinks(linksValue(body.profile));
      setWebsiteUrl(body.profile?.website_url || '');
      if (avatarPreview) setAvatar(avatarPreview);
      setAvatarPreview('');
      setSelectedImage(null);
      setSaved(true);
      void refreshUser();
    } catch {
      setFormError('Could not save your profile, please try again.');
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setEmailTyping(false), 6000);
    return () => clearTimeout(timer);
  }, [isEmailTyping]);

  return (
    <div className="container-custom-screen mt-10 mb-24">
      <PageHeader eyebrow="Account" title="Your profile">
        This information is shown publicly on your profile, so be careful what you share.
      </PageHeader>
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
            <div className="relative">
              <Label>Email</Label>
              <Input type="email" value={email} onClick={() => setEmailTyping(true)} className="w-full mt-2" disabled={isEmailTyping} />
              {isEmailTyping ? (
                <span className="absolute left-0 -top-1 text-sm bg-green-500 text-green-50 border border-green-600 rounded-full px-2 py-1">
                  Please{' '}
                  <a href="https://twitter.com/devhunt_" target="_blank" className="font-medium underline">
                    contact us
                  </a>{' '}
                  on twitter to change your email
                </span>
              ) : (
                ''
              )}
            </div>
            <div>
              <Label>Headline (optional)</Label>
              <Input
                value={headline}
                placeholder="Founder at Acme, full-stack developer"
                onChange={e => {
                  setHeadLine((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
            </div>
            <div>
              <Label>Website (optional)</Label>
              <Input
                value={websiteUrl}
                placeholder="yourname.dev"
                onChange={e => {
                  setWebsiteUrl((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError>{errors.website_url}</LabelError>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="mb-4 text-sm text-slate-400">
                <span className="font-medium">Social profiles</span> (at least one). Paste a link or just your handle.
              </p>
              <ProfileLinksFields value={links} onChange={setLinks} errors={errors} verifiedGithub={verifiedGithub} />
            </div>
            <div>
              <Label>About (optional)</Label>
              <Textarea
                placeholder="Tell a bit about yourself. This page is gonna be visited by other developers."
                value={about}
                maxLength={ABOUT_MAX}
                onChange={e => {
                  setAbout((e.target as HTMLInputElement).value);
                }}
                className="w-full h-28 mt-2 resize-none"
              />
              <div className="flex justify-between">
                <LabelError className="mt">{errors.about}</LabelError>
                <span className="text-xs text-slate-500 tabular-nums">
                  {about.length}/{ABOUT_MAX}
                </span>
              </div>
            </div>
            <Button isLoad={isLoad} className="flex justify-center w-full ring-offset-2 ring-orange-500 focus:ring-2 hover:bg-orange-400">
              {isLoad ? 'Updating' : 'save'}
            </Button>
            {formError && <LabelError className="text-center">{formError}</LabelError>}
            {saved && <p className="text-center text-sm font-medium text-green-400">Saved. Your profile is updated.</p>}
          </div>
        </form>
        <DeleteAccount />
      </div>
    </div>
  );
}

export default Profile;
