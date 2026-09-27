'use client';

import ImportTerminal from './ImportTerminal';
import { useSupabase } from '@/components/supabase/provider';
import Button from '@/components/ui/Button/Button';
import CategoryInput from '@/components/ui/CategoryInput';
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
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { trackStep } from '@/utils/funnelClient';
import ProfileService from '@/utils/supabase/services/profile';
import Modal from '@/components/ui/Modal';
import { IconGlobeAlt } from '@/components/Icons/IconGlobeAlt';

interface Inputs {
  tool_name: string;
  tool_website: string;
  tool_description: string;
  slogan: string;
  pricing_type: number;
  github_repo: string;
  demo_video: string;
}

// One section of the submit form: "01  The basics".
function FormStep({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="flex w-full items-baseline gap-x-3 border-b border-slate-800 pb-3">
        <span className="font-mono text-xs text-orange-400">{n}</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-slate-300">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
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
  const [stage, setStage] = useState<'url' | 'loading' | 'form'>('url'); // URL first, then the (pre-filled) form
  const [importError, setImportError] = useState('');

  // ProductHunt import state
  const [isPhModalOpen, setIsPhModalOpen] = useState(false);
  const [phSlug, setPhSlug] = useState('');
  const [isPhLoading, setIsPhLoading] = useState(false);
  const [phError, setPhError] = useState('');

  useEffect(() => trackStep('submit_view'), []);

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
        trackStep('form_submitted', {
          url: tool_website,
          name: tool_name,
          slogan,
          pricing_type: Number(pricing_type),
          categories: categories.map(item => item.name),
          screenshots: imagePreviews.length,
          has_logo: !!logoPreview,
          has_github: !!github_repo,
          has_video: !!demo_video,
          imported: importState === 'done',
        });
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
        router.push(
          res.moderation === 'blocked'
            ? `/account/tools/activate-launch/${product.slug}?held=${encodeURIComponent(res.moderationReason ?? 'a restricted topic')}`
            : `/account/tools/activate-launch/${product.slug}?new=1`,
        );
      }
    } catch (err: any) {
      console.log('error on submit', err);
      trackStep('form_submitted', { error: String(err?.response?.data?.error ?? err?.message ?? 'submit failed').slice(0, 200) });
      if (err?.response?.data?.error) alert(err.response.data.error);
      setLaunching(false);
    }
  };

  // Function to fetch ProductHunt data and auto-fill form
  const handleWebsiteImport = async () => {
    const url = importUrl.trim();
    if (!url) return;
    trackStep('url_entered', { url });
    const started = Date.now();
    setValue('tool_website', /^https?:\/\//i.test(url) ? url : `https://${url}`);
    if (!importEnabled) {
      setStage('form');
      return;
    }
    setStage('loading');
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
      trackStep('import_done', { url, ok: true, ms: Date.now() - started, name: draft.name, categories: (data.categories ?? []).map((c: any) => c.name) });
    } catch (err: any) {
      setImportError(err?.response?.data?.error ?? "We couldn't read that website. Please fill in the form yourself.");
      setImportState('error');
      trackStep('import_done', { url, ok: false, ms: Date.now() - started, error: String(err?.response?.data?.error ?? err?.message ?? 'failed').slice(0, 200) });
    }
    setStage('form');
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
      <section className="mx-auto mt-10 mb-24 max-w-xl px-4">
        {stage === 'url' && (
          <div className="pt-6 sm:pt-14">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Launch</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">What are you launching?</h1>
            <p className="mt-3 text-slate-400">Paste your website. We&apos;ll fill in the rest, you just review it.</p>
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={e => {
                e.preventDefault();
                void handleWebsiteImport();
              }}
            >
              <label className="flex flex-1 items-center rounded-2xl border border-slate-700 bg-slate-900 px-4 focus-within:border-slate-400">
                <span className="font-mono text-sm text-slate-500">https://</span>
                <input
                  autoFocus
                  aria-label="Your tool's website"
                  placeholder="yourtool.dev"
                  value={importUrl.replace(/^https?:\/\//i, '')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setImportUrl(e.target.value)}
                  className="w-full bg-transparent py-3.5 pl-1 text-slate-100 outline-none placeholder:text-slate-600"
                />
              </label>
              <button
                type="submit"
                disabled={!importUrl.trim()}
                className="rounded-2xl bg-slate-50 px-5 py-3.5 font-medium text-slate-900 duration-150 hover:bg-white disabled:opacity-40"
              >
                Continue →
              </button>
            </form>
            <p className="mt-4 font-mono text-xs text-slate-600">free · about a minute</p>
            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  trackStep('manual_form');
                  setStage('form');
                }}
                className="text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200">
                Fill it in manually
              </button>
              <button type="button" onClick={() => setIsPhModalOpen(true)} className="text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200">
                Import from Product Hunt
              </button>
            </div>
          </div>
        )}

        {stage === 'loading' && <ImportTerminal url={importUrl} />}

        {stage === 'form' && (
          <div id="form-container">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange-400">Launch</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">Review your launch</h1>
            {importState === 'done' ? (
              <p className="mt-3 rounded-xl border border-green-500/30 bg-green-500/[0.06] px-3.5 py-2.5 font-mono text-xs text-green-300">
                ✓ filled in from {importUrl.replace(/^https?:\/\//i, '')} - check everything, then submit
              </p>
            ) : importState === 'error' ? (
              <p className="mt-3 rounded-xl border border-slate-700 px-3.5 py-2.5 text-sm text-slate-400">{importError}</p>
            ) : (
              <p className="mt-3 text-slate-400">Tell developers what you built. You&apos;ll pick the launch date next.</p>
            )}
            <form onSubmit={handleSubmit(onSubmit as () => void)} className="mt-10 space-y-12">
              <FormStep n="01" title="The basics">
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
              </FormStep>
              <FormStep n="02" title="Pricing & categories">
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
              </FormStep>
              <FormStep n="03" title="Media">
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
              </FormStep>
              <div>
                <Button
                  id="submit-btn"
                  type="submit"
                  isLoad={isLaunching}
                  className="w-full rounded-2xl py-3.5 hover:bg-orange-400 ring-offset-2 ring-orange-500 focus:ring"
                >
                  Submit and pick a launch date
                </Button>
                <p className="mt-2 text-center font-mono text-xs text-slate-600">you can edit everything later</p>
              </div>
            </form>
          </div>
        )}
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
