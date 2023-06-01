import Button from '@/components/ui/Button/Button'
import { useRef } from 'react'
import Avatar from '../Avatar/Avatar'

type Props = {
  avatarUrl: string
  avatarPreview?: string
  selectedImage?: File | null
  setSelectedImage?: (val: File | null) => void
  setAvatarPreview?: (val: string) => void
}

export default ({ avatarUrl, avatarPreview, setSelectedImage = () => '', setAvatarPreview = () => '' }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Open the file system
  const handleAvatarUpload = () => {
    inputRef.current?.click()
  }

  //Store the image file
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const file = e.target.files[0]
    if (file && file.type.includes('image')) {
      setSelectedImage(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setAvatarPreview('')
  }

  return (
    <div className="flex gap-4 items-center">
      <label htmlFor="Avatar-upload" className="cursor-pointer">
        <Avatar alt="user profil" src={avatarPreview || avatarUrl} />
      </label>
      <div className="flex items-center gap-x-2">
        <Button onClick={() => handleAvatarUpload()} className=" bg-slate-800 hover:bg-slate-800/50 text-xs">
          Upload new Avatar
        </Button>
        {avatarPreview ? (
          <Button onClick={handleCancel} className="text-xs bg-transparent border border-slate-800">
            cancel
          </Button>
        ) : (
          ''
        )}
      </div>
      <input
        ref={inputRef}
        id="Avatar-upload"
        name="file-upload"
        type="file"
        className="sr-only "
        accept="image/*"
        onChange={e => handleFileSelected(e)}
      />
    </div>
  )
}
