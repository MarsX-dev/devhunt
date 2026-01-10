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
import usermaven from '@/utils/usermaven';
import Alert from '@/components/ui/Alert';
import moment from 'moment';
import Modal from '@/components/ui/Modal';
import { IconGlobeAlt } from '@/components/Icons/IconGlobeAlt';
import { IconXmark } from '@/components/Icons';

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
  submitType: string;
}

interface Weeks {
  count: number;
  startDate: string;
  endDate: string;
  week: number;
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
    setError,
    getValues,
    setValue,
  } = useForm<Inputs>();

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

  const [allWeeks, setAllWeeks] = useState<{ week: number; startDate: Date; endDate: Date; count: number }[]>([]);

  // ProductHunt import state
  const [isPhModalOpen, setIsPhModalOpen] = useState(false);
  const [phSlug, setPhSlug] = useState('');
  const [isPhLoading, setIsPhLoading] = useState(false);
  const [phError, setPhError] = useState('');
  const [phProductAlert, setPhProductAlert] = useState<boolean>(true);

  useEffect(() => {
    pricingTypesList.then(types => {
      setPricingType([...(types as ProductPricingType[])]);
    });
    profileService.getById(user?.id as string).then(user => {
      setProfile(user as Profile);
    });
  }, []);

  // useEffect(() => {
  //   if (imagesError) {
  //     document.getElementById('tool-screenshots-container')?.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [imagesError]);

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

  function scrollToErroView() {
    if (imagesError) {
      document.getElementById('tool-screenshots-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    if (logoError) {
      document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    if (errors.pricing_type) {
      document.getElementById('pricing-container')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  useEffect(() => {
    if (logoError || imagesError || errors.pricing_type) {
      scrollToErroView();
    }
  }, [imagesError, logoError, errors.pricing_type]);

  function findNearestAvailableDate(dates: Weeks[], currentDate = new Date()) {
    // Convert current date to timestamp for comparison
    const currentTimestamp = currentDate.getTime();

    // Filter dates with count < 20 and convert to array of objects with timestamp
    const availableDates = dates
      .filter(date => date.count < 15)
      .map(date => ({
        ...date,
        timestamp: new Date(date.startDate).getTime(),
      }));

    // Sort by absolute difference from current date
    availableDates.sort((a, b) => {
      const diffA = Math.abs(a.timestamp - currentTimestamp);
      const diffB = Math.abs(b.timestamp - currentTimestamp);
      return diffA - diffB;
    });

    // Return the nearest date, or null if no dates are available
    return availableDates.length > 0 ? availableDates[0] : null;
  }

  async function getWeekDate(launchWeek: number) {
    const currentWeek = await productService.getWeekNumber(new Date(), 2);
    const currentYear = new Date().getFullYear();

    const weeks = await productService.getWeeks(currentWeek > launchWeek ? currentYear + 1 : currentYear, 2);
    const weekData = weeks.find(i => i.week === launchWeek);
    return weekData;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toISOString().replace('.000Z', '+00:00');
  }

  const onSubmit: SubmitHandler<Inputs> = async data => {
    try {
      scrollToErroView();
      if (validateImages() && (await validateToolName())) {
        const { tool_name, tool_website, tool_description, slogan, pricing_type, github_repo, demo_video, week, submitType } = data;
        const generatedVideoUrl = `https://app.paracast.io/api/getPromoVideoFromSiteUrl/?project_url=${tool_website}`;

        const categoryIds = categories.map(item => item.id);

        const launchWeek = typeof week === 'string' ? parseInt(week) : week;

        setLaunching(true);
        const weekData = await getWeekDate(launchWeek);

        const launchData: any = {};

        const availableDate = findNearestAvailableDate(allWeeks as []);
        if (submitType == 'free' && !availableDate) {
          setLaunching(false);
          if (allWeeks.length === 0) {
            alert('Launch dates are still loading. Please wait a moment and try again.');
          } else {
            alert('No free launch dates found (all weeks are full). Please choose a paid week instead.');
          }
          return;
        }
        if (submitType == 'free') {
          launchData.launch_date = formatDate(availableDate!.startDate as string);
          launchData.launch_start = formatDate(availableDate!.startDate as string);
          launchData.launch_end = formatDate(availableDate!.endDate as string);
          launchData.week = availableDate!.week as number;
        } else if (submitType == 'paid') {
          launchData.launch_date = weekData?.startDate as string;
          launchData.launch_start = weekData?.startDate as string;
          launchData.launch_end = weekData?.endDate;
          launchData.week = weekData?.week;
        } else if (submitType == 'normal') {
          launchData.launch_date = weekData?.startDate as string;
          launchData.launch_start = weekData?.startDate as string;
          launchData.launch_end = weekData?.endDate;
          launchData.week = weekData?.week;
        }

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
              demo_video_url: demo_video || generatedVideoUrl,
              ...launchData,
              isPaid: false,
              paid_launch_date: submitType == 'paid' ? weekData : null,
            },
            categoryIds,
          )
          .then(async res => {
            const DISCORD_TOOL_WEBHOOK = process.env.DISCOR_TOOL_WEBHOOK as string;
            const toolURL = `https://devhunt.org/tool/${res?.slug}`;
            const content = `**${res?.name}** by ${profile?.full_name} [open the tool](${toolURL})`;
            DISCORD_TOOL_WEBHOOK ? await axios.post(DISCORD_TOOL_WEBHOOK, { content }) : '';
            localStorage.setItem(
              'last-tool',
              JSON.stringify({
                toolSlug: res?.slug,
                launchDate: res?.launch_date,
                launchEnd: res?.launch_end,
              }),
            );
            router.push(`/tool/${res?.slug}?banner=true`);
            if (submitType == 'paid') {
              window.open(`/account/tools/activate-launch/${createSlug(tool_name)}`);
            }
          });
      }
    } catch (err) {
      console.log('error on submit', err);
      setLaunching(false);
    }
  };

  const [launchDateStart, setLaunchDateStart] = useState<{ startDate: string; count: number }>({ startDate: '', count: 0 });

  // Function to fetch ProductHunt data and auto-fill form
  const handlePhImport = async () => {
    if (!phSlug.trim()) {
      setPhError('Please enter a ProductHunt slug');
      return;
    }

    setIsPhLoading(true);
    setPhError('');

    try {
      const response = await axios.get(`/api/ph-dev-tools/${phSlug.trim()}`);
      console.log('ProductHunt API response:', response.data);
      const { product } = response.data;

      if (product) {
        // Doesn't work after new PH update, they block requests from other domains when try to get the real website url
        // const realWebsite = await axios.get(`/api/ph-dev-tools/get-website-url/${encodeURIComponent(product.website)}`);

        setValue('tool_name', product.name);
        setValue('slogan', product.tagline);
        setValue('tool_website', '');
        setValue('tool_description', product.description);
        setLogoPreview(product.thumbnail.url);
        setLogoFile(product.thumbnail.url);
        setImagePreview(product.media.map((item: { url: string }) => item.url));
        setImageFile(product.media.map((item: { url: string }) => item.url));
        // Close modal and show success message
        setIsPhModalOpen(false);
        setPhSlug('');
      }
    } catch (error: any) {
      console.error('ProductHunt import error:', error);
      if (error.response?.status === 404) {
        setPhError('Product not found. Please check the slug and try again.');
      } else {
        setPhError('Failed to fetch product. Please try again.');
      }
    } finally {
      setIsPhLoading(false);
    }
  };

  return (
    <>
      <section className="container-custom-screen">
        <Alert context="Any non-dev tools will be subject to removal. Please ensure that your submission is relevant to the developer community." />
        <h1 className="text-xl text-slate-50 font-semibold mt-6">Launch a tool</h1>
        <div id="form-container" className="mt-12">
          <FormLaunchWrapper onSubmit={handleSubmit(onSubmit as () => void)}>
            <FormLaunchSection
              number={1}
              title="Tell us about your tool"
              description="Share basic info to help fellow devs get the gist of your awesome creation."
            >
              {phProductAlert && (
                <div className="relative mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IconGlobeAlt className="w-5 h-5 text-orange-400" />
                      <span className="text-sm font-medium text-slate-200">Import from ProductHunt</span>
                    </div>
                    <Button type="button" onClick={() => setIsPhModalOpen(true)} variant="shiny" className="text-xs px-3 py-1.5">
                      Import
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Already have your tool on ProductHunt? Import the details to auto-fill this form and save time!
                  </p>
                  <button
                    onClick={() => setPhProductAlert(false)}
                    className="absolute -left-2 -top-2 p-1 text-slate-50 bg-slate-700 border border-slate-600 rounded-full"
                  >
                    <IconXmark className="w-4 h-4" />
                  </button>
                </div>
              )}

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
                <Label>Quick Description</Label>
                <Textarea
                  placeholder="Briefly explain what your tool does. HTML is supported"
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
              <div id="pricing-container">
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
              <div id="tool-screenshots-container">
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
                  <li>
                    <b>4. DoFollow backlink(DR 57):</b> Boost your own domain rating by getting high quality dofollow link.
                  </li>
                </ul>
                <div className="relative mt-4 mb-3">
                  <SelectLaunchDate
                    label="Launch week"
                    className="w-full"
                    validate={{
                      ...register('week', {
                        required: true,
                        async onChange(value) {
                          if (value) {
                            const currentStartDate = (await getWeekDate(Number(value.target.value)))?.startDate as any;
                            const startDate = allWeeks.filter(
                              item => new Date(item.startDate).getTime() == new Date(currentStartDate).getTime(),
                            );
                            setValue('week', value.target.value, { shouldValidate: true });
                            // console.log(startDate);
                            // console.log(new Date(currentStartDate));
                            setLaunchDateStart(startDate[0] as any);
                          }
                        },
                      }),
                    }}
                    setAllWeeks={setAllWeeks}
                  />
                  <LabelError className="mt-2">{errors.week && 'Please pick a launch week'}</LabelError>
                </div>
                {/* <div className="text-lg text-slate-100 font-medium">
                Wanna skip this line?{' '}
                <a target="_blank" href="https://buy.stripe.com/8wM6qfeEWdde1So3cr" className="underline text-orange-500">
                  See details
                </a>
              </div> */}
              </div>
              <div className="pt-7">
                {getValues('week') && (
                  <>
                    <Button
                      id="submit-btn"
                      type="submit"
                      isLoad={isLaunching}
                      className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring"
                      onClick={() => setValue('submitType', launchDateStart.count > 14 ? 'paid' : 'normal')}
                    >
                      {launchDateStart.count > 14 ? <>Launch on {moment(launchDateStart.startDate).format('LL')} for $49</> : 'Submit'}
                    </Button>
                    {launchDateStart.count > 14 && findNearestAvailableDate(allWeeks as []) && (
                      <Button
                        onClick={() => setValue('submitType', 'free')}
                        id="submit-btn"
                        type="submit"
                        isLoad={isLaunching}
                        className="w-full text-sm mt-2 text-slate-400"
                        variant="shiny"
                      >
                        Queue to launch on {moment(findNearestAvailableDate(allWeeks as [])?.startDate).format('LL')} for free
                      </Button>
                    )}
                  </>
                )}
                <p className="text-sm text-slate-500 mt-2">* no worries, you can change tool info or reschedule the launch later</p>
              </div>
            </FormLaunchSection>
          </FormLaunchWrapper>
        </div>

        {/* isPaymentFormActive */}
      </section>
      {/* ProductHunt Import Modal */}
      <Modal
        isActive={isPhModalOpen}
        onCancel={() => {
          setIsPhModalOpen(false);
          setPhSlug('');
          setPhError('');
        }}
        variant="custom"
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <IconGlobeAlt className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-slate-50">Import from ProductHunt</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">ProductHunt Slug</Label>
              <Input
                placeholder="e.g., my-awesome-dev-tool"
                value={phSlug}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhSlug(e.target.value)}
                className="w-full mt-2 border border-slate-700"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handlePhImport();
                  }
                }}
              />
              {phError && <LabelError className="mt-2 text-sm">{phError}</LabelError>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={handlePhImport} isLoad={isPhLoading} className="flex-1">
                {isPhLoading ? 'Importing...' : 'Import Product'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsPhModalOpen(false);
                  setPhSlug('');
                  setPhError('');
                }}
                variant="shiny"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
