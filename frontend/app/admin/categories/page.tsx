'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-stone-200 dark:border-neutral-800">
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', imageUrl: '' });
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    reset({ name: cat.name, description: cat.description ?? '', imageUrl: cat.imageUrl ?? '' });
    setServerError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const payload = {
      name: data.name,
      ...(data.description ? { description: data.description } : {}),
      ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
    };
    try {
      if (editing) {
        const res = await api.patch(`/categories/${editing.id}`, payload);
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? res.data : c)));
      } else {
        const res = await api.post('/categories', payload);
        setCategories((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar categoria.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch { alert('Erro ao excluir categoria.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-7 animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Categorias</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{categories.length} categoria(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-red-600/25"
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 h-24 skeleton" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-7 h-7 text-stone-300 dark:text-neutral-600" />
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Nenhuma categoria cadastrada</p>
          <button onClick={openCreate} className="text-red-600 dark:text-red-400 text-sm mt-2 hover:underline font-medium">
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-red-400 dark:text-red-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{cat.description}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat.id)} disabled={deletingId === cat.id} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-stone-400 hover:text-red-500 disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={closeModal}>
          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Nome *</label>
              <input {...register('name')} placeholder="Ex: Pizzas" className={inputCls} />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Descrição</label>
              <input {...register('description')} placeholder="Descrição opcional" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">URL da imagem</label>
              <input {...register('imageUrl')} placeholder="https://..." className={inputCls} />
              {errors.imageUrl && <p className="text-red-500 text-xs mt-1.5">{errors.imageUrl.message}</p>}
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
