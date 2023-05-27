'use client'

import React from 'react'
import InputForm from '@/components/ui/Form/InputForm'
import UploadAvatar from '@/components/ui/UploadAvatar/UploadAvatar'
import Button from '@/components/ui/Button/Button'

function Profile() {
  return (
    <div className={'w-[350px] md:w-2/4 mr-auto ml-auto my-6 flex flex-col gap-5'}>
      <UploadAvatar />
      <form action="" className="flex flex-col gap-3 ">
        <div className=" flex flex-col gap-3 ">
          <InputForm placeHolder="mohamed abdellahi" label={'Username'} name="username" type="input" />
          <InputForm placeHolder="mohamedabdelahi2002@gmail.com" label={'Email'} name="email" type="input" />
          <InputForm placeHolder="Tell the community aboout yourself" label={'About'} name="About" type="textarea" />
        </div>
        <Button className="w-16 hover:bg-indigo-500/75">save</Button>
      </form>
    </div>
  )
}

export default Profile
