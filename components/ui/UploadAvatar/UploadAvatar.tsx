import { CommentUserAvatar } from '@/components/ui/Comment';
import Button from '@/components/ui/Button/Button';
import profilImg from "../../../public/images/sidi.jpeg"
import { useEffect, useState, useRef } from 'react';


export default () => {
    const inputRef = useRef<HTMLInputElement>(null)

    // Open the file system
    const handleAvatarUpload = () => {
        inputRef.current?.click()
    };


     const [selectedImage, setSelectedImage] = useState<File | null>(null);
     const [imageUrl, setImageUrl] = useState(String);
    
      //Store the image file
     const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (!e.target.files) return;
         const file = e.target.files[0]
         setSelectedImage(file)
     }
    
      //Get image url
     useEffect(() => {
         if(selectedImage){
             setImageUrl(URL.createObjectURL(selectedImage))
         }
     }, [selectedImage])
     
    const avatar = imageUrl ? imageUrl : profilImg.src

    return (
        <div className="flex gap-4 items-center">
          <CommentUserAvatar alt='user profil' src={avatar}/>
          <Button onClick={() => handleAvatarUpload()} className=' bg-slate-800 hover:bg-slate-800/50  text-xs font-medium px-3 py-3'>
            Upload new Avatar
            <label
                htmlFor="Avatar-upload"
                className="relative cursor-pointer outline-none bg-slate-900 font-semibold text-indigo-600  hover:text-indigo-500"
                >
                <input
                    ref={inputRef}
                    id="Avatar-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only "
                    accept="image/*"
                    onChange={(e) => handleFileSelected(e)}
                />
                </label>
          </Button>
          
        </div>
    )
}