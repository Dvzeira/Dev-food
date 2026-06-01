'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ClipboardList, Clock, RefreshCw, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: { id: string; name: string } | null;
}

interface Order {
  id: string;
  status: string;
  totalPrice: number | string;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PREPARING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function StatusBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  if (status === 'CANCELLED') {
    return (
      <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-3">
        Pedido cancelado
      </p>
    );
  }
  return (
    <div className="flex gap-1 mt-3">
      {STATUS_STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i <= idx ? 'bg-red-500 dark:bg-red-400' : 'bg-stone-200 dark:bg-neutral-700'
          }`}
        />
      ))}
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const { user, init } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { init(); }, [init]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(interval);
  }, [user, fetchOrders, router]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          Meus Pedidos
        </h1>
        <button
          onClick={() => fetchOrders(false)}
          className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin-slow' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 h-44 skeleton" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-stone-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-9 h-9 text-stone-300 dark:text-neutral-600" />
          </div>
          <p className="text-lg font-medium text-stone-600 dark:text-stone-400">
            Nenhum pedido ainda
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm mt-3 font-medium hover:underline"
          >
            Ver cardápio
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 ${
                highlight === order.id
                  ? 'border-red-400 dark:border-red-600 ring-2 ring-red-400/30 dark:ring-red-600/30 shadow-lg'
                  : 'border-stone-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-50 text-sm">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-stone-600 dark:text-stone-400">
                    <span>
                      {item.product?.name ?? 'Produto removido'}{' '}
                      <span className="text-stone-400 dark:text-neutral-500">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-neutral-800 text-sm">
                <p className="text-stone-400 dark:text-neutral-500 truncate max-w-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {order.deliveryAddress}
                </p>
                <p className="font-bold text-red-600 dark:text-red-400 flex-shrink-0 ml-3">
                  R$ {Number(order.totalPrice).toFixed(2)}
                </p>
              </div>

              <StatusBar status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
