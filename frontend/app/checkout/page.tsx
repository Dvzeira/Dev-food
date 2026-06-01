'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { MapPin, ShoppingBag, ArrowLeft, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  deliveryAddress: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { user, init } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (submittingRef.current) return;
    if (!user) router.push('/login');
    else if (items.length === 0) router.push('/');
  }, [user, items, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    submittingRef.current = true;
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: data.deliveryAddress,
      };
      const res = await api.post('/orders', payload);
      clearCart();
      router.push(`/orders?highlight=${res.data.id}`);
    } catch (err: unknown) {
      submittingRef.current = false;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erro ao fazer pedido. Tente novamente.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm mb-7 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao cardápio
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-7 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        Finalizar Pedido
      </h1>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
          {serverError}
        </div>
      )}

      {/* Order summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-5 mb-5">
        <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-stone-400" />
          Resumo do pedido
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <span className="text-stone-700 dark:text-stone-300">
                  {item.name}{' '}
                  <span className="text-stone-400 dark:text-neutral-500">×{item.quantity}</span>
                </span>
              </div>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 dark:border-neutral-800 mt-4 pt-4 flex justify-between items-center">
          <span className="font-semibold text-stone-700 dark:text-stone-300">Total</span>
          <span className="font-bold text-xl text-red-600 dark:text-red-400">
            R$ {total().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Delivery address */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-5"
      >
        <h2 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
          Endereço de entrega
        </h2>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Endereço completo
          </label>
          <textarea
            {...register('deliveryAddress')}
            rows={3}
            placeholder="Rua, número, complemento, bairro, cidade..."
            className="w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
          {errors.deliveryAddress && (
            <p className="text-red-500 text-xs mt-1.5">{errors.deliveryAddress.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Confirmando pedido...
            </>
          ) : (
            <>
              Confirmar pedido · R$ {total().toFixed(2)}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
