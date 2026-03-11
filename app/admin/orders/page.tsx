'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface OrderItem {
  sku?: string;
  name?: string;
  design?: string;
  color?: string;
  size?: string;
  qty?: number;
  price?: number;
  image?: string | null;
}

interface ShippingAddress {
  name?: string;
  street?: string;
  apartment?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string | null;
  items: OrderItem[];
  total: number;
  shipping_cost: number;
  shipping_address: ShippingAddress | null;
  customer_notes: string | null;
  staff_notes: string | null;
  tracking_code: string | null;
  stripe_session_id: string | null;
  created_at: string;
  processing_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  archived_at: string | null;
}

// ============================================
// STATUS CONFIG — simplified linear flow
// ============================================

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:       { label: 'Paid',       color: 'text-green-800',  bg: 'bg-green-100' },
  processing: { label: 'Processing', color: 'text-yellow-800', bg: 'bg-yellow-100' },
  shipped:    { label: 'Shipped',    color: 'text-blue-800',   bg: 'bg-blue-100' },
  delivered:  { label: 'Delivered',  color: 'text-purple-800', bg: 'bg-purple-100' },
  archived:   { label: 'Archived',   color: 'text-gray-600',   bg: 'bg-gray-100' },
};

const KNOWN_STATUSES = Object.keys(STATUS_META);
const ACTIVE_STATUSES = ['paid', 'processing', 'shipped'];
const COMPLETED_STATUSES = ['delivered'];

const TIMELINE_STEPS = [
  { key: 'paid',       label: 'Paid',       dateField: 'created_at' },
  { key: 'processing', label: 'Processing', dateField: 'processing_at' },
  { key: 'shipped',    label: 'Shipped',    dateField: 'shipped_at' },
  { key: 'delivered',  label: 'Delivered',  dateField: 'delivered_at' },
] as const;

const STATUS_ORDER: Record<string, number> = {
  paid: 0, processing: 1, shipped: 2, delivered: 3, archived: 3,
};

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'paid';
  if (KNOWN_STATUSES.includes(status)) return status;
  // Legacy statuses
  if (status === 'pending') return 'paid';
  if (status === 'ready_to_ship' || status === 'out_of_stock') return 'processing';
  if (status === 'cancelled') return 'archived';
  return 'paid';
}

function sc(status: string) {
  return STATUS_META[status] || STATUS_META.paid;
}

// ============================================
// HELPERS
// ============================================

function normalizeOrder(row: any): Order {
  const baseStatus = normalizeStatus(row.status);
  // Archived is derived: delivered + archived_at set
  const effectiveStatus = (baseStatus === 'delivered' && row.archived_at) ? 'archived' : baseStatus;

  return {
    id: row.id,
    order_number: row.order_number || 'Unknown',
    status: effectiveStatus,
    email: row.email || null,
    items: Array.isArray(row.items) ? row.items : [],
    total: typeof row.total === 'number' ? row.total : 0,
    shipping_cost: typeof row.shipping_cost === 'number' ? row.shipping_cost : 0,
    shipping_address: row.shipping_address && typeof row.shipping_address === 'object' ? row.shipping_address : null,
    customer_notes: row.customer_notes || null,
    staff_notes: row.staff_notes || null,
    tracking_code: row.tracking_code || null,
    stripe_session_id: row.stripe_session_id || null,
    created_at: row.created_at || new Date().toISOString(),
    processing_at: row.processing_at || null,
    shipped_at: row.shipped_at || null,
    delivered_at: row.delivered_at || null,
    archived_at: row.archived_at || null,
  };
}

const fmtMoney = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

const fmtDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

const itemCount = (order: Order) =>
  order.items.reduce((sum, i) => sum + (i.qty || 1), 0);

// ============================================
// TIMELINE COMPONENT
// ============================================

function OrderTimeline({ order }: { order: Order }) {
  const currentIdx = STATUS_ORDER[order.status] ?? 0;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-1">
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const dateValue = (order as any)[step.dateField] as string | null;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center w-full mb-2">
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 ${isCompleted || isCurrent ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-amber-400 text-white ring-4 ring-amber-100'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
              <p className={`font-mono text-xs font-medium ${
                isCurrent ? 'text-amber-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              <p className="font-mono text-[10px] text-gray-400 mt-0.5 h-4">
                {dateValue ? fmtDateShort(dateValue) : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>('active');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal editable fields
  const [editStaffNotes, setEditStaffNotes] = useState('');
  const [editTrackingCode, setEditTrackingCode] = useState('');

  // Reports
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first of current month
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const supabase = createClient();

  // ---- Init ----

  useEffect(() => { checkAdminAndLoadOrders(); }, []);

  useEffect(() => {
    if (selectedOrder) {
      setEditStaffNotes(selectedOrder.staff_notes || '');
      setEditTrackingCode(selectedOrder.tracking_code || '');
    }
  }, [selectedOrder?.id]);

  // ---- Data ----

  async function checkAdminAndLoadOrders() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setLoading(false); return; }

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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setOrders((data || []).map(normalizeOrder));
    }
  }

  // ---- API helper ----

  async function apiUpdateOrder(orderId: string, data: Record<string, any>) {
    const res = await fetch('/api/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Update failed');
    }
    return res.json();
  }

  // ---- Status updates ----

  async function updateOrderStatus(orderId: string, newStatus: string, extraData?: Record<string, any>) {
    setUpdatingStatus(true);
    try {
      const updateData: Record<string, any> = { ...extraData };

      // Archive doesn't change DB status — it stays 'delivered' with archived_at set
      if (newStatus === 'archived') {
        updateData.archived_at = new Date().toISOString();
      } else {
        updateData.status = newStatus;
        if (newStatus === 'processing') updateData.processing_at = new Date().toISOString();
        else if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
        else if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
      }

      await apiUpdateOrder(orderId, updateData);

      // Send shipped email
      if (newStatus === 'shipped' && selectedOrder?.email && (extraData?.tracking_code || editTrackingCode.trim())) {
        try {
          await fetch('/api/orders/notify-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber: selectedOrder.order_number,
              trackingCode: extraData?.tracking_code || editTrackingCode.trim(),
              customerEmail: selectedOrder.email,
            }),
          });
        } catch (emailErr) {
          console.error('Failed to send shipped email:', emailErr);
        }
      }

      await loadOrders();

      if (newStatus === 'archived') {
        setSelectedOrder(null);
      } else {
        setSelectedOrder(prev => {
          if (!prev || prev.id !== orderId) return prev;
          return { ...prev, status: newStatus, ...updateData };
        });
      }
    } catch (err: any) {
      console.error('Status update failed:', err);
      alert(`Failed to update: ${err.message}`);
    }
    setUpdatingStatus(false);
  }

  // ---- Filtering ----

  const filteredOrders = orders.filter(order => {
    // Search mode — search ALL orders including archived
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(q) ||
        (order.email && order.email.toLowerCase().includes(q)) ||
        (order.shipping_address?.name && order.shipping_address.name.toLowerCase().includes(q))
      );
    }

    // Tab filters — archived only shown via search
    if (order.status === 'archived') return false; // archived hidden from all tabs
    if (filter === 'active') return ACTIVE_STATUSES.includes(order.status);
    if (filter === 'delivered') return order.status === 'delivered';
    if (filter === 'reports') return false; // reports tab handles its own display
    if (ACTIVE_STATUSES.includes(filter)) return order.status === filter;
    return ACTIVE_STATUSES.includes(order.status);
  });

  // Reports data
  const reportOrders = orders.filter(order => {
    const isReportable = ['shipped', 'delivered', 'archived'].includes(order.status);
    if (!isReportable) return false;

    const orderDate = order.shipped_at || order.created_at;
    const d = new Date(orderDate).toISOString().split('T')[0];
    return d >= reportStartDate && d <= reportEndDate;
  });

  const reportTotals = reportOrders.reduce(
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
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-[#1B2B27]/60">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-4">Access Restricted</h1>
          <p className="font-mono text-[#1B2B27]/70 mb-6">Please login as an administrator.</p>
          <Link href="/admin" className="btn-accent">Go to Admin</Link>
        </div>
      </div>
    );
  }

  // ---- RENDER ----

  const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="min-h-screen bg-grain">
      {/* ===== Header ===== */}
      <div className="sticky top-0 z-40 bg-[#1B2B27] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-mono text-sm text-white/60 hover:text-white">← Admin</Link>
            <span className="font-mono text-sm text-white/40">|</span>
            <h1 className="font-mono text-sm font-medium text-white">
              Orders {filter !== 'reports' && `(${filteredOrders.length})`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search all orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/50 w-56"
            />
            <button onClick={loadOrders} className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40">
              ↻
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ===== Filters ===== */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 items-center">
          {[
            { key: 'active', label: 'Active', count: activeCount },
            { key: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
            { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
            { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
            { key: 'delivered', label: 'Delivered', count: deliveredCount },
            { key: 'reports', label: 'Reports', count: null },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-full font-mono text-xs whitespace-nowrap transition-colors ${
                filter === key ? 'bg-[#1B2B27] text-white' : 'bg-white/80 text-[#1B2B27]/70 hover:bg-white'
              }`}
            >
              {label}
              {count !== null && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          ))}
        </div>

        {/* ===== Reports Tab ===== */}
        {filter === 'reports' && !searchQuery.trim() && (
          <div>
            {/* Date range picker */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">From</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">To</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm"
                />
              </div>
              <p className="font-mono text-xs text-[#1B2B27]/50">
                Showing shipped/delivered orders in this period
              </p>
            </div>

            {/* Report table */}
            {reportOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-mono text-[#1B2B27]/60">No orders in this period.</p>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Order</th>
                      <th className="text-left font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Date</th>
                      <th className="text-left font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Customer</th>
                      <th className="text-right font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Items</th>
                      <th className="text-right font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Subtotal</th>
                      <th className="text-right font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Shipping</th>
                      <th className="text-right font-mono text-xs font-bold text-[#1B2B27]/60 px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportOrders.map(order => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="font-mono text-sm px-4 py-3 font-bold">{order.order_number}</td>
                        <td className="font-mono text-xs px-4 py-3 text-[#1B2B27]/60">
                          {fmtDateFull(order.shipped_at || order.created_at)}
                        </td>
                        <td className="font-mono text-xs px-4 py-3">
                          {order.shipping_address?.name || order.email || '—'}
                        </td>
                        <td className="font-mono text-xs px-4 py-3 text-right">{itemCount(order)}</td>
                        <td className="font-mono text-sm px-4 py-3 text-right">{fmtMoney(order.total - order.shipping_cost)}</td>
                        <td className="font-mono text-sm px-4 py-3 text-right">{fmtMoney(order.shipping_cost)}</td>
                        <td className="font-mono text-sm px-4 py-3 text-right font-bold">{fmtMoney(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#1B2B27]/5 font-bold">
                      <td className="font-mono text-sm px-4 py-3" colSpan={3}>
                        Total — {reportTotals.count} order{reportTotals.count !== 1 ? 's' : ''}
                      </td>
                      <td className="font-mono text-xs px-4 py-3 text-right">
                        {reportOrders.reduce((s, o) => s + itemCount(o), 0)}
                      </td>
                      <td className="font-mono text-sm px-4 py-3 text-right">{fmtMoney(reportTotals.subtotal)}</td>
                      <td className="font-mono text-sm px-4 py-3 text-right">{fmtMoney(reportTotals.shipping)}</td>
                      <td className="font-mono text-sm px-4 py-3 text-right text-green-700">{fmtMoney(reportTotals.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== Order List ===== */}
        {(filter !== 'reports' || searchQuery.trim()) && (
          <>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-mono text-[#1B2B27]/60">
                  {searchQuery.trim() ? 'No orders match your search.' : 'No orders found.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/90 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-bold text-[#1B2B27]">{order.order_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${sc(order.status).bg} ${sc(order.status).color}`}>
                            {sc(order.status).label}
                          </span>
                          {order.customer_notes && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-pink-100 text-pink-700">Has notes</span>
                          )}
                          {order.tracking_code && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-blue-600">Tracked</span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-[#1B2B27]/60 space-y-0.5">
                          <p>{fmtDate(order.created_at)}</p>
                          {order.shipping_address?.name && (
                            <p className="font-medium text-[#1B2B27]/80">{order.shipping_address.name}</p>
                          )}
                          {order.email && <p>{order.email}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-lg font-bold text-[#1B2B27]">{fmtMoney(order.total)}</p>
                        <p className="font-mono text-xs text-[#1B2B27]/60">{itemCount(order)} item(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* ORDER DETAIL MODAL — designed for warehouse employee         */}
      {/* ============================================================ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* ---- HEADER ---- */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-mono text-xl font-bold text-[#1B2B27]">{selectedOrder.order_number}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${sc(selectedOrder.status).bg} ${sc(selectedOrder.status).color}`}>
                    {sc(selectedOrder.status).label}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#1B2B27]/50 mt-0.5">
                  {selectedOrder.email || 'No email'} · {fmtDate(selectedOrder.created_at)}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-5">

              {/* ---- 1. CUSTOMER INSTRUCTIONS ---- */}
              {selectedOrder.customer_notes && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <p className="font-mono text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Customer Instructions
                  </p>
                  <p className="font-mono text-sm text-[#1B2B27] leading-relaxed">
                    {selectedOrder.customer_notes}
                  </p>
                </div>
              )}

              {/* ---- 2. TIMELINE ---- */}
              <div className="bg-gray-50 rounded-xl p-4">
                <OrderTimeline order={selectedOrder} />
              </div>

              {/* ---- 3. PACKING LIST ---- */}
              <div>
                <p className="font-mono text-xs font-bold text-[#1B2B27]/60 uppercase tracking-wider mb-3">
                  Packing List ({itemCount(selectedOrder)} item{itemCount(selectedOrder) !== 1 ? 's' : ''})
                </p>

                {selectedOrder.items.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-mono text-sm text-gray-400">No item details available</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center font-mono text-xs text-[#1B2B27]/50 uppercase tracking-wider border-b border-gray-200">
                      <span>Product</span>
                      <span className="w-20 text-center">SKU</span>
                      <span className="w-14 text-center">Size</span>
                      <span className="w-16 text-center">Color</span>
                      <span className="w-10 text-center">Qty</span>
                    </div>
                    {/* Rows */}
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center border-b border-gray-100 last:border-b-0 bg-white">
                        <span className="font-mono text-sm font-bold text-[#1B2B27] truncate">{item.name || 'Product'}</span>
                        <span className="font-mono text-sm text-amber-700 font-semibold w-20 text-center">{item.sku || '—'}</span>
                        <span className="font-mono text-sm text-[#1B2B27] w-14 text-center font-semibold">{item.size || '—'}</span>
                        <span className="font-mono text-sm text-[#1B2B27] w-16 text-center">{item.color || '—'}</span>
                        <span className="font-mono text-sm font-black text-[#1B2B27] w-10 text-center">{item.qty || 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- 4. SHIPPING LABEL ---- */}
              {selectedOrder.shipping_address ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-white">
                  <p className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Ship To
                  </p>
                  <div className="font-mono text-base text-[#1B2B27] leading-relaxed">
                    <p className="font-bold text-lg">{selectedOrder.shipping_address.name || '—'}</p>
                    {selectedOrder.shipping_address.street && <p>{selectedOrder.shipping_address.street}</p>}
                    {selectedOrder.shipping_address.apartment && <p>{selectedOrder.shipping_address.apartment}</p>}
                    <p>
                      {[selectedOrder.shipping_address.city, selectedOrder.shipping_address.province].filter(Boolean).join(', ')}
                      {selectedOrder.shipping_address.postal_code && (
                        <span className="ml-3 font-bold tracking-wider">{selectedOrder.shipping_address.postal_code}</span>
                      )}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{selectedOrder.shipping_address.country || 'Canada'}</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 text-center">
                  <p className="font-mono text-sm text-gray-400">No shipping address</p>
                </div>
              )}

              {/* ---- 5. ORDER SUMMARY ---- */}
              <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-[#1B2B27]/60">Subtotal</span>
                  <span>{fmtMoney(selectedOrder.total - selectedOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#1B2B27]/60">Shipping</span>
                  <span className={selectedOrder.shipping_cost === 0 ? 'text-green-600 font-bold' : ''}>
                    {selectedOrder.shipping_cost === 0 ? 'FREE' : fmtMoney(selectedOrder.shipping_cost)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{fmtMoney(selectedOrder.total)}</span>
                </div>
              </div>

              {/* ---- 6. STAFF NOTES (read-only unless processing) ---- */}
              {(selectedOrder.staff_notes || selectedOrder.status === 'processing') && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-mono text-xs font-bold text-[#1B2B27]/40 uppercase tracking-wider mb-2">Staff Notes</p>
                  {selectedOrder.status === 'processing' ? (
                    <textarea
                      placeholder="Packing notes, special instructions..."
                      value={editStaffNotes}
                      onChange={e => setEditStaffNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:border-gray-400 bg-white resize-none"
                    />
                  ) : (
                    <p className="font-mono text-sm text-[#1B2B27]/70">{selectedOrder.staff_notes}</p>
                  )}
                </div>
              )}

              {/* ---- 7. TRACKING INFO (for shipped/delivered/archived) ---- */}
              {selectedOrder.tracking_code && selectedOrder.status !== 'processing' && (
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
                  <span className="font-mono text-xs text-blue-600">Tracking:</span>
                  <code className="font-mono text-sm font-bold text-blue-800">{selectedOrder.tracking_code}</code>
                  <a
                    href={`https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${selectedOrder.tracking_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-mono text-xs text-blue-600 hover:underline"
                  >
                    Track on Canada Post →
                  </a>
                </div>
              )}

              {/* ---- 8. ACTION AREA ---- */}
              <div className="bg-white border-2 border-[#1B2B27]/10 rounded-xl p-4">
                <p className="font-mono text-xs font-bold text-[#1B2B27]/60 uppercase tracking-wider mb-3">Next Step</p>

                {/* PAID → Start Processing */}
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    disabled={updatingStatus}
                    className="w-full px-5 py-3 rounded-xl font-mono text-sm font-bold bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Start Processing →'}
                  </button>
                )}

                {/* PROCESSING → Enter tracking + notes, then Mark as Shipped */}
                {selectedOrder.status === 'processing' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-mono text-xs text-[#1B2B27]/60 block mb-1">Canada Post Tracking Code</label>
                      <input
                        type="text"
                        placeholder="Enter tracking number..."
                        value={editTrackingCode}
                        onChange={e => setEditTrackingCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 font-mono text-sm focus:outline-none focus:border-blue-400 bg-blue-50/50"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!editTrackingCode.trim()) {
                          alert('Please enter a tracking code before marking as shipped.');
                          return;
                        }
                        updateOrderStatus(selectedOrder.id, 'shipped', {
                          tracking_code: editTrackingCode.trim(),
                          staff_notes: editStaffNotes || null,
                        });
                      }}
                      disabled={updatingStatus}
                      className="w-full px-5 py-3 rounded-xl font-mono text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Shipped →'}
                    </button>
                  </div>
                )}

                {/* SHIPPED → Confirm Delivered */}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    disabled={updatingStatus}
                    className="w-full px-5 py-3 rounded-xl font-mono text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Confirm Delivered ✓'}
                  </button>
                )}

                {/* DELIVERED → Archive */}
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => {
                      if (confirm('Archive this order? It will be removed from the main list and only accessible via search.')) {
                        updateOrderStatus(selectedOrder.id, 'archived');
                      }
                    }}
                    disabled={updatingStatus}
                    className="w-full px-5 py-3 rounded-xl font-mono text-sm font-bold bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Archiving...' : 'Archive This Order'}
                  </button>
                )}

                {/* ARCHIVED → Done */}
                {selectedOrder.status === 'archived' && (
                  <div className="text-center py-2">
                    <p className="font-mono text-sm text-gray-500">This order has been archived.</p>
                    {selectedOrder.archived_at && (
                      <p className="font-mono text-xs text-gray-400 mt-1">Archived on {fmtDateFull(selectedOrder.archived_at)}</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
