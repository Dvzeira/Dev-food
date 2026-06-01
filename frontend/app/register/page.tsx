'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Flame, Eye, EyeOff, ArrowRight, ShoppingBag, LayoutDashboard } from 'lucide-react';

const schema = z
  .object({
    name: z.string().min(2, 'Mínimo de 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['CUSTOMER', 'ADMIN']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setAuth(res.data.access_token, res.data.user);
      router.push(data.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erro ao criar conta. Tente novamente.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-600/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Criar conta</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Junte-se ao Dev Food</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm p-7">
          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Tipo de conta
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'CUSTOMER', label: 'Cliente', sub: 'Fazer pedidos', Icon: ShoppingBag },
                  { value: 'ADMIN', label: 'Admin', sub: 'Gerenciar loja', Icon: LayoutDashboard },
                ].map(({ value, label, sub, Icon }) => (
                  <label
                    key={value}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                        : 'border-stone-200 dark:border-neutral-700 hover:border-stone-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <input
                      {...register('role')}
                      type="radio"
                      value={value}
                      className="sr-only"
                    />
                    <Icon
                      className={`w-6 h-6 ${
                        selectedRole === value ? 'text-red-600 dark:text-red-400' : 'text-stone-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        selectedRole === value ? 'text-red-700 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-neutral-500">{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Nome completo
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Seu nome"
                className="w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className="w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 pr-11 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Confirmar senha
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repita a senha"
                className="w-full border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-5">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-red-600 dark:text-red-400 font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
