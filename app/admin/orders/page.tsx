'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_address: {
    name?: string;
    street?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  } | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  user_id: string | null;
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkAdminAndLoadOrders();
  }, []);

  async function checkAdminAndLoadOrders() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', data.user.email)
      .single();

    if (admin) {
      setIsAdmin(true);
      await loadOrders();
    }

    setLoading(false);
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from('app_shop_orders')
      .select(`
        *,
        app_shop_order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setOrders(data || []);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const updateData: any = { status: newStatus };

    if (newStatus === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    } else if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('app_shop_orders')
      .update(updateData)
      .eq('id', orderId);

    if (!error) {
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-[#1B2B27]/60">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-4">
            Acesso Restrito
          </h1>
          <p className="font-mono text-[#1B2B27]/70 mb-6">
            Faça login como administrador.
          </p>
          <Link href="/admin" className="btn-accent">
            Ir para Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#1B2B27] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-mono text-sm text-white/60 hover:text-white flex items-center gap-1"
            >
              ← Admin
            </Link>
            <span className="font-mono text-sm text-white/40">|</span>
            <h1 className="font-mono text-sm font-medium text-white">
              Pedidos ({orders.length})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-mono text-xs whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-[#1B2B27] text-white'
                  : 'bg-white/80 text-[#1B2B27]/70 hover:bg-white'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusLabel(status)}
              {status !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({orders.filter(o => o.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-[#1B2B27]/60">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-[#1B2B27]">
                        {order.order_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#1B2B27]/60 space-y-1">
                      <p>Criado: {formatDate(order.created_at)}</p>
                      {order.paid_at && <p>Pago: {formatDate(order.paid_at)}</p>}
                      {order.shipping_address?.name && (
                        <p>Cliente: {order.shipping_address.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-[#1B2B27]">
                      CA${order.total.toFixed(2)}
                    </p>
                    <p className="font-mono text-xs text-[#1B2B27]/60">
                      {order.order_items?.length || 0} item(s)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="font-mono text-lg font-bold text-[#1B2B27]">
                  {selectedOrder.order_number}
                </h2>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono mt-1 ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Status Actions */}
              <div>
                <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Atualizar Status:</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                        selectedOrder.status === status
                          ? 'bg-[#1B2B27] text-white'
                          : 'bg-gray-100 text-[#1B2B27]/70 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Itens do Pedido:</p>
                <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-sm text-[#1B2B27]">{item.product_name}</p>
                        <p className="font-mono text-xs text-[#1B2B27]/60">
                          {item.size && `Tamanho: ${item.size}`}
                          {item.size && item.color && ' | '}
                          {item.color && `Cor: ${item.color}`}
                        </p>
                        <p className="font-mono text-xs text-[#1B2B27]/60">
                          Qtd: {item.quantity} × CA${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-medium text-[#1B2B27]">
                        CA${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Resumo:</p>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-[#1B2B27]/70">Subtotal</span>
                    <span>CA${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-[#1B2B27]/70">Frete</span>
                    <span>CA${selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-[#1B2B27]/70">Impostos</span>
                      <span>CA${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-mono text-lg font-bold">
                    <span>Total</span>
                    <span>CA${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Endereço de Entrega:</p>
                  <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-[#1B2B27]">
                    <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                    <p>{selectedOrder.shipping_address.street}</p>
                    {selectedOrder.shipping_address.apartment && (
                      <p>{selectedOrder.shipping_address.apartment}</p>
                    )}
                    <p>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province}
                    </p>
                    <p>
                      {selectedOrder.shipping_address.postal_code}, {selectedOrder.shipping_address.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Stripe Info */}
              <div>
                <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Informações Stripe:</p>
                <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-[#1B2B27]/70 space-y-1">
                  {selectedOrder.stripe_session_id && (
                    <p className="break-all">
                      <span className="text-[#1B2B27]">Session:</span> {selectedOrder.stripe_session_id}
                    </p>
                  )}
                  {selectedOrder.stripe_payment_intent_id && (
                    <p className="break-all">
                      <span className="text-[#1B2B27]">Payment Intent:</span> {selectedOrder.stripe_payment_intent_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="font-mono text-xs text-[#1B2B27]/60 mb-2">Datas:</p>
                <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-[#1B2B27]/70 space-y-1">
                  <p>Criado: {formatDate(selectedOrder.created_at)}</p>
                  {selectedOrder.paid_at && <p>Pago: {formatDate(selectedOrder.paid_at)}</p>}
                  {selectedOrder.cancelled_at && <p>Cancelado: {formatDate(selectedOrder.cancelled_at)}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
