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
import axios from 'axios';
import ProfileService from '@/utils/supabase/services/profile';
import Alert from '@/components/ui/Alert';
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

  // "Start with your website" import (only when FIRECRAWL_API_KEY is set on the server)
  const [importEnabled, setImportEnabled] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importState, setImportState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  // ProductHunt import state
  const [isPhModalOpen, setIsPhModalOpen] = useState(false);
  const [phSlug, setPhSlug] = useState('');
  const [isPhLoading, setIsPhLoading] = useState(false);
  const [phError, setPhError] = useState('');
  const [phProductAlert, setPhProductAlert] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get('/api/tools/import')
      .then(({ data }) => setImportEnabled(!!data.enabled))
      .catch(() => {});
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

  const onSubmit: SubmitHandler<Inputs> = async data => {
    try {
      scrollToErroView();
      if (validateImages() && (await validateToolName())) {
        const { tool_name, tool_website, tool_description, slogan, pricing_type, github_repo, demo_video } = data;

        setLaunching(true);
        // The tool joins the free launch queue; the owner picks free vs. a paid week on the next step.
        const { data: res } = await axios.post('/api/tools', {
          name: tool_name,
          slogan,
          website: tool_website,
          githubUrl: github_repo,
          description: tool_description,
          pricingType: pricing_type,
          logoUrl: logoPreview,
          assetUrls: imagePreviews,
          demoVideoUrl: demo_video,
          categoryIds: categories.map(item => item.id),
        });
        const product = res.product;
        localStorage.setItem(
          'last-tool',
          JSON.stringify({ toolSlug: product.slug, launchDate: product.launch_date, launchEnd: product.launch_end }),
        );
        router.push(`/account/tools/activate-launch/${product.slug}?new=1`);
      }
    } catch (err: any) {
      console.log('error on submit', err);
      if (err?.response?.data?.error) alert(err.response.data.error);
      setLaunching(false);
    }
  };

  // Function to fetch ProductHunt data and auto-fill form
  const handleWebsiteImport = async () => {
    if (!importUrl.trim()) return;
    setImportState('loading');
    setImportError('');
    try {
      const { data } = await axios.post('/api/tools/import', { url: importUrl.trim() });
      const draft = data.draft;
      setValue('tool_name', draft.name, { shouldValidate: true });
      setValue('slogan', draft.slogan, { shouldValidate: true });
      setValue('tool_website', draft.website, { shouldValidate: true });
      setValue('tool_description', draft.description, { shouldValidate: true });
      if (draft.pricingTypeId) setValue('pricing_type', draft.pricingTypeId, { shouldValidate: true });
      if (data.categories?.length) setCategory(data.categories);
      if (draft.logoUrl) {
        setLogoPreview(draft.logoUrl);
        setLogoFile(draft.logoUrl);
      }
      if (draft.screenshotUrls?.length) {
        setImagePreview(draft.screenshotUrls);
        setImageFile(draft.screenshotUrls);
      }
      setImportState('done');
    } catch (err: any) {
      setImportError(err?.response?.data?.error ?? "We couldn't read that website. Please fill in the form yourself.");
      setImportState('error');
    }
  };

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
              {importEnabled && (
                <div id="website-import" className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.04] p-4">
                  <p className="text-sm font-medium text-slate-100">Start with your website</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Paste your URL and we&apos;ll fill in the form for you: name, tagline, description, pricing, categories, logo and a
                    screenshot. You can edit everything before submitting.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="https://myawesomedevtool.com"
                      value={importUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setImportUrl(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleWebsiteImport();
                        }
                      }}
                      className="w-full"
                    />
                    <Button
                      type="button"
                      isLoad={importState === 'loading'}
                      onClick={() => void handleWebsiteImport()}
                      className="flex-none whitespace-nowrap hover:bg-orange-400"
                    >
                      {importState === 'loading' ? 'Reading your site...' : 'Fill the form'}
                    </Button>
                  </div>
                  {importState === 'done' && <p className="mt-2 text-xs text-green-400">Done! Check the details below and edit anything you like.</p>}
                  {importState === 'error' && <LabelError className="mt-2">{importError}</LabelError>}
                </div>
              )}

              {!importEnabled && phProductAlert && (
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
                        <Radio
                          value={item.id}
                          checked={field.value === item.id}
                          onChange={() => field.onChange(item.id)}
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
              title="Launch date"
              description="You'll pick your launch date on the next step: a free spot in the launch queue, or a week of your choice within the next 4 weeks."
            >
              <div>
                <Button
                  id="submit-btn"
                  type="submit"
                  isLoad={isLaunching}
                  className="w-full hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring"
                >
                  Submit and pick a launch date
                </Button>
                <p className="text-sm text-slate-500 mt-2">* no worries, you can change tool info later</p>
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
