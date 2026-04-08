'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface LabelResult {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  labelUrl?: string;
  trackingPin?: string;
}

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
  label_url: string | null;
  shipping_service: string | null;
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
    label_url: row.label_url || null,
    shipping_service: row.shipping_service || null,
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
              <p className={`font-display text-xs font-medium ${
                isCurrent ? 'text-amber-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              <p className="font-display text-[10px] text-gray-400 mt-0.5 h-4">
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
// MINI TIMELINE — compact lifecycle for order cards
// ============================================

function MiniTimeline({ order }: { order: Order }) {
  const currentIdx = STATUS_ORDER[order.status] ?? 0;

  return (
    <div className="flex items-center gap-0 w-full mt-2">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Dot + Label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500'
                    : isCurrent
                    ? 'bg-amber-400 border-amber-400 ring-[3px] ring-amber-100'
                    : 'bg-transparent border-gray-300'
                }`}
              />
              <span className={`font-display text-[8px] md:text-[9px] mt-1 whitespace-nowrap ${
                isCompleted ? 'text-green-600 font-semibold'
                  : isCurrent ? 'text-amber-600 font-semibold'
                  : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {/* Connecting line */}
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 rounded ${
                isCompleted ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
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
  const [uploadingLabel, setUploadingLabel] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [selectedService, setSelectedService] = useState('DOM.EP');
  const [labelResult, setLabelResult] = useState<LabelResult | null>(null);


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

  // ---- Label upload ----

  async function handleLabelUpload(orderId: string, orderNumber: string, file: File) {
    setUploadingLabel(true);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const fileName = `${orderNumber}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('shipping-labels')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('shipping-labels')
        .getPublicUrl(fileName);

      const labelUrl = urlData.publicUrl;

      await apiUpdateOrder(orderId, { label_url: labelUrl });
      await loadOrders();

      setSelectedOrder(prev => {
        if (!prev || prev.id !== orderId) return prev;
        return { ...prev, label_url: labelUrl };
      });
    } catch (err: any) {
      console.error('Label upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    }
    setUploadingLabel(false);
  }

  // ---- Create Label via Canada Post API ----

  async function handleCreateLabel(orderId: string, orderNumber: string) {
    setCreatingLabel(true);
    setLabelResult(null);
    try {
      const order = orders.find(o => o.id === orderId);
      const serviceCode = order?.shipping_service || selectedService;

      const res = await fetch('/api/shipping/create-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, serviceCode }),
      });

      const data = await res.json();

      // Full error — shipment not created
      if (data.error && !data.trackingPin) {
        setLabelResult({
          type: 'error',
          title: 'Label Creation Failed',
          message: formatCPError(data.error),
        });
        setCreatingLabel(false);
        return;
      }

      // Warning — shipment created but label download/upload failed
      if (data.error && data.trackingPin) {
        await loadOrders();
        setSelectedOrder(prev => {
          if (!prev || prev.id !== orderId) return prev;
          return { ...prev, tracking_code: data.trackingPin };
        });
        setEditTrackingCode(data.trackingPin);
        setLabelResult({
          type: 'warning',
          title: 'Shipment Created — Label Failed',
          message: `Tracking: ${data.trackingPin}\n\n${formatCPError(data.error)}\n\nThe shipment was purchased but the label PDF could not be downloaded. Try "Replace" to upload manually.`,
          trackingPin: data.trackingPin,
        });
        setCreatingLabel(false);
        return;
      }

      // Success — auto-open label PDF
      await loadOrders();
      setSelectedOrder(prev => {
        if (!prev || prev.id !== orderId) return prev;
        return {
          ...prev,
          tracking_code: data.trackingPin || prev.tracking_code,
          label_url: data.labelUrl || prev.label_url,
        };
      });
      setEditTrackingCode(data.trackingPin || '');

      // Auto-open label in new tab for printing
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank');
      }

      setLabelResult({
        type: 'success',
        title: 'Label Created Successfully',
        message: `Tracking: ${data.trackingPin}`,
        labelUrl: data.labelUrl,
        trackingPin: data.trackingPin,
      });
    } catch (err: any) {
      console.error('Create label failed:', err);
      setLabelResult({
        type: 'error',
        title: 'Connection Error',
        message: formatCPError(err.message || 'Could not reach Canada Post. Check your internet connection and try again.'),
      });
    }
    setCreatingLabel(false);
  }

  // Canada Post error codes → readable messages (see docs/canada-post-errors.md)
  function formatCPError(msg: string): string {
    if (!msg) return 'Unknown error occurred.';
    const m = msg.toLowerCase();

    // Credit card / payment errors
    if (m.includes('1162') || m.includes('could not be authorized') || m.includes('credit card'))
      return 'Credit card declined or insufficient funds.\n\nGo to canadapost.ca → My Profile → Payment → Manage credit cards and update your card.';
    if (m.includes('9174') || m.includes('default payment card'))
      return 'No credit card on file.\n\nGo to canadapost.ca → My Profile → Payment → Manage credit cards and add a default card.';
    if (m.includes('1653') || (m.includes('account') && m.includes('not available')))
      return 'Payment method "Account" not available for your account type.\n\nContact developer to switch payment method to CreditCard.';
    if (m.includes('1711') || m.includes('method of payment'))
      return 'Invalid payment method. Valid options: CreditCard or Account.';

    // Address errors
    if (m.includes('1156') || m.includes('address line'))
      return 'Missing address line 1.\n\nVerify the shipping address is complete.';
    if (m.includes('1157') || (m.includes('city') && m.includes('mandatory')))
      return 'Missing city in the shipping address.';
    if (m.includes('1159') || (m.includes('province') && m.includes('mandatory')))
      return 'Missing province/state in the shipping address.';
    if (m.includes('8534') || m.includes('destination country'))
      return 'Invalid or missing destination country.';
    if (m.includes('10033') || m.includes('invalid country'))
      return 'Invalid country code in the destination address.';

    // Service / parcel errors
    if (m.includes('9111') || m.includes('no services'))
      return 'No shipping services available for this parcel.\n\nCheck the weight and dimensions — they may exceed Canada Post limits.';
    if (m.includes('3000') || m.includes('service not available'))
      return 'Selected shipping service not available for this destination.\n\nTry a different service.';
    if (m.includes('10028') || m.includes('invalid product'))
      return 'Invalid service code selected.\n\nTry a different shipping service.';
    if (m.includes('8034') || m.includes('already been processed'))
      return 'This shipment was already processed.\n\nA refund must be requested to re-create it.';

    // Contract / account errors
    if (m.includes('2500') || m.includes('2550') || (m.includes('contract') && m.includes('not valid')))
      return 'Contract number is invalid.\n\nVerify Canada Post contract ID in settings.';
    if (m.includes('9173') || m.includes('parcel agreement'))
      return 'Your account requires Contract Shipping.\n\nThis is already configured — contact support if this persists.';

    // Auth errors
    if (m.includes('aa01') || m.includes('deactivated'))
      return 'API key has been deactivated.\n\nRe-join the Developer Program at canadapost.ca.';
    if (m.includes('aa02') || m.includes('do not match the endpoint'))
      return 'Using dev credentials on production (or vice versa).\n\nCheck that API keys match the environment.';
    if (m.includes('aa03') || m.includes('does not match'))
      return 'API key does not match the customer number.\n\nVerify API credentials.';
    if (m.includes('401') || m.includes('unauthorized'))
      return 'Authentication failed.\n\nCanada Post API credentials may be invalid or expired.';
    if (m.includes('403') || m.includes('forbidden'))
      return 'Access denied.\n\nYour Canada Post account may not have permission for this.';

    // System errors
    if (m.includes('9150') || m.includes('9151') || m.includes('9155'))
      return 'Canada Post system error (PDF rendering failed).\n\nTry again in a few minutes.';
    if (m.includes('9153'))
      return 'Transmit process not ready yet.\n\nWait a few seconds and try again.';
    if (m.includes('500') || m.includes('503') || m.includes('timeout'))
      return 'Canada Post service temporarily unavailable.\n\nPlease try again in a few minutes.';

    return msg;
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
    if (ACTIVE_STATUSES.includes(filter)) return order.status === filter;
    return ACTIVE_STATUSES.includes(order.status);
  });


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

  // ---- RENDER ----

  const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div>
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">Orders</h1>
          <p className="font-body text-sm text-text-secondary mt-0.5">
            {filteredOrders.length} orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-warm-200 font-body text-sm text-text-primary placeholder-warm-400 focus:outline-none focus:border-warm-400 w-56"
          />
          <button onClick={loadOrders} className="font-display text-xs text-warm-400 hover:text-text-primary px-3 py-2.5 rounded-xl bg-white border border-warm-200 hover:border-warm-300 transition-colors">
            ↻
          </button>
        </div>
      </div>

      <div>
        {/* ===== Filters ===== */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 items-center">
          {[
            { key: 'active', label: 'Active', count: activeCount },
            { key: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
            { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
            { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
            { key: 'delivered', label: 'Delivered', count: deliveredCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-full font-display text-[11px] font-bold whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-amber text-charcoal-deep shadow-sm'
                  : 'bg-white text-warm-400 hover:text-text-primary border border-warm-200'
              }`}
            >
              {label}
              {count !== null && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          ))}
        </div>

        {/* ===== Order List ===== */}
        {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-display text-text-primary/60">
                  {searchQuery.trim() ? 'No orders match your search.' : 'No orders found.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-display text-sm font-bold text-text-primary">{order.order_number}</span>
                          {order.customer_notes && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-display bg-pink-100 text-pink-700">Has notes</span>
                          )}
                          {order.tracking_code && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-display bg-blue-50 text-blue-600">Tracked</span>
                          )}
                        </div>
                        <MiniTimeline order={order} />
                        <div className="font-display text-xs text-text-primary/60 space-y-0.5 mt-2">
                          <p>{fmtDate(order.created_at)}</p>
                          {order.shipping_address?.name && (
                            <p className="font-medium text-text-primary/80">{order.shipping_address.name}</p>
                          )}
                          {order.email && <p>{order.email}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg font-bold text-text-primary">{fmtMoney(order.total)}</p>
                        <p className="font-display text-xs text-text-primary/60">{itemCount(order)} item(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <h2 className="font-display text-xl font-bold text-text-primary">{selectedOrder.order_number}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-display ${sc(selectedOrder.status).bg} ${sc(selectedOrder.status).color}`}>
                    {sc(selectedOrder.status).label}
                  </span>
                </div>
                <p className="font-display text-xs text-text-primary/50 mt-0.5">
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
                  <p className="font-display text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Customer Instructions
                  </p>
                  <p className="font-display text-sm text-text-primary leading-relaxed">
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
                <p className="font-display text-xs font-bold text-text-primary/60 uppercase tracking-wider mb-3">
                  Packing List ({itemCount(selectedOrder)} item{itemCount(selectedOrder) !== 1 ? 's' : ''})
                </p>

                {selectedOrder.items.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-display text-sm text-gray-400">No item details available</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center font-display text-xs text-text-primary/50 uppercase tracking-wider border-b border-gray-200">
                      <span>Product</span>
                      <span className="w-20 text-center">SKU</span>
                      <span className="w-14 text-center">Size</span>
                      <span className="w-16 text-center">Color</span>
                      <span className="w-10 text-center">Qty</span>
                    </div>
                    {/* Rows */}
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center border-b border-gray-100 last:border-b-0 bg-white">
                        <span className="font-display text-sm font-bold text-text-primary truncate">{item.name || 'Product'}</span>
                        <span className="font-display text-sm text-amber-700 font-semibold w-20 text-center">{item.sku || '—'}</span>
                        <span className="font-display text-sm text-text-primary w-14 text-center font-semibold">{item.size || '—'}</span>
                        <span className="font-display text-sm text-text-primary w-16 text-center">{item.color || '—'}</span>
                        <span className="font-display text-sm font-black text-text-primary w-10 text-center">{item.qty || 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- 4. SHIPPING LABEL ---- */}
              {selectedOrder.shipping_address ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-white">
                  <p className="font-display text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Ship To
                  </p>
                  <div className="font-display text-base text-text-primary leading-relaxed">
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
                  <p className="font-display text-sm text-gray-400">No shipping address</p>
                </div>
              )}

              {/* ---- 5. ORDER SUMMARY ---- */}
              <div className="bg-gray-50 rounded-xl p-4 font-display text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-text-primary/60">Subtotal</span>
                  <span>{fmtMoney(selectedOrder.total - selectedOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-text-primary/60">Shipping</span>
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
                  <p className="font-display text-xs font-bold text-text-primary/40 uppercase tracking-wider mb-2">Staff Notes</p>
                  {selectedOrder.status === 'processing' ? (
                    <textarea
                      placeholder="Packing notes, special instructions..."
                      value={editStaffNotes}
                      onChange={e => setEditStaffNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 font-display text-sm focus:outline-none focus:border-gray-400 bg-white resize-none"
                    />
                  ) : (
                    <p className="font-display text-sm text-text-primary/70">{selectedOrder.staff_notes}</p>
                  )}
                </div>
              )}

              {/* ---- 7. TRACKING INFO (for shipped/delivered/archived) ---- */}
              {selectedOrder.tracking_code && selectedOrder.status !== 'processing' && (
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
                  <span className="font-display text-xs text-blue-600">Tracking:</span>
                  <code className="font-display text-sm font-bold text-blue-800">{selectedOrder.tracking_code}</code>
                  <a
                    href={`https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${selectedOrder.tracking_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-display text-xs text-blue-600 hover:underline"
                  >
                    Track on Canada Post →
                  </a>
                </div>
              )}

              {/* ---- 8. SHIPPING LABEL PDF ---- */}
              {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.label_url) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-display text-xs font-bold text-text-primary/40 uppercase tracking-wider mb-3">Shipping Label</p>
                  {selectedOrder.label_url ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <a
                          href={selectedOrder.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-deep text-white font-display text-xs font-bold text-center hover:bg-charcoal transition-colors"
                        >
                          Download Label PDF
                        </a>
                        <label className="px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-display text-xs font-bold text-center hover:border-gray-400 cursor-pointer transition-colors">
                          Replace
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleLabelUpload(selectedOrder.id, selectedOrder.order_number, file);
                            }}
                          />
                        </label>
                      </div>
                      {selectedOrder.status === 'processing' && (
                        <button
                          onClick={() => handleCreateLabel(selectedOrder.id, selectedOrder.order_number)}
                          disabled={creatingLabel}
                          className="w-full px-4 py-2.5 rounded-xl bg-red-600 text-white font-display text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {creatingLabel ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                              Re-creating Label...
                            </>
                          ) : (
                            'Re-create Label via Canada Post'
                          )}
                        </button>
                      )}
                    </div>
                  ) : selectedOrder.status === 'processing' ? (
                    <div className="space-y-3">
                      {/* Show customer's chosen service (locked) or fallback selector */}
                      {selectedOrder.shipping_service ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200">
                          <span className="font-display text-xs text-blue-600">Service:</span>
                          <span className="font-display text-sm font-bold text-blue-800">
                            {{'DOM.RP': 'Regular Parcel', 'DOM.EP': 'Expedited Parcel', 'DOM.XP': 'Xpresspost', 'DOM.PC': 'Priority'}[selectedOrder.shipping_service] || selectedOrder.shipping_service}
                          </span>
                          <span className="ml-auto font-display text-[10px] text-blue-400">chosen by customer</span>
                        </div>
                      ) : (
                        <div>
                          <label className="font-display text-xs text-text-primary/60 block mb-1.5">Shipping Service</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { code: 'DOM.RP', name: 'Regular Parcel', desc: '5-8 days' },
                              { code: 'DOM.EP', name: 'Expedited', desc: '2-4 days' },
                              { code: 'DOM.XP', name: 'Xpresspost', desc: '1-2 days' },
                              { code: 'DOM.PC', name: 'Priority', desc: 'Next day' },
                            ].map(svc => (
                              <button
                                key={svc.code}
                                onClick={() => setSelectedService(svc.code)}
                                className={`px-3 py-2 rounded-lg border-2 font-display text-xs text-left transition-colors ${
                                  selectedService === svc.code
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-text-primary/70 hover:border-gray-300'
                                }`}
                              >
                                <span className="font-bold block">{svc.name}</span>
                                <span className="text-[10px] opacity-60">{svc.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Create Label button */}
                      <button
                        onClick={() => handleCreateLabel(selectedOrder.id, selectedOrder.order_number)}
                        disabled={creatingLabel}
                        className="w-full px-4 py-3 rounded-xl bg-red-600 text-white font-display text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {creatingLabel ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            Creating Label...
                          </>
                        ) : (
                          'Create Label via Canada Post'
                        )}
                      </button>
                      {/* Manual upload fallback */}
                      <label className="block w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-center font-display text-[10px] text-gray-400 hover:border-gray-400 cursor-pointer transition-colors">
                        {uploadingLabel ? 'Uploading...' : 'or upload label manually (PDF, PNG, JPG)'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          disabled={uploadingLabel}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleLabelUpload(selectedOrder.id, selectedOrder.order_number, file);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="font-display text-xs text-gray-400 text-center py-2">No label uploaded</p>
                  )}
                </div>
              )}

              {/* ---- 9. ACTION AREA ---- */}
              <div className="bg-white border-2 border-charcoal-deep/10 rounded-xl p-4">
                <p className="font-display text-xs font-bold text-text-primary/60 uppercase tracking-wider mb-3">Next Step</p>

                {/* PAID → Start Processing */}
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    disabled={updatingStatus}
                    className="w-full px-5 py-3 rounded-xl font-display text-sm font-bold bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Start Processing →'}
                  </button>
                )}

                {/* PROCESSING → Enter tracking + notes, then Mark as Shipped */}
                {selectedOrder.status === 'processing' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-display text-xs text-text-primary/60 block mb-1">Canada Post Tracking Code</label>
                      <input
                        type="text"
                        placeholder="Enter tracking number..."
                        value={editTrackingCode}
                        onChange={e => setEditTrackingCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 font-display text-sm focus:outline-none focus:border-blue-400 bg-blue-50/50"
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
                      className="w-full px-5 py-3 rounded-xl font-display text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                    className="w-full px-5 py-3 rounded-xl font-display text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
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
                    className="w-full px-5 py-3 rounded-xl font-display text-sm font-bold bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Archiving...' : 'Archive This Order'}
                  </button>
                )}

                {/* ARCHIVED → Done */}
                {selectedOrder.status === 'archived' && (
                  <div className="text-center py-2">
                    <p className="font-display text-sm text-gray-500">This order has been archived.</p>
                    {selectedOrder.archived_at && (
                      <p className="font-display text-xs text-gray-400 mt-1">Archived on {fmtDateFull(selectedOrder.archived_at)}</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===== Label Result Modal ===== */}
      {labelResult && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setLabelResult(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div className="flex justify-center">
              {labelResult.type === 'success' && (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
              )}
              {labelResult.type === 'error' && (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              )}
              {labelResult.type === 'warning' && (
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-display text-lg font-bold text-center ${
              labelResult.type === 'success' ? 'text-green-800' :
              labelResult.type === 'error' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {labelResult.title}
            </h3>

            {/* Message */}
            <p className="font-display text-sm text-text-primary/70 text-center whitespace-pre-line">
              {labelResult.message}
            </p>

            {/* Tracking pin highlight */}
            {labelResult.trackingPin && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="font-display text-[10px] text-blue-500 uppercase tracking-wider mb-1">Tracking Number</p>
                <code className="font-display text-base font-bold text-blue-800">{labelResult.trackingPin}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {labelResult.type === 'success' && labelResult.labelUrl && (
                <button
                  onClick={() => window.open(labelResult.labelUrl, '_blank')}
                  className="flex-1 px-4 py-3 rounded-xl bg-charcoal-deep text-white font-display text-xs font-bold hover:bg-charcoal transition-colors"
                >
                  Print Label
                </button>
              )}
              {labelResult.type === 'error' && selectedOrder && (
                <button
                  onClick={() => {
                    setLabelResult(null);
                    handleCreateLabel(selectedOrder.id, selectedOrder.order_number);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-display text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => setLabelResult(null)}
                className={`${labelResult.type !== 'warning' ? '' : 'flex-1'} px-4 py-3 rounded-xl border-2 border-gray-200 text-text-primary/70 font-display text-xs font-bold hover:bg-gray-50 transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
