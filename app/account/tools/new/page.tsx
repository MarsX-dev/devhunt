'use client'

import Button from '@/components/ui/Button/Button'
import CategoryInput from '@/components/ui/CategoryInput'
import { FormLaunchSection, FormLaunchWrapper } from '@/components/ui/FormLaunch'
import { ImageUploaderItem, ImagesUploader } from '@/components/ui/ImagesUploader'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import LogoUploader from '@/components/ui/LogoUploader/LogoUploader'
import Radio from '@/components/ui/Radio'
import Textarea from '@/components/ui/Textarea'
import { File } from 'buffer'
import { ChangeEvent, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'

type Inputs = {
  example: string
  exampleRequired: string
}

export default () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const [categories, setCategory] = useState(['AWS ES2', 'Docker', 'Github'])

  const [imageFiles, setImageFile] = useState<File[]>([])
  const [imagePreviews, setImagePreview] = useState<string[]>([])

  const [logoFile, setLogoFile] = useState<File | Blob>()
  const [logoPreview, setLogoPreview] = useState<string>('')

  const handleUploadImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const file = e.target.files[0]
    if (file && file.type.includes('image') && imagePreviews.length < 5) {
      setImageFile([...(imageFiles as any), file])
      setImagePreview([...imagePreviews, URL.createObjectURL(file)])
    }
  }

  const handleUploadLogo = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const file = e.target.files[0]
    if (file && file.type.includes('image')) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = (idx: number) => {
    setImagePreview(imagePreviews.filter((_, i) => i !== idx))
    setImageFile(imageFiles.filter((_, i) => i !== idx))
  }

  const onSubmit: SubmitHandler<any> = data => {
    console.log(data)
  }

  return (
    <section className="container-custom-screen">
      <h1 className="text-xl text-slate-50 font-semibold">Launch a tool</h1>
      <div className="mt-14">
        <FormLaunchWrapper onSubmit={handleSubmit(onSubmit)}>
          <FormLaunchSection
            number={1}
            title="Tell us about your tool"
            description="This basic information is important for the users."
          >
            <LogoUploader src={logoPreview} onChange={handleUploadLogo} />
            <div>
              <Label>Tool name</Label>
              <Input placeholder="Dev Hunt" className="w-full mt-2" />
            </div>
            <div>
              <Label>Slogan</Label>
              <Input placeholder="Find the best new DevTools in tech" className="w-full mt-2" />
            </div>
            <div>
              <Label>Tool website URL</Label>
              <Input placeholder="https://devhunt.org/" className="w-full mt-2" />
            </div>
            <div>
              <Label>Github repo URL</Label>
              <Input placeholder="https://github.com/MarsX-dev/devhunt" className="w-full mt-2" />
            </div>
            <div>
              <Label>Description of the tool</Label>
              <Textarea
                placeholder="Write a description: 290 characters, HTML is supported."
                className="w-full h-36 mt-2"
              />
            </div>
          </FormLaunchSection>
          <FormLaunchSection
            number={2}
            title="Extras"
            description="Help people find you easily by providing pricing type and categories. "
          >
            <div>
              <Label>Tool pricing type</Label>
              <div className="mt-2 flex items-center gap-x-2">
                <Radio id="free" name="pricing-type" />
                <Label htmlFor="free" className="font-normal">
                  Free
                </Label>
              </div>
              <div className="mt-2 flex items-center gap-x-2">
                <Radio id="paid" name="pricing-type" />
                <Label htmlFor="paid" className="font-normal">
                  Paid
                </Label>
              </div>
            </div>
            <div>
              <Label>Tool categories</Label>
              <CategoryInput className="mt-2" categories={categories} setCategory={setCategory} />
            </div>
          </FormLaunchSection>
          <FormLaunchSection
            number={3}
            title="Media"
            description="Make people engage with your tool by providing great images"
          >
            <div>
              <Label>Demo video</Label>
              <Input placeholder="A simple demo video URL from youtube" className="w-full mt-2" />
            </div>
            <div>
              <Label>Tool screenchoots</Label>
              <p className="text-sm text-slate-400">
                The first image will be used as the social preview. upload at least 3-5 images.
              </p>
              <ImagesUploader className="mt-4" files={imageFiles as []} max={5} onChange={handleUploadImages}>
                {imagePreviews.map((src, idx) => (
                  <ImageUploaderItem src={src} key={idx} onRemove={() => handleRemoveImage(idx)} />
                ))}
              </ImagesUploader>
            </div>
            <div className="mt-3">
              <Button type="submit" className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring">
                Submit
              </Button>
            </div>
          </FormLaunchSection>
        </FormLaunchWrapper>
      </div>
    </section>
  )
}
