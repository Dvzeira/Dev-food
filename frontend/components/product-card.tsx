'use client';

import { Plus, ImageOff } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  imageUrl?: string;
  isAvailable: boolean;
  category?: { id: string; name: string };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const price = Number(product.price);

  return (
    <div className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-neutral-800 hover:shadow-xl hover:shadow-stone-200/60 dark:hover:shadow-black/40 hover:-translate-y-0.5 flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-stone-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-stone-300 dark:text-neutral-600" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-stone-700 dark:text-stone-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/50 dark:border-neutral-700/50">
            {product.category.name}
          </span>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50 leading-tight">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mt-1 flex-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-neutral-800">
          <span className="text-red-600 dark:text-red-400 font-bold text-lg">
            R$ {price.toFixed(2)}
          </span>
          <button
            disabled={!product.isAvailable}
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                price,
                imageUrl: product.imageUrl,
              })
            }
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm shadow-red-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
