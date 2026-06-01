'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { Search, Flame, Clock, Star } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  imageUrl?: string;
  isAvailable: boolean;
  category?: Category;
}

const PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E")`;

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedCategory ? { categoryId: selectedCategory } : {};
    api
      .get('/products', { params })
      .then((r) => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: `${PATTERN}, linear-gradient(to bottom right, #dc2626, #dc2626, #b91c1c)` }}
      >
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 mb-5">
              <Flame className="w-3.5 h-3.5" />
              Entrega em até 40 minutos
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
              Peça sua comida{' '}
              <span className="italic text-red-100">favorita</span>
            </h1>
            <p className="text-red-100 text-base mb-7">
              Entrega rápida e saborosa na sua porta
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar pratos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 text-stone-900 dark:text-stone-100 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-xl shadow-red-900/20"
              />
            </div>

            <div className="flex items-center gap-6 mt-5 text-white/70 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>4.8 avaliação</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>30–40 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              Categorias
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === null
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'bg-white dark:bg-neutral-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                      : 'bg-white dark:bg-neutral-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Products heading */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name ?? 'Produtos'
              : 'Todos os pratos'}
          </h2>
          {!loading && (
            <span className="text-sm text-stone-400 dark:text-neutral-500">
              {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 skeleton rounded-lg w-3/4" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                  <div className="h-3 skeleton rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg font-medium text-stone-600 dark:text-stone-400">
              Nenhum produto encontrado
            </p>
            {search && (
              <p className="text-sm text-stone-400 dark:text-neutral-500 mt-1">
                Tente outro termo de busca
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
