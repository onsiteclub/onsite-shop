'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface OrderItem {
  sku?: string;
  name?: string;
  qty?: number;
  price?: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string | null;
  items: OrderItem[];
  total: number;
  shipping_cost: number;
  shipping_address: { name?: string } | null;
  created_at: string;
  shipped_at: string | null;
}

// ============================================
// HELPERS
// ============================================

const REPORTABLE_STATUSES = ['shipped', 'delivered', 'archived'];

const fmtMoney = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

const fmtDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

const itemCount = (order: Order) =>
  order.items.reduce((sum, i) => sum + (i.qty || 1), 0);

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'paid';
  const known = ['paid', 'processing', 'shipped', 'delivered', 'archived'];
  if (known.includes(status)) return status;
  if (status === 'pending') return 'paid';
  if (status === 'ready_to_ship' || status === 'out_of_stock') return 'processing';
  if (status === 'cancelled') return 'archived';
  return 'paid';
}

// ============================================
// PAGE
// ============================================

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRow) { setLoading(false); return; }
      setIsAdmin(true);

      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, email, items, total, shipping_cost, shipping_address, created_at, shipped_at, archived_at')
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data.map((row: any) => {
          const base = normalizeStatus(row.status);
          const effective = (base === 'delivered' && row.archived_at) ? 'archived' : base;
          return { ...row, status: effective };
        }));
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter orders by date range + reportable statuses
  const reportOrders = orders.filter(order => {
    if (!REPORTABLE_STATUSES.includes(order.status)) return false;
    const orderDate = order.shipped_at || order.created_at;
    const d = new Date(orderDate).toISOString().split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const totals = reportOrders.reduce(
    (acc, o) => ({
      count: acc.count + 1,
      subtotal: acc.subtotal + (o.total - o.shipping_cost),
      shipping: acc.shipping + o.shipping_cost,
      total: acc.total + o.total,
    }),
    { count: 0, subtotal: 0, shipping: 0, total: 0 }
  );

  // ---- Loading / Auth ----

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          <p className="font-display text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-warm-200/60">
          <h1 className="font-display text-xl font-bold text-text-primary mb-2">Access Restricted</h1>
          <p className="font-body text-sm text-text-secondary mb-6">Please login as an administrator.</p>
          <a href="/admin" className="py-2.5 px-6 bg-amber hover:bg-amber-dark text-charcoal-deep font-display text-sm font-bold rounded-xl transition-colors inline-block">Go to Admin</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          Reports
        </h1>
        <p className="font-body text-sm text-text-secondary mt-0.5">
          Revenue from shipped &amp; delivered orders.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary mb-1">Orders</p>
          <p className="font-display text-2xl font-bold text-text-primary">{totals.count}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary mb-1">Subtotal</p>
          <p className="font-display text-2xl font-bold text-text-primary">{fmtMoney(totals.subtotal)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary mb-1">Shipping</p>
          <p className="font-display text-2xl font-bold text-text-primary">{fmtMoney(totals.shipping)}</p>
        </div>
        <div className="bg-amber-light rounded-xl p-4 shadow-sm border border-amber/30">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-amber-dark mb-1">Revenue</p>
          <p className="font-display text-2xl font-bold text-amber-dark">{fmtMoney(totals.total)}</p>
        </div>
      </div>

      {/* Date range picker */}
      <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm border border-warm-200/60">
        <div>
          <label className="font-display text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-warm-200 font-display text-sm focus:outline-none focus:border-warm-400"
          />
        </div>
        <div>
          <label className="font-display text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-warm-200 font-display text-sm focus:outline-none focus:border-warm-400"
          />
        </div>
        <p className="font-body text-xs text-text-secondary">
          Showing shipped / delivered orders in this period
        </p>
      </div>

      {/* Table */}
      {reportOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-text-secondary">No orders in this period.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-warm-200/60">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200/60">
                  <th className="text-left font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Order</th>
                  <th className="text-left font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Date</th>
                  <th className="text-left font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Customer</th>
                  <th className="text-right font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Items</th>
                  <th className="text-right font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Subtotal</th>
                  <th className="text-right font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Shipping</th>
                  <th className="text-right font-display text-[10px] font-bold uppercase tracking-wide text-text-secondary px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportOrders.map(order => (
                  <tr key={order.id} className="border-b border-warm-100 hover:bg-warm-100/50 transition-colors">
                    <td className="font-display text-sm px-4 py-3 font-bold text-text-primary">{order.order_number}</td>
                    <td className="font-body text-xs px-4 py-3 text-text-secondary">
                      {fmtDateFull(order.shipped_at || order.created_at)}
                    </td>
                    <td className="font-body text-xs px-4 py-3 text-text-primary">
                      {order.shipping_address?.name || order.email || '—'}
                    </td>
                    <td className="font-body text-xs px-4 py-3 text-right text-text-secondary">{itemCount(order)}</td>
                    <td className="font-display text-sm px-4 py-3 text-right">{fmtMoney(order.total - order.shipping_cost)}</td>
                    <td className="font-display text-sm px-4 py-3 text-right">{fmtMoney(order.shipping_cost)}</td>
                    <td className="font-display text-sm px-4 py-3 text-right font-bold">{fmtMoney(order.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-charcoal-deep text-white">
                  <td className="font-display text-sm px-4 py-3 rounded-bl-xl" colSpan={3}>
                    Total — {totals.count} order{totals.count !== 1 ? 's' : ''}
                  </td>
                  <td className="font-display text-xs px-4 py-3 text-right">
                    {reportOrders.reduce((s, o) => s + itemCount(o), 0)}
                  </td>
                  <td className="font-display text-sm px-4 py-3 text-right">{fmtMoney(totals.subtotal)}</td>
                  <td className="font-display text-sm px-4 py-3 text-right">{fmtMoney(totals.shipping)}</td>
                  <td className="font-display text-sm px-4 py-3 text-right font-bold text-amber rounded-br-xl">{fmtMoney(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
