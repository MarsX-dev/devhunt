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
  const { session } = useSupabase()
  const user = session && session.user
  const profileService = new ProfileService(createBrowserClient())
  const profile = profileService.getById(user?.id as string)

  const [isLoad, setLoad] = useState(false)
  const [fullName, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [about, setAbout] = useState('')
  const [avatar, setAvatar] = useState('/user.svg')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const [fullNameError, setUsernameError] = useState('')
  const [aboutError, setAboutError] = useState('')

  useEffect(() => {
    profile.then(res => {
      setUsername(res?.full_name || '')
      setAbout(res?.about || '')
      setEmail(user?.user_metadata.email || '')
      setAvatar(res?.avatar_url as string)
    })
  }, [])

  const formValidator = () => {
    setUsernameError('')
    if (fullName.length < 2) setUsernameError('Please enter your name')
    else return true
  }

  const handleSubmit: FormEventHandler = e => {
    e.preventDefault()
    if (formValidator()) {
      setLoad(true)

      selectedImage ? profileService.updateAvatar(user?.id as string, selectedImage) : null
      profileService
        .update(user?.id as string, {
          full_name: fullName,
          about,
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
      <div className="max-w-2xl h-screen mx-auto mt-20 px-4">
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
                <Label>Username</Label>
                <Input
                  value={fullName}
                  onChange={e => setUsername((e.target as HTMLInputElement).value)}
                  className="w-full mt-2"
                />
                <LabelError className="mt">{fullNameError}</LabelError>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} className="w-full mt-2" />
              </div>
              <div>
                <Label>About</Label>
                <Textarea
                  value={about}
                  onChange={e => setAbout((e.target as HTMLInputElement).value)}
                  className="w-full h-24 mt-2"
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
