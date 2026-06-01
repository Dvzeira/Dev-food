'use client';

import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, total } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleCheckout = () => {
    if (!user) {
      toggleCart();
      router.push('/login');
      return;
    }
    toggleCart();
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={toggleCart}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-neutral-900 z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-red-600" />
            Meu Carrinho
            {items.length > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                {items.reduce((s, i) => s + i.quantity, 0)} itens
              </span>
            )}
          </h2>
          <button
            onClick={toggleCart}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-20 h-20 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-9 h-9 text-stone-300 dark:text-neutral-600" />
            </div>
            <div>
              <p className="font-medium text-stone-700 dark:text-stone-300">Carrinho vazio</p>
              <p className="text-sm text-stone-400 dark:text-neutral-500 mt-1">
                Adicione itens do cardápio
              </p>
            </div>
            <button
              onClick={toggleCart}
              className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline"
            >
              Ver cardápio →
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 bg-stone-50 dark:bg-neutral-800 rounded-xl"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-red-600 dark:text-red-400 font-bold text-sm mt-0.5">
                      R$ {item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-stone-300 dark:border-neutral-600 flex items-center justify-center hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center text-stone-900 dark:text-stone-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-stone-300 dark:border-neutral-600 flex items-center justify-center hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto p-1 text-stone-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-4 border-t border-stone-200 dark:border-neutral-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 dark:text-stone-400 text-sm">Total</span>
                <span className="font-bold text-xl text-stone-900 dark:text-stone-50">
                  R$ {total().toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                Finalizar Pedido
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
