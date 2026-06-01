'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Clock, RefreshCw, ChevronDown, MapPin } from 'lucide-react';

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
  customer: { id: string; name: string; email: string } | null;
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

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/40',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/40',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/40',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40',
};

const STATUS_CARD: Record<string, string> = {
  PENDING: 'text-amber-700 dark:text-amber-400',
  CONFIRMED: 'text-blue-700 dark:text-blue-400',
  PREPARING: 'text-orange-700 dark:text-orange-400',
  OUT_FOR_DELIVERY: 'text-violet-700 dark:text-violet-400',
  DELIVERED: 'text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'text-red-700 dark:text-red-400',
};

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params = filter !== 'Todos' ? { status: filter } : {};
      const res = await api.get('/orders', { params });
      setOrders(res.data);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 20000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch {
      alert('Erro ao atualizar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-7 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            Painel de Pedidos
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {orders.length} pedido(s) encontrado(s)
          </p>
        </div>
        <button
          onClick={() => fetchOrders(false)}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 hover:bg-stone-50 dark:hover:bg-neutral-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin-slow' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-7">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? 'Todos' : s)}
            className={`rounded-2xl border p-3.5 text-left transition-all hover:shadow-md ${
              filter === s
                ? `${STATUS_BADGE[s]} ring-2 ring-offset-1 ring-offset-stone-50 dark:ring-offset-neutral-950`
                : 'bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-700'
            }`}
          >
            <p className={`text-2xl font-bold ${filter === s ? '' : STATUS_CARD[s]}`}>
              {counts[s] ?? 0}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-tight">
              {STATUS_LABELS[s]}
            </p>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['Todos', ...ALL_STATUSES].map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === opt
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'bg-white dark:bg-neutral-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-600'
            }`}
          >
            {opt === 'Todos' ? 'Todos' : STATUS_LABELS[opt]}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 h-36 skeleton" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-stone-400 dark:text-neutral-500">
          <p className="font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start gap-3 justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-stone-900 dark:text-stone-50 text-sm">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </span>
                    {order.customer && (
                      <span className="text-stone-500 dark:text-stone-400 font-medium">
                        · {order.customer.name}
                      </span>
                    )}
                  </p>
                </div>

                {/* Status selector */}
                <div className="relative">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-stone-200 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-800 text-stone-700 dark:text-stone-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Items */}
              <div className="grid sm:grid-cols-2 gap-1.5 mb-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-neutral-800 rounded-lg px-3 py-2"
                  >
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

              <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-neutral-800 text-sm">
                <p className="text-stone-400 dark:text-neutral-500 truncate max-w-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {order.deliveryAddress}
                </p>
                <p className="font-bold text-red-600 dark:text-red-400 flex-shrink-0 ml-3">
                  R$ {Number(order.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
