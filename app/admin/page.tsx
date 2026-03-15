'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ============================================
// CONSTANTS
// ============================================

const AVAILABLE_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1B1B1B' },
  { name: 'Amber', hex: '#B8860B' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Light Grey', hex: '#D3D3D3' },
  { name: 'Construction Green', hex: '#2D5A27' },
  { name: 'Green', hex: '#228B22' },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// ============================================
// PRODUCT TYPES (shirt/item types → Stripe prices)
// ============================================

const PRODUCT_TYPES: Record<string, {
  label: string;
  productName: string;
  skuPrefix: string;
  stripe_price_id: string;
  base_price: number;
  defaultSizes: string[];
  description: string;
}> = {
  'cotton-tee': {
    label: 'Cotton Tee — CA$29.99',
    productName: 'OnSite DryBlend Tee',
    skuPrefix: 'CTEE',
    stripe_price_id: 'price_1T6yaQGntiIt3xkawNdIb3ek',
    base_price: 29.99,
    defaultSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: '5.5 oz/yd², 50/50 cotton/polyester blend, 20 singles. Midweight DryBlend® moisture-wicking fabric. Classic fit, taped neck & shoulders, double-needle sleeve and bottom hems. Tear-away label. Sizes S–5XL.',
  },
  'sport-tee': {
    label: 'Sport Tee — CA$34.99',
    productName: 'OnSite Performance Tee',
    skuPrefix: 'STEE',
    stripe_price_id: 'price_1T6ybPGntiIt3xkaA7NoCQ4e',
    base_price: 34.99,
    defaultSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: '4.13 oz/yd², 100% polyester interlock. Moisture-wicking performance fabric with UV 50+ protection. Lightweight and breathable. Tear-away label. Sizes S–4XL.',
  },
  'hoodie': {
    label: 'Hoodie — CA$49.99',
    productName: 'OnSite Heavyweight Hoodie',
    skuPrefix: 'HOOD',
    stripe_price_id: 'price_1T6ydIGntiIt3xkaOI5uKbgH',
    base_price: 49.99,
    defaultSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: '12.7 oz/Lyd, 260 GSM, 50/50 cotton/polyester. 2-End Fleece Bio polished fabric. Hood with matching drawstring, set-in sleeves, pouch pockets 2x2. Athletic rib knit cuffs with Lycra. Double-needle stitching throughout. Sizes S–3XL.',
  },
  'cap': {
    label: 'Cap — CA$39.99',
    productName: 'OnSite Snapback Cap',
    skuPrefix: 'CAP',
    stripe_price_id: 'price_1T6ylSGntiIt3xka7i5gMdhM',
    base_price: 39.99,
    defaultSizes: ['One Size'],
    description: '100% cotton twill, structured 6-panel mid-profile. Pre-curved visor, adjustable snapback closure. Embroidered OnSite Club logo. One size fits most.',
  },
  'sticker-kit': {
    label: 'Sticker Kit — CA$9.99',
    productName: 'OnSite Jobsite Sticker Pack',
    skuPrefix: 'STK',
    stripe_price_id: 'price_1T6yfRGntiIt3xkaNuMeFJSF',
    base_price: 9.99,
    defaultSizes: ['One Size'],
    description: 'Premium vinyl sticker pack. Waterproof, UV-resistant, and built for hard hats, toolboxes, and trucks. Easy peel-and-stick application. Durable outdoor-grade adhesive.',
  },
};

// ============================================
// TYPES
// ============================================

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  sku: string;
  stripe_price_id: string;
  product_type: string;
  images: string[];
  sizes: string[];
  colors: string[];
  color_images: Record<string, string[]>;
  primary_image: string;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  category_id: string | null;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Toast/notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Track if there are unpublished changes
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Category management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Product type tab filter
  const [activeProductTab, setActiveProductTab] = useState<string>('all');

  // Reviews moderation
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const supabase = createClient();

  // Check auth and admin status
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    setUser(user);

    // Check if user is admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (admin) {
      setIsAdmin(true);
      await loadData();
    }

    setIsLoading(false);
  }

  async function loadData() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('app_shop_products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (cats) setCategories(cats);

    if (prods) {
      setProducts(prods);
      const unpublished = prods.some((p: Product) => !p.is_published);
      setHasUnpublishedChanges(unpublished);
    }

    const { data: revs } = await supabase
      .from('app_shop_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (revs) setReviews(revs);
  }

  async function handlePublishAll() {
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('app_shop_products')
        .update({ is_published: true })
        .eq('is_published', false);

      if (error) throw error;

      await loadData();
      showToast('Changes published to Shop!', 'success');
    } catch (error: any) {
      showToast('Error publishing: ' + error.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function handleReviewModerate(reviewId: string, action: 'approve' | 'reject') {
    try {
      const update: Record<string, any> = {
        status: action === 'approve' ? 'approved' : 'rejected',
      };
      if (action === 'approve') {
        update.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_shop_reviews')
        .update(update)
        .eq('id', reviewId);

      if (error) throw error;

      showToast(`Review ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
      await loadData();
    } catch {
      showToast('Failed to moderate review', 'error');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    if (data.user) {
      setUser(data.user);

      const { data: admin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', data.user.email)
        .single();

      if (admin) {
        setIsAdmin(true);
        await loadData();
      }
    }

    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  async function handleSaveProduct(product: Partial<Product>) {
    setSaving(true);

    try {
      const productData = {
        name: product.name,
        slug: product.slug || product.name?.toLowerCase()
          .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c').replace(/[ñ]/g, 'n')
          .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: product.description,
        base_price: product.base_price,
        sku: product.sku || '',
        stripe_price_id: product.stripe_price_id || '',
        product_type: product.product_type || '',
        images: product.images || [],
        sizes: product.sizes || [],
        colors: product.colors || [],
        color_images: product.color_images || {},
        primary_image: product.primary_image || '',
        category_id: product.category_id || null,
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        is_published: false,
      };

      if (product.id) {
        const { error } = await supabase
          .from('app_shop_products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_shop_products')
          .insert(productData);

        if (error) throw error;
      }

      await loadData();
      setEditingProduct(null);
      showToast('Product saved successfully!', 'success');
    } catch (error: any) {
      showToast('Error saving: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('app_shop_products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Error deleting: ' + error.message, 'error');
    } else {
      await loadData();
      showToast('Product deleted!', 'success');
    }
  }

  async function handleCreateCategory(name: string) {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), slug });

    if (error) {
      showToast('Error creating category: ' + error.message, 'error');
    } else {
      await loadData();
      setNewCategoryName('');
      setShowCategoryForm(false);
      showToast(`Category "${name.trim()}" created!`, 'success');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Products using it will become uncategorized.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      await loadData();
      showToast('Category deleted', 'success');
    }
  }

  async function handleToggleActive(product: Product) {
    const { error } = await supabase
      .from('app_shop_products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (!error) {
      await loadData();
    }
  }

  function resizeImageToSquare(file: File, maxSize = 2000): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(Math.max(img.width, img.height), maxSize);
        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, side, side);
        const scale = Math.min(side / img.width, side / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleImageUpload(file: File): Promise<string | null> {
    try {
      const resized = await resizeImageToSquare(file);
      const fileName = `${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from('products')
        .upload(fileName, resized, { contentType: 'image/jpeg' });

      if (error) {
        alert('Upload error: ' + error.message);
        return null;
      }

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err: any) {
      alert('Resize error: ' + err.message);
      return null;
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-[#1B2B27]">Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-sm">
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2 text-center">Admin</h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-8 text-center">OnSite Shop</p>

          <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-4">
            {loginError && (
              <p className="font-mono text-sm text-red-500 text-center">{loginError}</p>
            )}

            <div>
              <label className="block font-mono text-sm text-[#1B2B27] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-sm text-[#1B2B27] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/" className="font-mono text-sm text-[#1B2B27]/60 hover:text-[#1B2B27]">
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-sm text-center">
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2">Access Denied</h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-4">
            {user.email} does not have admin permissions.
          </p>
          <button onClick={handleLogout} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Product edit form
  if (editingProduct) {
    return (
      <div className="min-h-screen bg-grain">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-mono text-sm ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#1B2B27] border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditingProduct(null)}
                className="font-mono text-sm text-white/60 hover:text-white flex items-center gap-1"
              >
                ← Back
              </button>
              <span className="font-mono text-sm text-white/40">|</span>
              <h2 className="font-mono text-sm font-medium text-white">
                {editingProduct.id ? 'Edit Product' : 'New Product'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
              >
                View Shop
              </Link>
              <button
                onClick={() => setEditingProduct(null)}
                className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={handleSaveProduct}
            onCancel={() => setEditingProduct(null)}
            onUpload={handleImageUpload}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-grain">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-mono text-sm ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[#1B2B27]">Admin Dashboard</h1>
            <p className="font-mono text-sm text-[#1B2B27]/60">
              {user.email} • {products.length} products
              {hasUnpublishedChanges && (
                <span className="ml-2 text-amber-600">• Unpublished changes</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="bg-[#1B2B27] hover:bg-[#2a3f39] text-white font-mono text-sm py-2 px-4 rounded-xl transition-colors"
            >
              Orders
            </Link>
            <button
              onClick={() => setActiveProductTab(activeProductTab === 'reviews' ? 'all' : 'reviews')}
              className={`font-mono text-sm py-2 px-4 rounded-xl transition-colors relative ${
                activeProductTab === 'reviews'
                  ? 'bg-[#B8860B] text-[#1B2B27] font-bold'
                  : 'bg-[#1B2B27] hover:bg-[#2a3f39] text-white'
              }`}
            >
              Reviews
              {reviews.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {reviews.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            {hasUnpublishedChanges && (
              <button
                onClick={handlePublishAll}
                disabled={publishing}
                className="bg-green-500 hover:bg-green-600 text-white font-mono text-sm py-2 px-4 rounded-xl disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Publishing...' : 'Publish to Shop'}
              </button>
            )}
            <Link href="/" className="btn-secondary">View Shop</Link>
            <button onClick={handleLogout} className="font-mono text-sm text-red-500">
              Sign Out
            </button>
          </div>
        </div>

        {/* Categories management */}
        {activeProductTab !== 'reviews' && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-mono text-sm font-medium text-[#1B2B27]/60">Categories</h2>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="font-mono text-xs text-[#B8860B] hover:text-[#9A7209]"
            >
              {showCategoryForm ? 'Cancel' : '+ Add'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center gap-1.5 bg-white/80 border border-stone-200 rounded-lg px-3 py-1.5"
              >
                <span className="font-mono text-xs text-[#1B2B27]">{cat.name}</span>
                <span className="font-mono text-[10px] text-stone-400">({cat.slug})</span>
                {cat.slug !== 'mens' && cat.slug !== 'members' && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="font-mono text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
          {showCategoryForm && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Skulls, Nature, Abstract..."
                className="input flex-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory(newCategoryName)}
              />
              <button
                onClick={() => handleCreateCategory(newCategoryName)}
                className="btn-accent text-sm"
              >
                Create
              </button>
            </div>
          )}
        </div>
        )}

        {activeProductTab !== 'reviews' && (
        <>
        {/* Add product button */}
        <button
          onClick={() => setEditingProduct({
            id: '',
            name: '',
            slug: '',
            description: '',
            base_price: 0,
            sku: '',
            stripe_price_id: '',
            product_type: '',
            images: [],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: [],
            color_images: {},
            primary_image: '',
            category_id: null,
            is_active: true,
            is_featured: false,
            is_published: false,
          })}
          className="btn-accent mb-6"
        >
          + Add Product
        </button>

        {/* Product type tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'All' },
            { key: 'cotton-tee', label: 'Cotton Tees' },
            { key: 'hoodie', label: 'Hoodies' },
            { key: 'sport-tee', label: 'Sport Tees' },
            { key: 'cap', label: 'Caps' },
            { key: 'sticker-kit', label: 'Stickers' },
          ].map(tab => {
            const count = tab.key === 'all'
              ? products.length
              : products.filter(p => p.product_type === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveProductTab(tab.key)}
                className={`font-mono text-xs py-2 px-4 rounded-lg transition-all whitespace-nowrap ${
                  activeProductTab === tab.key
                    ? 'bg-[#1B2B27] text-white font-bold'
                    : 'bg-white/70 text-[#1B2B27]/60 hover:bg-white hover:text-[#1B2B27]'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
        </>
        )}

        {/* Reviews moderation panel */}
        {activeProductTab === 'reviews' && (
          <div>
            <div className="flex gap-2 mb-6">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
                const count = f === 'all' ? reviews.length : reviews.filter(r => r.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`font-mono text-xs py-2 px-4 rounded-lg transition-all capitalize ${
                      reviewFilter === f
                        ? 'bg-[#1B2B27] text-white font-bold'
                        : 'bg-white/70 text-[#1B2B27]/60 hover:bg-white'
                    }`}
                  >
                    {f} ({count})
                  </button>
                );
              })}
            </div>

            {reviews.filter(r => reviewFilter === 'all' || r.status === reviewFilter).length === 0 && (
              <p className="font-mono text-sm text-[#1B2B27]/40 text-center py-12">No reviews found</p>
            )}

            <div className="space-y-4">
              {reviews
                .filter(r => reviewFilter === 'all' || r.status === reviewFilter)
                .map(review => (
                  <div key={review.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[#B8860B] text-sm tracking-wider">
                            {'★'.repeat(review.rating)}
                            <span className="text-[#D3D1C7]">{'★'.repeat(5 - review.rating)}</span>
                          </span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            review.status === 'approved' ? 'bg-green-100 text-green-700'
                              : review.status === 'rejected' ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {review.status}
                          </span>
                        </div>

                        {review.title && (
                          <h3 className="font-mono text-sm font-bold text-[#1B2B27] mb-1">{review.title}</h3>
                        )}

                        {review.comment && (
                          <p className="font-mono text-xs text-[#1B2B27]/70 leading-relaxed mb-2">{review.comment}</p>
                        )}

                        <p className="font-mono text-[10px] text-[#6B7280]">
                          {review.customer_name || 'Anonymous'} • Order {review.order_number} •{' '}
                          {new Date(review.created_at).toLocaleDateString('en-CA')}
                        </p>

                        {review.product_names?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {review.product_names.map((name: string, i: number) => (
                              <span key={i} className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {review.status === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleReviewModerate(review.id, 'approve')}
                          className="flex-1 font-mono text-xs py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewModerate(review.id, 'reject')}
                          className="flex-1 font-mono text-xs py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Products grid */}
        {activeProductTab !== 'reviews' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.filter(p => activeProductTab === 'all' || p.product_type === activeProductTab).map((product) => (
            <div
              key={product.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 ${
                !product.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {product.images?.[0] ? (
                  <img
                    src={product.primary_image || product.images[0]}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-20 h-20 bg-stone-100 rounded-xl flex items-center justify-center text-2xl font-mono text-stone-300">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-medium text-[#1B2B27] truncate">
                      {product.name}
                    </h3>
                    {(() => {
                      const cat = categories.find(c => c.id === product.category_id);
                      return cat ? (
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          cat.slug === 'members'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {cat.slug}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p className="font-mono text-xs text-[#1B2B27]/40">
                    {product.sku || 'no SKU'}
                    {product.product_type && ` • ${PRODUCT_TYPES[product.product_type]?.label.split(' —')[0] || product.product_type}`}
                  </p>
                  <p className="font-mono text-lg font-bold text-[#F6C343]">
                    CA${product.base_price?.toFixed(2)}
                  </p>
                  {product.colors?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {product.colors.map((color) => {
                        const def = AVAILABLE_COLORS.find(c => c.name === color);
                        return (
                          <span
                            key={color}
                            className="w-4 h-4 rounded-full border border-stone-200"
                            style={{ backgroundColor: def?.hex || '#ccc' }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 font-mono text-xs py-2 bg-stone-100 rounded-lg hover:bg-stone-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`flex-1 font-mono text-xs py-2 rounded-lg ${
                    product.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="font-mono text-xs py-2 px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PRODUCT FORM COMPONENT
// ============================================

function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
  onUpload,
  saving,
}: {
  product: Partial<Product>;
  categories: Category[];
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string | null>;
  saving: boolean;
}) {
  const generateSlug = (name: string) =>
    name.toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c').replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const [form, setForm] = useState({
    ...product,
    sku: product.sku || '',
    slug: product.slug || '',
    stripe_price_id: product.stripe_price_id || '',
    product_type: product.product_type || '',
    color_images: product.color_images || {} as Record<string, string[]>,
    primary_image: product.primary_image || product.images?.[0] || '',
    category_id: product.category_id || null as string | null,
  });
  const [uploading, setUploading] = useState(false);
  const [activeColorTab, setActiveColorTab] = useState<string>(
    (product.colors || [])[0] || ''
  );

  // Toggle size selection
  const toggleSize = (size: string) => {
    const current = form.sizes || [];
    const updated = current.includes(size)
      ? current.filter((s: string) => s !== size)
      : [...current, size];
    setForm({ ...form, sizes: updated });
  };

  // Toggle color availability
  const toggleColor = (colorName: string) => {
    const current = form.colors || [];
    if (current.includes(colorName)) {
      const updated = current.filter((c: string) => c !== colorName);
      const updatedCI = { ...(form.color_images || {}) };
      delete updatedCI[colorName];
      setForm({ ...form, colors: updated, color_images: updatedCI });
      if (activeColorTab === colorName) {
        setActiveColorTab(updated[0] || '');
      }
    } else {
      const updated = [...current, colorName];
      setForm({ ...form, colors: updated });
      if (!activeColorTab) setActiveColorTab(colorName);
    }
  };

  // Upload image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const url = await onUpload(files[0]);
    setUploading(false);

    if (url) {
      const selectedColors = form.colors || [];
      // Replace primary_image if empty or pointing to a broken placeholder
      const needsPrimary = !form.primary_image || form.primary_image.includes('placeholder');

      if (selectedColors.length > 0 && activeColorTab) {
        const updatedCI = { ...(form.color_images || {}) };
        updatedCI[activeColorTab] = [...(updatedCI[activeColorTab] || []), url];
        setForm({
          ...form,
          color_images: updatedCI,
          primary_image: needsPrimary ? url : form.primary_image,
        });
      } else {
        setForm({
          ...form,
          images: [...(form.images || []), url],
          primary_image: needsPrimary ? url : form.primary_image,
        });
      }
    }
    e.target.value = '';
  };

  // Remove image
  const removeImage = (url: string, color?: string) => {
    let newPrimary = form.primary_image;
    if (form.primary_image === url) newPrimary = '';

    if (color) {
      const updatedCI = { ...(form.color_images || {}) };
      updatedCI[color] = (updatedCI[color] || []).filter((u: string) => u !== url);
      if (updatedCI[color].length === 0) delete updatedCI[color];

      if (!newPrimary) {
        const allCI = Object.values(updatedCI).flat();
        newPrimary = allCI[0] || (form.images || []).filter((u: string) => u !== url)[0] || '';
      }

      setForm({ ...form, color_images: updatedCI, primary_image: newPrimary });
    } else {
      const updatedImages = (form.images || []).filter((u: string) => u !== url);
      if (!newPrimary) newPrimary = updatedImages[0] || '';
      setForm({ ...form, images: updatedImages, primary_image: newPrimary });
    }
  };

  // Build final images array and save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allImages: string[] = [];
    const seen = new Set<string>();

    // Primary first
    if (form.primary_image) {
      allImages.push(form.primary_image);
      seen.add(form.primary_image);
    }

    // Color images
    Object.values(form.color_images || {}).flat().forEach((url: string) => {
      if (!seen.has(url)) { allImages.push(url); seen.add(url); }
    });

    // Flat images (for products without color assignment)
    (form.images || []).forEach((url: string) => {
      if (!seen.has(url)) { allImages.push(url); seen.add(url); }
    });

    onSave({ ...form, images: allImages });
  };

  // Determine which images to show
  const selectedColors = form.colors || [];
  const hasColors = selectedColors.length > 0;

  const displayImages = hasColors && activeColorTab
    ? (form.color_images || {})[activeColorTab] || []
    : form.images || [];

  // Collect all images across all sources
  const allImageUrls: string[] = [];
  const seenUrls = new Set<string>();
  Object.values(form.color_images || {}).flat().forEach((url: string) => {
    if (!seenUrls.has(url)) { allImageUrls.push(url); seenUrls.add(url); }
  });
  (form.images || []).forEach((url: string) => {
    if (!seenUrls.has(url)) { allImageUrls.push(url); seenUrls.add(url); }
  });

  // ---- Sequential product number ----
  const parseOscNum = (sku: string) => {
    const match = sku.match(/^OSC(\d{3})/);
    return match ? match[1] : '';
  };
  const [productNum, setProductNum] = useState(parseOscNum(product.sku || ''));
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [designList, setDesignList] = useState<{ num: string; url: string }[]>([]);
  const [designUploading, setDesignUploading] = useState(false);

  // Fetch designs from Supabase Storage
  useEffect(() => {
    fetch('/api/designs')
      .then((r) => r.json())
      .then((data) => setDesignList(data.designs || []))
      .catch(() => {});
  }, []);

  // Resize image to 150px thumbnail with white background
  function resizeToThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = 150;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload a new design thumbnail via API (bypasses RLS)
  async function handleDesignUpload(file: File) {
    setDesignUploading(true);
    try {
      const blob = await resizeToThumbnail(file);
      const formData = new FormData();
      formData.append('file', blob, 'design.jpg');

      const res = await fetch('/api/designs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert('Upload error: ' + (data.error || 'Unknown error'));
        setDesignUploading(false);
        return;
      }

      const newDesign = { num: data.num, url: data.url };
      setDesignList([...designList, newDesign]);
      applyProductNum(data.num);
      setDesignUploading(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
      setDesignUploading(false);
    }
  }

  // Delete a design thumbnail via API
  async function handleDesignDelete(num: string) {
    if (!confirm(`Delete design OSC${num}?`)) return;
    try {
      const res = await fetch('/api/designs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num }),
      });
      if (res.ok) {
        setDesignList(designList.filter((d) => d.num !== num));
        if (productNum === num) setProductNum('');
      } else {
        const data = await res.json();
        alert('Delete error: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error');
    }
  }

  // Build name, SKU & slug automatically
  const buildProductIdentity = (pType: string, num: string) => {
    const pt = PRODUCT_TYPES[pType];
    if (!pt || !num) return null;
    const padded = num.padStart(3, '0');
    const sku = `OSC${padded}`;
    const name = `${pt.productName}`;
    const slug = generateSlug(`${name}-${padded}`);
    return { sku, name, slug };
  };

  // Apply a product type (sets price, stripe_price_id, sizes, description)
  const applyProductType = (typeKey: string) => {
    if (typeKey === '') {
      setForm({ ...form, product_type: '', stripe_price_id: '', base_price: 0 });
      return;
    }
    const pt = PRODUCT_TYPES[typeKey];
    if (!pt) return;

    const identity = buildProductIdentity(typeKey, productNum);

    setForm({
      ...form,
      product_type: typeKey,
      stripe_price_id: pt.stripe_price_id,
      base_price: pt.base_price,
      sizes: pt.defaultSizes,
      description: pt.description,
      ...(identity ? { sku: identity.sku, name: identity.name, slug: identity.slug } : {}),
    });
  };

  // Apply product number
  const applyProductNum = (num: string) => {
    const clean = num.replace(/\D/g, '').slice(0, 3);
    setProductNum(clean);
    const identity = buildProductIdentity(form.product_type, clean);
    if (identity) {
      setForm({ ...form, sku: identity.sku, name: identity.name, slug: identity.slug });
    }
  };

  const isNewProduct = !product.id;

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-6">
      {/* 1. Product Type — determines price & Stripe Price ID */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">1. Product Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(PRODUCT_TYPES).map(([key, pt]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyProductType(key)}
              className={`font-mono text-xs py-3 px-3 rounded-lg border-2 transition-all text-left ${
                form.product_type === key
                  ? 'border-[#1B2B27] bg-[#1B2B27] text-white font-bold'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Design — button to open picker modal */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">2. Design</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDesignPicker(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-stone-200 hover:border-[#B8860B] transition-all bg-white"
          >
            {productNum && designList.find((d) => d.num === productNum.padStart(3, '0')) ? (
              <img
                src={designList.find((d) => d.num === productNum.padStart(3, '0'))!.url}
                alt={`OSC${productNum}`}
                className="w-12 h-12 rounded-lg object-contain bg-white border border-stone-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 text-lg">?</div>
            )}
            <div className="text-left">
              <p className="font-mono text-sm font-bold text-[#1B2B27]">
                {productNum ? `OSC${productNum}` : 'Select design'}
              </p>
              <p className="font-mono text-[10px] text-stone-400">Click to browse all designs</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-stone-400">OSC</span>
            <input
              type="text"
              value={productNum}
              onChange={(e) => applyProductNum(e.target.value)}
              className="input font-mono text-sm tracking-widest text-center"
              placeholder="022"
              maxLength={3}
              style={{ maxWidth: 80 }}
            />
          </div>
        </div>

        {/* Design picker modal */}
        {showDesignPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDesignPicker(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm font-bold text-[#1B2B27] uppercase tracking-wider">Select Design</h3>
                <button
                  type="button"
                  onClick={() => setShowDesignPicker(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-xl"
                >&times;</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {designList.map((design) => {
                  const isSelected = productNum === design.num;
                  return (
                    <div key={design.num} className="relative group">
                      <button
                        type="button"
                        onClick={() => { applyProductNum(design.num); setShowDesignPicker(false); }}
                        className={`relative rounded-xl border-2 overflow-hidden transition-all aspect-square w-full ${
                          isSelected
                            ? 'border-[#B8860B] ring-2 ring-[#B8860B] ring-offset-1'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <img
                          src={design.url}
                          alt={`Design OSC${design.num}`}
                          className="w-full h-full object-contain bg-white"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className={`absolute bottom-0 inset-x-0 text-center font-mono text-[9px] font-bold py-0.5 ${
                          isSelected ? 'bg-[#B8860B] text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          OSC{design.num}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDesignDelete(design.num); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >&times;</button>
                    </div>
                  );
                })}
                {/* Add new design button */}
                <label
                  className={`relative rounded-xl border-2 border-dashed border-stone-300 overflow-hidden transition-all aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#B8860B] hover:bg-amber-50 ${
                    designUploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDesignUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <span className="text-2xl text-stone-400">{designUploading ? '...' : '+'}</span>
                  <span className="font-mono text-[9px] text-stone-400 mt-1">
                    {designUploading ? 'Uploading' : 'New Art'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Name (editable) */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Product Name</label>
        <input
          type="text"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
          className="input"
          placeholder="e.g. OnSite Cotton Tee"
          required
        />
      </div>

      {/* URL Slug (auto-generated, editable) */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">URL Slug</label>
        <div className="flex items-center gap-0">
          <span className="font-mono text-xs text-stone-400 bg-stone-100 px-3 py-3 rounded-l-xl border border-r-0 border-gray-200">/products/</span>
          <input
            type="text"
            value={form.slug || ''}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            className="input rounded-l-none flex-1"
            placeholder="auto-generated-from-name"
          />
        </div>
        <p className="font-mono text-[10px] text-[#1B2B27]/40 mt-1">
          Auto-generated from name. Edit for a cleaner URL.
        </p>
      </div>

      {/* Tab: Shop or Members */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Show in</label>
        <div className="flex gap-2 mb-2">
          {(() => {
            const membersCat = categories.find(c => c.slug === 'members');
            const isMembers = membersCat && form.category_id === membersCat.id;
            return (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const shopCat = categories.find(c => c.slug === 'mens');
                    setForm({ ...form, category_id: shopCat?.id || null });
                  }}
                  className={`flex-1 font-mono text-sm py-2 px-4 rounded-lg border-2 transition-all ${
                    !isMembers
                      ? 'border-[#1B2B27] bg-[#1B2B27]/5 text-[#1B2B27] font-bold'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  SHOP
                </button>
                {membersCat && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, category_id: membersCat.id })}
                    className={`flex-1 font-mono text-sm py-2 px-4 rounded-lg border-2 transition-all ${
                      isMembers
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                        : 'border-stone-200 text-stone-400 hover:border-stone-300'
                    }`}
                  >
                    MEMBERS
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Collection — only for shop products */}
      {(() => {
        const membersCat = categories.find(c => c.slug === 'members');
        const isMembers = membersCat && form.category_id === membersCat.id;
        const collections = categories.filter(c => c.slug !== 'mens' && c.slug !== 'members' && c.slug !== 'womens');

        if (isMembers || collections.length === 0) return null;
        return (
          <div>
            <label className="block font-mono text-sm text-[#1B2B27] mb-2">Collection</label>
            <div className="flex flex-wrap gap-2">
              {collections.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, category_id: cat.id })}
                  className={`font-mono text-xs py-1.5 px-3 rounded-lg border-2 transition-all ${
                    form.category_id === cat.id
                      ? 'border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B] font-bold'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-[#1B2B27]/40 mt-1">
              Group by art collection (optional). Create collections from the dashboard.
            </p>
          </div>
        );
      })()}

      {/* SKU + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-sm text-[#1B2B27] mb-2">SKU</label>
          <input
            type="text"
            value={form.sku || ''}
            onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
            className="input font-mono font-bold tracking-wider"
            placeholder="OSC001"
            required
          />
          <p className="font-mono text-[10px] text-[#1B2B27]/40 mt-1">
            Auto: {productNum
              ? `OSC${productNum.padStart(3, '0')}`
              : 'Enter product number above'}
          </p>
        </div>
        <div>
          <label className="block font-mono text-sm text-[#1B2B27] mb-2">Price (CA$)</label>
          <input
            type="number"
            step="0.01"
            value={form.base_price || ''}
            onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
            className="input"
            required
          />
          <p className="font-mono text-[10px] text-[#1B2B27]/40 mt-1">
            {form.product_type ? 'Set by product type' : 'Select product type first'}
          </p>
        </div>
      </div>

      {/* Stripe Price ID (auto-set, shown for reference) */}
      {form.stripe_price_id && (
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="font-mono text-[10px] text-stone-400">
            Stripe Price: <span className="text-stone-600">{form.stripe_price_id}</span>
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Description</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input min-h-[100px]"
          rows={3}
        />
      </div>

      {/* Sizes — clickable boxes */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-3">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SIZES.map((size) => {
            const isSelected = (form.sizes || []).includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`font-mono text-sm px-4 py-2 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-[#1B2B27] bg-[#1B2B27] text-white'
                    : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors — square swatches */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-3">Colors</label>
        <div className="flex flex-wrap gap-3">
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = (form.colors || []).includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleColor(color.name)}
                title={color.name}
                className={`relative w-10 h-10 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-[#1B2B27] ring-2 ring-[#1B2B27]/20 scale-110'
                    : 'border-stone-300 hover:border-stone-400 hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
                    color.hex === '#FFFFFF' || color.hex === '#D3D3D3' ? 'text-[#1B2B27]' : 'text-white'
                  }`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photos by Color — each color gets its own section */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-1">
          {hasColors ? 'Photos by Color' : 'Images'}
        </label>
        {hasColors && (
          <p className="font-mono text-[10px] text-[#1B2B27]/40 mb-3">
            Add photos for each color. Click the <span className="text-amber-500">★</span> to set the primary product photo.
          </p>
        )}

        {hasColors ? (
          <div className="space-y-3">
            {selectedColors.map((color: string) => {
              const colorDef = AVAILABLE_COLORS.find(c => c.name === color);
              const colorImgs = (form.color_images || {})[color] || [];
              return (
                <div
                  key={color}
                  className={`rounded-xl border-2 p-3 transition-all ${
                    activeColorTab === color
                      ? 'border-[#1B2B27] bg-white'
                      : 'border-stone-200 bg-stone-50'
                  }`}
                  onClick={() => setActiveColorTab(color)}
                >
                  {/* Color header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-5 h-5 rounded-full border border-stone-300 shrink-0"
                      style={{ backgroundColor: colorDef?.hex || '#ccc' }}
                    />
                    <span className="font-mono text-xs font-medium text-[#1B2B27]">
                      {color}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {colorImgs.length} {colorImgs.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>

                  {/* Photos for this color */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {colorImgs.map((img: string, i: number) => (
                      <div key={`${color}-${i}`} className="relative group">
                        <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        {/* Primary star */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setForm({ ...form, primary_image: img }); }}
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all ${
                            form.primary_image === img
                              ? 'bg-amber-400 text-white shadow-sm'
                              : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Set as primary photo"
                        >
                          ★
                        </button>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(img, color); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          x
                        </button>
                      </div>
                    ))}
                    {colorImgs.length === 0 && (
                      <span className="font-mono text-[10px] text-stone-400 py-2">
                        No photos
                      </span>
                    )}
                  </div>

                  {/* Upload for this color */}
                  {activeColorTab === color && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="input text-xs"
                      />
                      {uploading && (
                        <p className="font-mono text-[10px] text-[#1B2B27]/60 mt-1">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* No colors — simple flat image list */
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.images || []).map((img: string, i: number) => (
                <div key={`flat-${i}`} className="relative group">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, primary_image: img })}
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                      form.primary_image === img
                        ? 'bg-amber-400 text-white shadow-sm'
                        : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    x
                  </button>
                </div>
              ))}
              {(form.images || []).length === 0 && (
                <p className="font-mono text-xs text-stone-400 py-4">No photos added</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="input text-sm"
            />
            {uploading && (
              <p className="font-mono text-xs text-[#1B2B27]/60 mt-1">Uploading...</p>
            )}
          </div>
        )}
      </div>

      {/* Primary image indicator */}
      {allImageUrls.length > 0 && form.primary_image && (
        <div className="bg-stone-50 rounded-lg p-3 flex items-center gap-3">
          <img src={form.primary_image} alt="" className="w-10 h-10 object-cover rounded-lg border-2 border-amber-400" />
          <p className="font-mono text-xs text-[#1B2B27]/60">
            <span className="text-amber-500">★</span> Primary product photo
          </p>
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-mono text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4"
          />
          Active
        </label>
        <label className="flex items-center gap-2 font-mono text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured ?? false}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="w-4 h-4"
          />
          Featured
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={saving} className="btn-accent flex-1 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
}
