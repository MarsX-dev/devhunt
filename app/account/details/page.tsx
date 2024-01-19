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
import validateURL from '@/utils/validateURL';

function Profile() {
  const { session, user } = useSupabase();
  const userSession = session?.user;
  const profileService = new ProfileService(createBrowserClient());
  const profile = profileService.getById(userSession?.id as string);

  const [isLoad, setLoad] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailTyping, setEmailTyping] = useState(false);
  const [about, setAbout] = useState('');
  const [headline, setHeadLine] = useState('');
  const [socialMediaLink, setSocialMediaLink] = useState('');

  const [avatar, setAvatar] = useState('/user.svg');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [websiteUrlError, setWebsiteUrlError] = useState('');
  const [aboutError, setAboutError] = useState('');
  const [headlineError, setHeadLineError] = useState('');
  const [socialMediaLinkError, setSocialMediaLinkError] = useState('');

  useEffect(() => {
    profile.then(res => {
      setAvatar((user?.avatar_url as string) || '/user.svg');
      setFullName(res?.full_name || '');
      setUsername(res?.username || '');
      setSocialMediaLink(res?.social_url || '');
      setAbout(res?.about || '');
      setWebsiteUrl(res?.website_url || '');
      setEmail(userSession?.user_metadata.email || '');
      setHeadLine(res?.headline || '');
    });
  }, []);

  const formValidator = () => {
    setFullNameError('');
    setWebsiteUrlError('');
    setSocialMediaLinkError('');
    if (fullName.length < 2) setFullNameError('Please enter a correct full name');
    if (username.length < 4) setUsernameError('the username should at least be 4 chars or more');
    if (!socialMediaLink && !validateURL(socialMediaLink)) setSocialMediaLinkError('Please enter a valid URL');
    else return true;
  };

  const handleSubmit: FormEventHandler = async e => {
    e.preventDefault();
    if (formValidator()) {
      setLoad(true);
      setUsernameError('');
      selectedImage ? await profileService.updateAvatar(userSession?.id as string, selectedImage) : null;
      profileService
        .update(userSession?.id as string, {
          full_name: fullName,
          username,
          about,
          headline,
          website_url: websiteUrl,
          social_url: socialMediaLink,
        })
        .then(() => {
          setUsernameError('');
          setLoad(false);
          avatarPreview ? setAvatar(avatarPreview) : null;
          setAvatarPreview('');
          setSelectedImage(null);
        })
        .catch(err => {
          setLoad(false);
          if (err) {
            setUsernameError('This username is already used, please use a different username');
          } else {
            setUsernameError('');
          }
        });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setEmailTyping(false);
    }, 6000);
  }, [isEmailTyping]);

  return (
    <div className="container-custom-screen h-screen mt-20">
      <div>
        <h1 className="text-xl text-slate-50 font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">This information will be displayed publicly so be careful what you share.</p>
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
              <LabelError className="mt">{fullNameError}</LabelError>
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
              <LabelError className="mt">{usernameError}</LabelError>
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
              <Label>Social Media URL (required)</Label>
              <Input
                required
                placeholder="Twitter/Linkedin/Facebook or Any other social media"
                value={socialMediaLink}
                onChange={e => {
                  setSocialMediaLink((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError className="mt">{socialMediaLinkError}</LabelError>
            </div>
            <div>
              <Label>Headline (optional)</Label>
              <Input
                value={headline}
                onChange={e => {
                  setHeadLine((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError>{headlineError}</LabelError>
            </div>
            <div>
              <Label>Website URL (optional)</Label>
              <Input
                value={websiteUrl}
                onChange={e => {
                  setWebsiteUrl((e.target as HTMLInputElement).value);
                }}
                className="w-full mt-2"
              />
              <LabelError>{websiteUrlError}</LabelError>
            </div>
            <div>
              <Label>About (optional)</Label>
              <Textarea
                placeholder="Tell a bit about yourself. This page is gonna be visited by other developers."
                value={about}
                onChange={e => {
                  setAbout((e.target as HTMLInputElement).value);
                }}
                className="w-full h-28 mt-2 resize-none"
              />
              <LabelError className="mt">{aboutError}</LabelError>
            </div>
            <Button isLoad={isLoad} className="flex justify-center w-full ring-offset-2 ring-orange-500 focus:ring-2 hover:bg-orange-400">
              {isLoad ? 'Updating' : 'save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
