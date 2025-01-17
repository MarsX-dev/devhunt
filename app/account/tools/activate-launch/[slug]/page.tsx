'use client';

import { useEffect, useState } from 'react';
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
  const router = useRouter();

  useEffect(() => {
    window.addEventListener(
      'message',
      e => {
        if (e.data.type == 'submission') {
          if (
            e.origin == 'https://app.rapidforms.co' &&
            e.data.data.completed &&
            e.data.data.url.includes('https://app.rapidforms.co/embed/9365a8')
          ) {
            setDone(true);
          }
        }
      },
      false,
    );
  }, []);

  useEffect(() => {
    if (isDone) {
      const supabaseBrowserClient = createBrowserClient();
      const productsService = new ProductsService(supabaseBrowserClient);
      productsService
        .update(id as number, {
          isPaid: true,
        })
        .then(() => {
          setPaid(true);
          setPaymentFormActive(false);
        });
    }
  }, [isDone]);

  useEffect(() => {
    getTool();
  }, [slug]);

  async function getTool() {
    const supabaseBrowserClient = createBrowserClient();

    const productsService = new ProductsService(supabaseBrowserClient);
    const product = await productsService.getBySlug(slug, true);
    setId(product?.id);
    setToolName(product?.name as string);

    const supabase = createClientComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setEmail(user?.email as string);

    if (!product?.isPaid) {
      setPaymentFormActive(true);
    } else router.push('/account/tools');
  }

  return (
    <section className="px-4">
      {!isPaid ? (
        <div className="py-24 mt-8 text-center">
          <IconLoading className="mx-auto text-orange-500 w-8 h-8" />
          <h1 className="text-xl text-white mt-6">Checking Your Tool...</h1>
        </div>
      ) : (
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
