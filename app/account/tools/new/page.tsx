'use client';

import Button from '@/components/ui/Button/Button';
import CategoryInput from '@/components/ui/CategoryInput';
import { FormLaunchSection, FormLaunchWrapper } from '@/components/ui/FormLaunch';
import { ImageUploaderItem, ImagesUploader } from '@/components/ui/ImagesUploader';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import LabelError from '@/components/ui/LabelError/LabelError';
import LogoUploader from '@/components/ui/LogoUploader/LogoUploader';
import Radio from '@/components/ui/Radio';
import Textarea from '@/components/ui/Textarea';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductPricingTypesService from '@/utils/supabase/services/pricing-types';
import { File } from 'buffer';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

type Inputs = {
  tool_name: string;
  tool_website: string;
  tool_description: string;
  solgan: string;
  pricing_type: string;
  github_repo: string;
  demo_video: string;
};

export default () => {
  const browserService = createBrowserClient();
  const pricingTypesList = new ProductPricingTypesService(browserService).getAll();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const [categories, setCategory] = useState(['AWS ES2', 'Docker', 'Github']);
  const [pricingType, setPricingType] = useState<string[]>([]);

  const [imageFiles, setImageFile] = useState<File[]>([]);
  const [imagePreviews, setImagePreview] = useState<string[]>([]);
  const [imagesError, setImageError] = useState<string>('');

  const [logoFile, setLogoFile] = useState<File | Blob>();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  useEffect(() => {
    const types: string[] = [];
    pricingTypesList.then(items => {
      items?.forEach(item => {
        types.push(item.title as string);
      });
      setPricingType(types);
    });
  }, []);

  const handleUploadImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image') && imagePreviews.length < 5) {
      setImageFile([...(imageFiles as any), file]);
      setImagePreview([...imagePreviews, URL.createObjectURL(file)]);
    }
  };

  const handleUploadLogo = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImagePreview(imagePreviews.filter((_, i) => i !== idx));
    setImageFile(imageFiles.filter((_, i) => i !== idx));
  };

  const validateImages = () => {
    setImageError('');
    setLogoError('');
    if (imageFiles.length == 0) setImageError('Please choose some screenshots');
    else if (!logoFile) setLogoError('Please choose product logo');
    else return true;
  };

  const onSubmit: SubmitHandler<Inputs> = data => {
    console.log(data);
    if (validateImages()) {
    }
  };
  console.log(imagesError, logoError);

  return (
    <section className="container-custom-screen">
      <h1 className="text-xl text-slate-50 font-semibold">Launch a tool</h1>
      <div className="mt-14">
        <FormLaunchWrapper onSubmit={handleSubmit(onSubmit as () => void)}>
          <FormLaunchSection number={1} title="Tell us about your tool" description="This basic information is important for the users.">
            <div>
              <LogoUploader required src={logoPreview} onChange={handleUploadLogo} />
              <LabelError className="mt-2">{logoError}</LabelError>
            </div>
            <div>
              <Label>Tool name</Label>
              <Input
                placeholder="Dev Hunt"
                className="w-full mt-2"
                validate={{ ...register('tool_name', { required: true, minLength: 3 }) }}
              />
              <LabelError className="mt-2">{errors.tool_name && 'Please enter your tool name'}</LabelError>
            </div>
            <div>
              <Label>Slogan</Label>
              <Input
                placeholder="Find the best new DevTools in tech"
                className="w-full mt-2"
                validate={{ ...register('solgan', { required: true, minLength: 20 }) }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool solgan'}</LabelError>
            </div>
            <div>
              <Label>Tool website URL</Label>
              <Input
                placeholder="https://devhunt.org/"
                className="w-full mt-2"
                validate={{
                  ...register('tool_website', { required: true, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool website URL'}</LabelError>
            </div>
            <div>
              <Label>Github repo URL (optional)</Label>
              <Input
                placeholder="https://github.com/MarsX-dev/devhunt"
                className="w-full mt-2"
                validate={{
                  ...register('github_repo', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
            </div>
            <div>
              <Label>Description of the tool</Label>
              <Textarea
                placeholder="Write a description: 220 characters, HTML is supported."
                className="w-full h-36 mt-2"
                validate={{
                  ...register('tool_description', { required: true, maxLength: 220 }),
                }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool description'}</LabelError>
            </div>
          </FormLaunchSection>
          <FormLaunchSection number={2} title="Extras" description="Help people find you easily by providing pricing type and categories. ">
            <div>
              <Label>Tool pricing type</Label>
              {pricingType.map((item, idx) => (
                <Controller
                  key={idx}
                  name="pricing_type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div className="mt-2 flex items-center gap-x-2">
                      <Radio
                        value="free"
                        onChange={e => field.onChange((e.target as HTMLInputElement).value)}
                        id={item}
                        name="pricing-type"
                      />
                      <Label htmlFor={item} className="font-normal">
                        {item}
                      </Label>
                    </div>
                  )}
                />
              ))}
              <LabelError className="mt-2">{errors.solgan && 'Please select your tool pricing type'}</LabelError>
            </div>
            <div>
              <Label>Tool categories (optional)</Label>
              <CategoryInput className="mt-2" categories={categories} setCategory={setCategory} />
            </div>
          </FormLaunchSection>
          <FormLaunchSection number={3} title="Media" description="Make people engage with your tool by providing great images">
            <div>
              <Label>Demo video (optional)</Label>
              <Input
                placeholder="A simple demo video URL from youtube"
                className="w-full mt-2"
                validate={{
                  ...register('demo_video', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
            </div>
            <div>
              <Label>Tool screenshots</Label>
              <p className="text-sm text-slate-400">The first image will be used as the social preview. upload at least 3-5 images.</p>
              <ImagesUploader className="mt-4" files={imageFiles as []} max={5} onChange={handleUploadImages}>
                {imagePreviews.map((src, idx) => (
                  <ImageUploaderItem src={src} key={idx} onRemove={() => handleRemoveImage(idx)} />
                ))}
              </ImagesUploader>
              <LabelError className="mt-2">{imagesError}</LabelError>
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
  );
};
