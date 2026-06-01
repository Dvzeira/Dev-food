'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, Package, ImageOff, ToggleLeft, ToggleRight } from 'lucide-react';

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description?: string;
  price: number | string; imageUrl?: string;
  isAvailable: boolean; categoryId?: string; category?: Category;
}

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  price: z.number({ error: 'Preço inválido' }).positive('Deve ser positivo'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  categoryId: z.string().optional(),
  isAvailable: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-scale-in border border-stone-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const isAvailable = watch('isAvailable');

  useEffect(() => {
    Promise.all([
      api.get('/products').then((r) => setProducts(r.data)),
      api.get('/categories').then((r) => setCategories(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', price: undefined, imageUrl: '', categoryId: '', isAvailable: true });
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    reset({ name: p.name, description: p.description ?? '', price: Number(p.price), imageUrl: p.imageUrl ?? '', categoryId: p.categoryId ?? '', isAvailable: p.isAvailable });
    setServerError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const payload = {
      name: data.name, price: data.price, isAvailable: data.isAvailable,
      ...(data.description ? { description: data.description } : {}),
      ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
    };
    try {
      if (editing) {
        const res = await api.patch(`/products/${editing.id}`, payload);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? res.data : p)));
      } else {
        const res = await api.post('/products', payload);
        setProducts((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar produto.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch { alert('Erro ao excluir produto.'); }
    finally { setDeletingId(null); }
  };

  const displayed = filterCategory ? products.filter((p) => p.categoryId === filterCategory) : products;

  return (
    <div className="max-w-6xl mx-auto px-4 py-7 animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Produtos</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{displayed.length} produto(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-red-600/25">
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${!filterCategory ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'}`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(filterCategory === c.id ? '' : c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${filterCategory === c.id ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' : 'bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 h-52 skeleton" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-stone-300 dark:text-neutral-600" />
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Nenhum produto cadastrado</p>
          <button onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm mt-2 hover:underline font-medium">
            Criar primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((product) => (
            <div
              key={product.id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow ${!product.isAvailable ? 'opacity-60' : ''}`}
            >
              <div className="relative h-36 bg-stone-100 dark:bg-neutral-800">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-neutral-600">
                    <ImageOff className="w-9 h-9" />
                  </div>
                )}
                {!product.isAvailable && (
                  <span className="absolute top-2 left-2 bg-neutral-800/70 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Indisponível
                  </span>
                )}
                {product.category && (
                  <span className="absolute top-2 right-2 bg-white/90 dark:bg-neutral-900/90 text-stone-600 dark:text-stone-300 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {product.category.name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">{product.description}</p>
                    )}
                    <p className="text-red-600 dark:text-red-400 font-bold mt-1.5">
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-stone-400 hover:text-red-500 disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Editar produto' : 'Novo produto'} onClose={closeModal}>
          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Nome *</label>
              <input {...register('name')} placeholder="Ex: Pizza Margherita" className={inputCls} />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Descrição</label>
              <textarea {...register('description')} rows={2} placeholder="Descrição do produto" className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Preço (R$) *</label>
              <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
              {errors.price && <p className="text-red-500 text-xs mt-1.5">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Categoria</label>
              <select {...register('categoryId')} className={`${inputCls} appearance-none`}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">URL da imagem</label>
              <input {...register('imageUrl')} placeholder="https://..." className={inputCls} />
              {errors.imageUrl && <p className="text-red-500 text-xs mt-1.5">{errors.imageUrl.message}</p>}
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Disponível</p>
                <p className="text-xs text-stone-400 dark:text-neutral-500">Exibir no cardápio</p>
              </div>
              <button type="button" onClick={() => setValue('isAvailable', !isAvailable)} className="text-stone-400 hover:text-red-600 dark:hover:text-red-400">
                {isAvailable ? <ToggleRight className="w-8 h-8 text-red-600 dark:text-red-400" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeModal} className="flex-1 border border-stone-300 dark:border-neutral-700 text-stone-700 dark:text-stone-300 py-3 rounded-xl text-sm font-semibold hover:bg-stone-50 dark:hover:bg-neutral-800">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60 shadow-sm shadow-red-600/20">
                {isSubmitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
