'use client'

import React, { FormEventHandler } from 'react'
import UploadAvatar from '@/components/ui/UploadAvatar/UploadAvatar'
import Button from '@/components/ui/Button/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label/Label'
import Textarea from '@/components/ui/Textarea'

function Profile() {
  const handleSubmit: FormEventHandler = e => {
    e.preventDefault()
  }

  return (
    <div className="max-w-2xl h-screen mx-auto mt-20 px-4">
      <div>
        <h1 className="text-xl text-slate-50 font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          This information will be displayed publicly so be careful what you share.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-14">
        <div className="space-y-4">
          <UploadAvatar />
          <div>
            <Label>Username</Label>
            <Input className="w-full mt-2" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="w-full mt-2" />
          </div>
          <div>
            <Label>About</Label>
            <Textarea className="w-full h-24 mt-2" />
          </div>
          <Button className="w-full ring-offset-2 ring-offset-slate-900 ring-orange-500 focus:ring-2 hover:bg-orange-400">
            save
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Profile
