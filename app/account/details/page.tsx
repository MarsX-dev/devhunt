'use client'

import React, { FormEventHandler, useEffect, useState } from 'react'
import UploadAvatar from '@/components/ui/UploadAvatar/UploadAvatar'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label/Label'
import Textarea from '@/components/ui/Textarea'
import { useSupabase } from '@/components/supabase/provider'
import Protectedroute from '@/components/Protectedroute'
import { createBrowserClient } from '@/libs/supabase/browser'
import ProfileService from '@/libs/supabase/services/profile'
import LabelError from '@/components/ui/LabelError/LabelError'

function Profile() {
  const { session, user } = useSupabase()
  const userSession = session && session.user
  const profileService = new ProfileService(createBrowserClient())
  const profile = profileService.getById(userSession?.id as string)

  const [isLoad, setLoad] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [about, setAbout] = useState('')
  const [headline, setHeadLine] = useState('')
  const [avatar, setAvatar] = useState('/user.svg')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const [fullNameError, setFullNameError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [aboutError, setAboutError] = useState('')
  const [headlineError, setHeadLineError] = useState('')

  useEffect(() => {
    profile.then(res => {
      setAvatar((user?.avatar_url as string) || '/user.svg')
      setFullName(res?.full_name || '')
      setUsername(res?.username || '')
      setAbout(res?.about || '')
      setEmail(userSession?.user_metadata.email || '')
      setHeadLine(res?.headline || '')
    })
  }, [])

  const formValidator = () => {
    setFullNameError('')
    if (fullName.length < 2) setFullNameError('Please enter a correct full name')
    if (username.length < 4) setUsernameError('the username should at least be 4 chars or more')
    else return true
  }

  const handleSubmit: FormEventHandler = async e => {
    e.preventDefault()
    if (formValidator()) {
      setLoad(true)

      selectedImage ? await profileService.updateAvatar(userSession?.id as string, selectedImage) : null
      profileService
        .update(userSession?.id as string, {
          full_name: fullName,
          username,
          about,
          headline,
        })
        .then(() => {
          setLoad(false)
          avatarPreview ? setAvatar(avatarPreview) : null
          setAvatarPreview('')
          setSelectedImage(null)
        })
    }
  }

  return (
    <Protectedroute>
      <div className="container-custom-screen h-screen mt-20">
        <div>
          <h1 className="text-xl text-slate-50 font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            This information will be displayed publicly so be careful what you share.
          </p>
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
                <Label>Full name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName((e.target as HTMLInputElement).value)}
                  className="w-full mt-2"
                />
                <LabelError className="mt">{fullNameError}</LabelError>
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={e => setUsername((e.target as HTMLInputElement).value)}
                  className="w-full mt-2"
                />
                <LabelError className="mt">{usernameError}</LabelError>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} className="w-full mt-2" />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={headline}
                  onChange={e => setHeadLine((e.target as HTMLInputElement).value)}
                  className="w-full mt-2"
                />
                <LabelError>{headlineError}</LabelError>
              </div>
              <div>
                <Label>About</Label>
                <Textarea
                  value={about}
                  onChange={e => setAbout((e.target as HTMLInputElement).value)}
                  className="w-full h-28 mt-2"
                />
                <LabelError className="mt">{aboutError}</LabelError>
              </div>
              <Button
                isLoad={isLoad}
                className="flex justify-center w-full ring-offset-2 ring-orange-500 focus:ring-2 hover:bg-orange-400"
              >
                {isLoad ? 'Updating' : 'save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Protectedroute>
  )
}

export default Profile
