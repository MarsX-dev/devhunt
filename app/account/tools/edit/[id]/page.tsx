'use client';

import PageHeader from '@/components/ui/PageHeader';
import axios from 'axios';
import { useSupabase } from '@/components/supabase/provider';
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
import fileUploader from '@/utils/supabase/fileUploader';
import ProductPricingTypesService from '@/utils/supabase/services/pricing-types';
import ProductsService from '@/utils/supabase/services/products';
import { type ProductCategory, type ProductPricingType } from '@/utils/supabase/types';
import { type File } from 'buffer';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import SelectmenuDate from '@/components/ui/SelectmenuDate/SelectmenuDate';
import moment from 'moment';
import { usableVideoUrl } from '@/utils/demoVideo';
import SelectLaunchDate from '@/components/ui/SelectLaunchDate';
import { weekKey } from '@/utils/launchWeeks';

interface Inputs {
  tool_name: string;
  tool_website: string;
  tool_description: string;
  slogan: string;
  pricing_type: number;
  github_repo: string;
  demo_video: string;
  week: number | string;
}

export default () => {
  const { id } = useParams<any>();
  const browserService = createBrowserClient();
  const pricingTypesList = new ProductPricingTypesService(browserService).getAll();
  const productService = new ProductsService(browserService);

  const tool = productService.getById(+id);

  // const router = useRouter();
  // const { session } = useSupabase();
  // const user = session && session.user;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm();

  const [categories, setCategory] = useState<ProductCategory[]>([]);
  const [pricingType, setPricingType] = useState<ProductPricingType[]>([]);

  const [imageFiles, setImageFile] = useState<File[]>([]);
  const [imagePreviews, setImagePreview] = useState<string[]>([]);
  const [imagesError, setImageError] = useState<string>('');

  const [logoFile, setLogoFile] = useState<File | Blob>();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  const [isLogoLoad, setLogoLoad] = useState<boolean>(false);
  const [isImagesLoad, setImagesLoad] = useState<boolean>(false);
  const [isUpdate, setUpdate] = useState<boolean>(false);
  const [isPaid, setPaid] = useState<boolean>(false);
  const [slug, setSlug] = useState<string>('');

  const [weekValue, setWeekValue] = useState<string | number>('');

  const [launchEnd, setLaunchDate] = useState<string>();
  const [launchStart, setLaunchStart] = useState<string>();

  useEffect(() => {
    pricingTypesList.then(types => {
      setPricingType([...(types as ProductPricingType[])]);
    });

    tool.then(data => {
      setLogoPreview(data?.logo_url as string);
      setValue('tool_name', data?.name);
      setValue('tool_website', data?.demo_url);
      setValue('tool_description', data?.description);
      setValue('slogan', data?.slogan);
      setValue('pricing_type', data?.pricing_type);
      setValue('github_repo', data?.github_url);
      setValue('demo_video', usableVideoUrl(data?.demo_video_url) ?? '');
      const currentWeekKey = data?.launch_start ? weekKey(data.launch_start) : '';
      setValue('week', currentWeekKey);
      setSlug(data?.slug as string);
      setWeekValue(currentWeekKey);
      setCategory(data?.product_categories as ProductCategory[]);
      setImagePreview(data?.asset_urls as string[]);
      setPaid(data?.isPaid as boolean);
      setLaunchDate(data?.launch_end as string);
      setLaunchStart(data?.launch_start as string);
    });
  }, []);

  const handleUploadImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image') && imagePreviews.length < 5) {
      setImageFile([...(imageFiles as any), file]);
      setImagesLoad(true);
      fileUploader({ files: file as Blob, options: 'w=750' }).then(data => {
        if (data?.file) {
          setImagePreview([...imagePreviews, data.file]);
          setImagesLoad(false);
        }
      });
    }
  };

  const handleUploadLogo = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image')) {
      setLogoFile(file);
      setLogoLoad(true);
      fileUploader({ files: file as Blob, options: 'w=128' }).then(data => {
        setLogoPreview(data?.file as string);
        setLogoLoad(false);
      });
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImagePreview(imagePreviews.filter((_, i) => i !== idx));
  };

  const validateImages = () => {
    setImageError('');
    setLogoError('');
    if (imagePreviews.length === 0) setImageError('Please choose some screenshots');
    else if (!logoPreview) setLogoError('Please choose product logo');
    else return true;
  };

  const onSubmit: SubmitHandler<Inputs> = async data => {
    if (validateImages()) {
      setUpdate(true);
      const { tool_name, tool_website, tool_description, slogan, pricing_type, github_repo, demo_video, week } = data;
      const categoryIds: number[] = categories.map(category => category.id);
      // Only touch the launch week when the user may change it (paid, not started yet)
      // and actually picked a different week. Otherwise keep the stored dates as they are.
      const canChangeWeek = isPaid && new Date(launchStart as string) > new Date();
      const originalWeekKey = launchStart ? weekKey(launchStart) : '';
      const weekChanged = canChangeWeek && week && week !== originalWeekKey;

      try {
        // Saved (and re-moderated) on the server: the browser can't write tool rows directly.
        await axios.patch(`/api/tools/${id}`, {
          assetUrls: imagePreviews,
          name: tool_name,
          website: tool_website,
          githubUrl: github_repo || null,
          pricingType: Number(pricing_type),
          slogan,
          description: tool_description,
          logoUrl: logoPreview,
          demoVideoUrl: demo_video || null,
          categoryIds,
        });
        // Launch dates can only be changed server-side (paid launches that haven't started).
        if (weekChanged) {
          const { data: res } = await axios.post(`/api/tools/${id}/reschedule`, { week });
          setLaunchStart(res.launchStart);
        }
        window.alert('Your launch has been updated successfully');
      } catch (err: any) {
        window.alert(err?.response?.data?.error ?? 'Could not update your launch, please try again.');
      } finally {
        setUpdate(false);
      }
    }
  };

  return (
    <section className="container-custom-screen mt-10 mb-24">
      <PageHeader eyebrow="Dashboard" title="Edit your launch" />
      <div className="mt-14">
        <FormLaunchWrapper onSubmit={handleSubmit(onSubmit as () => void)}>
          <FormLaunchSection
            number={1}
            title="Tell us about your tool"
            description="Provide basic information to help users understand your tool."
          >
            <div>
              <LogoUploader isLoad={isLogoLoad} src={logoPreview} onChange={handleUploadLogo} />
              <LabelError className="mt-2">{logoError}</LabelError>
            </div>
            <div>
              <Label>Tool name</Label>
              <Input
                placeholder="My Awesome Dev Tool"
                className="w-full mt-2"
                validate={{ ...register('tool_name', { required: true, minLength: 3 }) }}
              />
              <LabelError className="mt-2">{errors.tool_name && 'Please enter your tool name'}</LabelError>
            </div>
            <div>
              <Label>Catchy slogan 😎</Label>
              <Input
                placeholder="Supercharge Your Development Workflow"
                className="w-full mt-2"
                validate={{ ...register('slogan', { required: true, minLength: 10 }) }}
              />
              <LabelError className="mt-2">{errors.solgan && 'Please enter your tool slogan'}</LabelError>
            </div>
            <div>
              <Label>Tool website URL</Label>
              <Input
                placeholder="https://myawesomedevtool.com/"
                className="w-full mt-2"
                validate={{
                  ...register('tool_website', {
                    required: true,
                    pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i,
                  }),
                }}
              />
              <LabelError className="mt-2">{errors.tool_website && 'Please enter your tool website URL'}</LabelError>
            </div>
            <div>
              <Label>GitHub repo URL (optional)</Label>
              <Input
                placeholder="https://github.com/username/myawesomedevtool"
                className="w-full mt-2"
                validate={{
                  ...register('github_repo', {
                    required: false,
                    pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i,
                  }),
                }}
              />
              <LabelError className="mt-2">{errors.github_repo && 'Please enter a valid github repo url'}</LabelError>
            </div>
            <div>
              <Label>Quick Description</Label>
              <Textarea
                placeholder="Briefly explain what your tool does. HTML is supported."
                className="w-full h-36 mt-2"
                validate={{
                  ...register('tool_description', { required: true }),
                }}
              />
              <LabelError className="mt-2">{errors.tool_description && 'Please enter your tool description'}</LabelError>
            </div>
          </FormLaunchSection>
          <FormLaunchSection
            number={2}
            title="Extra Stuff"
            description="We'll use this to group your tool with others and share it in newsletters. Plus, users can filter by price and categories!"
          >
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
                        checked={item.id == getValues('pricing_type')}
                        value="free"
                        onChange={e => {
                          field.onChange(item.id);
                        }}
                        id={item.title as string}
                        name="pricing-type"
                      />
                      <Label htmlFor={item.title as string} className="font-normal">
                        {item.title}
                      </Label>
                    </div>
                  )}
                />
              ))}
              <LabelError className="mt-2">{errors.pricing_type && 'Please select your tool pricing type'}</LabelError>
            </div>
            <div>
              <Label>Tool categories (optional)</Label>
              <CategoryInput className="mt-2" categories={categories} setCategory={setCategory} />
            </div>
          </FormLaunchSection>
          <FormLaunchSection number={3} title="Media" description="Show off how awesome your dev tool is with cool images.">
            <div>
              <Label>Demo video (optional)</Label>
              <Input
                placeholder="A simple demo video URL from youtube or mpt4 link"
                className="w-full mt-2"
                validate={{
                  ...register('demo_video', {
                    required: false,
                    pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i,
                  }),
                }}
              />
              <LabelError className="mt-2">{errors.demo_video && 'Please enter a valid demo video url'}</LabelError>
            </div>
            <div>
              <Label>Tool screenshots</Label>
              <p className="text-sm text-slate-400">
                Upload at least three screenshots showcasing different aspects of functionality. Note that the first image will be used as
                social preview, so choose wisely!
              </p>
              <ImagesUploader isLoad={isImagesLoad} className="mt-4" files={imagePreviews as []} max={5} onChange={handleUploadImages}>
                {imagePreviews.map((src, idx) => (
                  <ImageUploaderItem
                    src={src}
                    key={idx}
                    onRemove={() => {
                      handleRemoveImage(idx);
                    }}
                  />
                ))}
              </ImagesUploader>
              <LabelError className="mt-2">{imagesError}</LabelError>
            </div>
          </FormLaunchSection>
          <FormLaunchSection
            number={4}
            title="Launch Week for Your Dev Tool"
            description="Setting the perfect launch week is essential to make a splash in the dev world."
          >
            {new Date(launchEnd as string) > new Date() && (
              <div>
                <div className="relative mt-4 mb-3">
                  {isPaid && new Date(launchStart as string) > new Date() ? (
                    <SelectLaunchDate
                      validate={{
                        ...register('week', { required: true, onChange: e => setWeekValue(e.target.value) }),
                      }}
                      value={weekValue}
                      label="Launch week"
                      className="w-full"
                    />
                  ) : (
                    <SelectLaunchDate value={getValues('week')} label="Launch week" className="w-full" disabled={true} />
                  )}
                  <LabelError className="mt-2">{errors.launch_date && 'Please pick a launch date'}</LabelError>
                </div>
                {!isPaid && (
                  <div className="mt-3 text-sm text-slate-100 font-medium">
                    *To edit your launch date you need to pay{' '}
                    <a target="_blank" href={`/account/tools/activate-launch/${slug}`} className="underline text-orange-500">
                      Pay to edit
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className="mt-3">
              <Button isLoad={isUpdate} type="submit" className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring">
                Update
              </Button>
            </div>
          </FormLaunchSection>
        </FormLaunchWrapper>
      </div>
    </section>
  );
};
