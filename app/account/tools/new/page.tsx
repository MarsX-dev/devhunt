'use client';

import { useSupabase } from '@/components/supabase/provider';
import Button from '@/components/ui/Button/Button';
import CategoryInput from '@/components/ui/CategoryInput';
import { FormLaunchSection, FormLaunchWrapper } from '@/components/ui/FormLaunch';
import { ImageUploaderItem, ImagesUploader } from '@/components/ui/ImagesUploader';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import LabelError from '@/components/ui/LabelError';
import LogoUploader from '@/components/ui/LogoUploader';
import Radio from '@/components/ui/Radio';
import Textarea from '@/components/ui/Textarea';
import createSlug from '@/utils/createSlug';
import { createBrowserClient } from '@/utils/supabase/browser';
import fileUploader from '@/utils/supabase/fileUploader';
import ProductPricingTypesService from '@/utils/supabase/services/pricing-types';
import ProductsService from '@/utils/supabase/services/products';
import { Profile, type ProductCategory, type ProductPricingType } from '@/utils/supabase/types';
import { type File } from 'buffer';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import SelectLaunchDate from '@/components/ui/SelectLaunchDate';
import axios from 'axios';
import ProfileService from '@/utils/supabase/services/profile';
import { usermaven } from '@/utils/usermaven';
import Alert from '@/components/ui/Alert';

interface Inputs {
  tool_name: string;
  tool_website: string;
  tool_description: string;
  slogan: string;
  pricing_type: number;
  github_repo: string;
  demo_video: string;
  week: number;
  launch_date: Date;
  launch_start: Date;
  launch_end: Date;
}

export default () => {
  const browserService = createBrowserClient();
  const pricingTypesList = new ProductPricingTypesService(browserService).getAll();
  const productService = new ProductsService(browserService);
  const profileService = new ProfileService(browserService);
  // const productCategoryService = new CategoryService(browserService);

  const router = useRouter();

  const { session } = useSupabase();
  const user = session?.user;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
  } = useForm();

  const [profile, setProfile] = useState<Profile>();

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
  const [isLaunching, setLaunching] = useState<boolean>(false);

  useEffect(() => {
    pricingTypesList.then(types => {
      setPricingType([...(types as ProductPricingType[])]);
    });
    profileService.getById(user?.id as string).then(user => {
      setProfile(user as Profile);
    });
  }, []);

  const handleUploadImages = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file && file.type.includes('image') && imagePreviews.length < 5) {
      setImageFile([...(imageFiles as any), file]);
      setImagesLoad(true);
      setImageError('');
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
    setImageFile(imageFiles.filter((_, i) => i !== idx));
  };

  const validateImages = () => {
    setImageError('');
    setLogoError('');
    if (imageFiles.length == 0) setImageError('Please choose some screenshots');
    else if (!logoFile) setLogoError('Please choose product logo');
    else return true;
  };

  const validateToolName = async () => {
    const tool = await productService.getBySlug(createSlug(getValues('tool_name')));
    if (tool?.slug) {
      alert('This tool name is already exist, please use another name for your tool.');
      return false;
    } else return true;
  };

  const onSubmit: SubmitHandler<Inputs> = async data => {
    if (validateImages() && (await validateToolName())) {
      const { tool_name, tool_website, tool_description, slogan, pricing_type, github_repo, demo_video, week } = data;
      const categoryIds = categories.map(item => item.id);
      setLaunching(true);

      const launchWeek = parseInt(week);

      const currentWeek = await productService.getWeekNumber(new Date(), 2);
      const currentYear = new Date().getFullYear();

      const weeks = await productService.getWeeks(currentWeek > launchWeek ? currentYear + 1 : currentYear, 2);
      const weekData = weeks.find(i => i.week === launchWeek);
      await productService
        .insert(
          {
            asset_urls: imagePreviews,
            name: tool_name,
            demo_url: tool_website,
            github_url: github_repo,
            pricing_type,
            slogan,
            description: tool_description,
            logo_url: logoPreview,
            owner_id: user?.id,
            slug: createSlug(tool_name),
            is_draft: false,
            comments_count: 0,
            votes_count: 0,
            demo_video_url: demo_video,
            launch_date: weekData?.startDate as string,
            launch_start: weekData?.startDate,
            launch_end: weekData?.endDate,
            week: launchWeek,
          },
          categoryIds,
        )
        .then(async res => {
          const DISCORD_TOOL_WEBHOOK = process.env.DISCOR_TOOL_WEBHOOK as string;
          const toolURL = `https://devhunt.org/tool/${res?.slug}`;
          const content = `**${res?.name}** by ${profile?.full_name} [open the tool](${toolURL})`;
          DISCORD_TOOL_WEBHOOK ? await axios.post(DISCORD_TOOL_WEBHOOK, { content }) : '';
          setLaunching(false);
          localStorage.setItem(
            'last-tool',
            JSON.stringify({
              toolSlug: res?.slug,
              launchDate: res?.launch_date,
              launchEnd: res?.launch_end,
            }),
          );
          window.open(`/tool/${res?.slug}?banner=true`);
          router.push('/account/tools');
        });
    }
  };

  return (
    <section className="container-custom-screen">
      <Alert context="Any non-dev tools will be subject to removal. Please ensure that your submission is relevant to the developer community." />
      <h1 className="text-xl text-slate-50 font-semibold mt-6">Launch a tool</h1>
      <div className="mt-12">
        <FormLaunchWrapper onSubmit={handleSubmit(onSubmit as () => void)}>
          <FormLaunchSection
            number={1}
            title="Tell us about your tool"
            description="Share basic info to help fellow devs get the gist of your awesome creation."
          >
            <div>
              <LogoUploader isLoad={isLogoLoad} required src={logoPreview} onChange={handleUploadLogo} />
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
                placeholder="Supercharge Your Development Workflow!"
                className="w-full mt-2"
                validate={{ ...register('slogan', { required: true, minLength: 10 }) }}
              />
              <LabelError className="mt-2">{errors.slogan && 'Please enter your tool slogan'}</LabelError>
            </div>
            <div>
              <Label>Tool website URL</Label>
              <Input
                placeholder="https://myawesomedevtool.com/"
                className="w-full mt-2"
                validate={{
                  ...register('tool_website', { required: true, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
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
                  ...register('github_repo', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
                }}
              />
              <LabelError className="mt-2">{errors.github_repo && 'Please enter a valid github repo url'}</LabelError>
            </div>
            <div>
              <Label>Quick Description (max 300 characters)</Label>
              <Textarea
                placeholder="Briefly explain what your tool does. HTML is supported"
                className="w-full h-36 mt-2"
                validate={{
                  ...register('tool_description', { required: true, maxLength: 350 }),
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
                      <Radio value="free" onChange={e => field.onChange(item.id)} id={item.title as string} name="pricing-type" />
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
                placeholder="Demo video (optional). YouTube or mp4 link"
                className="w-full mt-2"
                validate={{
                  ...register('demo_video', { required: false, pattern: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i }),
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
              <ImagesUploader isLoad={isImagesLoad} className="mt-4" files={imageFiles as []} max={5} onChange={handleUploadImages}>
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
            <div>
              <ul className="text-sm text-slate-400">
                <li className="text-slate-300 mb-1">By choosing your tool's big day, you're guaranteeing:</li>
                <li>
                  <b>1. Home Page Spotlight:</b> Your tool will steal the show on our home page for a full 24 hours!
                </li>
                <li>
                  <b>2. Morning Buzz:</b> We'll shoot out an email featuring your tool to our subscribers that very morning.
                </li>
                <li>
                  <b>3. Daily Voting Frenzy:</b> Users will be eager to check out and vote for all of the day's featured tools.
                </li>
              </ul>
              <div className="relative mt-4 mb-3">
                <SelectLaunchDate
                  label="Launch week"
                  className="w-full"
                  validate={{
                    ...register('week', { required: true }),
                  }}
                />
                <LabelError className="mt-2">{errors.weel && 'Please pick a launch week'}</LabelError>
              </div>
            </div>
            <div className="pt-7">
              <Button type="submit" isLoad={isLaunching} className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring">
                Schedule my Dev Tool for Launch
              </Button>
              <p className="text-sm text-slate-500 mt-2">* no worries, you can change it later</p>
            </div>
          </FormLaunchSection>
        </FormLaunchWrapper>
      </div>
    </section>
  );
};
