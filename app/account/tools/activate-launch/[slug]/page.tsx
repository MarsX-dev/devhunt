'use client';

import { useEffect, useState, useCallback } from 'react';
import PaymentForm from '@/components/ui/PaymentForm';
import { createBrowserClient } from '@/utils/supabase/browser';
import ProductsService from '@/utils/supabase/services/products';
import { useRouter } from 'next/navigation';
import { IconLoading } from '@/components/Icons';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default ({ params: { slug } }: { params: { slug: string } }) => {
  const [toolName, setToolName] = useState<string>('');
  const [id, setId] = useState<number>();
  const [userEmail, setEmail] = useState<string>('');
  const [isPaymentFormActive, setPaymentFormActive] = useState<boolean>(false);
  const [isPaid, setPaid] = useState<boolean>(false);
  const [isDone, setDone] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle payment form submission message
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'submission') {
        if (
          e.origin === 'https://app.rapidforms.co' &&
          e.data.data.completed &&
          e.data.data.url.includes('https://app.rapidforms.co/embed/9365a8')
        ) {
          // Set a session storage flag to indicate payment was completed
          sessionStorage.setItem(`payment-completed-${slug}`, 'true');
          setDone(true);
        }
      }
    };

    window.addEventListener('message', handleMessage, false);

    // Check if payment was already completed in this session
    const paymentCompleted = sessionStorage.getItem(`payment-completed-${slug}`);
    if (paymentCompleted === 'true') {
      setDone(true);
    }

    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  }, [slug]);

  // Update product payment status when payment is completed
  useEffect(() => {
    const updateProductPaymentStatus = async () => {
      if (!isDone || !id) return;

      try {
        const launchData = localStorage.getItem('paid-launch-date');
        if (!launchData) {
          setError('Launch date information is missing. Please try again.');
          return;
        }

        const parsedLaunchData = JSON.parse(launchData);
        const supabaseBrowserClient = createBrowserClient();
        const productsService = new ProductsService(supabaseBrowserClient);

        await productsService.update(id, {
          isPaid: true,
          launch_start: parsedLaunchData.startDate,
          launch_date: parsedLaunchData.startDate,
          launch_end: parsedLaunchData.endDate,
          week: parsedLaunchData.week,
        });

        // Store payment status in localStorage to persist across page refreshes
        localStorage.setItem(`product-paid-${slug}`, 'true');
        setPaid(true);
        setPaymentFormActive(false);
      } catch (err) {
        console.error('Error updating product payment status:', err);
        setError('Failed to update payment status. Please contact support.');
      }
    };

    updateProductPaymentStatus();
  }, [isDone, id, slug]);

  // Fetch tool information and check payment status
  const getTool = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabaseBrowserClient = createBrowserClient();
      const productsService = new ProductsService(supabaseBrowserClient);
      const product = await productsService.getBySlug(slug, true);

      if (!product) {
        setError('Product not found');
        setIsLoading(false);
        return;
      }

      setId(product.id);
      setToolName(product.name as string);

      const supabase = createClientComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email as string);

      // Check if product is already paid in database
      if (product.isPaid) {
        setPaid(true);
        setPaymentFormActive(false);
        router.push('/account/tools');
        return;
      }

      // Check if we have a local record of payment
      const localPaymentStatus = localStorage.getItem(`product-paid-${slug}`);
      if (localPaymentStatus === 'true') {
        // Double-check with the database since local storage could be manipulated
        const refreshedProduct = await productsService.getBySlug(slug, false);
        if (refreshedProduct?.isPaid) {
          setPaid(true);
          setPaymentFormActive(false);
          router.push('/account/tools');
          return;
        }
      }

      // If we reach here, payment is needed
      setPaymentFormActive(true);
    } catch (err) {
      console.error('Error fetching tool:', err);
      setError('Failed to load tool information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    getTool();
  }, [getTool]);

  return (
    <section className="px-4">
      {error && (
        <div className="py-12 mt-8 text-center">
          <div className="mb-4 inline-block rounded-full p-3 bg-gradient-to-br from-red-400 to-red-600">
            <span className="h-12 w-12 text-white text-xl">!</span>
          </div>
          <h2 className="mb-3 text-xl font-bold text-white">Error</h2>
          <p className="mb-8 text-slate-300">{error}</p>
          <button
            onClick={() => getTool()}
            className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && isLoading && (
        <div className="py-24 mt-8 text-center">
          <IconLoading className="mx-auto text-orange-500 w-8 h-8" />
          <h1 className="text-xl text-white mt-6">Checking Your Tool...</h1>
        </div>
      )}

      {!error && !isLoading && isPaid && (
        <div className="text-center max-w-sm mx-auto py-24 mt-8">
          <div className="mb-4 inline-block rounded-full p-3 bg-gradient-to-br from-green-400 to-green-600">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Launch Activated Successfully!</h2>
          <p className="mb-8 text-slate-300">Your tool launch on DevHunt has been activated successfully.</p>
          <Link
            href="/account/tools"
            className="w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      <PaymentForm isActive={isPaymentFormActive} toolName={toolName} email={userEmail} />
    </section>
  );
};
