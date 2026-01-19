'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  category_id: string;
  category?: { slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
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
    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (cats) setCategories(cats);

    // Load products (app_shop_products - schema by Blue)
    const { data: prods } = await supabase
      .from('app_shop_products')
      .select('*, category:categories(slug)')
      .order('created_at', { ascending: false });

    if (prods) {
      setProducts(prods);
      // Check if there are unpublished products
      const unpublished = prods.some((p: Product) => !p.is_published);
      setHasUnpublishedChanges(unpublished);
    }
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
      showToast('Alterações publicadas no Shop!', 'success');
    } catch (error: any) {
      showToast('Erro ao publicar: ' + error.message, 'error');
    } finally {
      setPublishing(false);
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

      // Check if user is admin
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
      if (product.id) {
        // Update - mark as unpublished (draft)
        const { error } = await supabase
          .from('app_shop_products')
          .update({
            name: product.name,
            slug: product.slug,
            description: product.description,
            base_price: product.base_price,
            images: product.images,
            sizes: product.sizes,
            colors: product.colors,
            is_active: product.is_active,
            is_featured: product.is_featured,
            is_published: false, // Mark as draft until published
            category_id: product.category_id,
          })
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Insert - new products start as unpublished
        const { error } = await supabase
          .from('app_shop_products')
          .insert({
            name: product.name,
            slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-'),
            description: product.description,
            base_price: product.base_price,
            images: product.images || [],
            sizes: product.sizes || [],
            colors: product.colors || [],
            is_active: product.is_active ?? true,
            is_featured: product.is_featured ?? false,
            is_published: false, // New products are drafts
            category_id: product.category_id,
          });

        if (error) throw error;
      }

      await loadData();
      setEditingProduct(null);
      showToast('Produto salvo com sucesso!', 'success');
    } catch (error: any) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase
      .from('app_shop_products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
    } else {
      await loadData();
      showToast('Produto excluído!', 'success');
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

  async function handleImageUpload(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (error) {
      alert('Erro no upload: ' + error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-[#1B2B27]">Carregando...</p>
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
                placeholder="admin@exemplo.com"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-sm text-[#1B2B27] mb-2">Senha</label>
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
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/" className="font-mono text-sm text-[#1B2B27]/60 hover:text-[#1B2B27]">
              ← Voltar para loja
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
          <h1 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2">Acesso Negado</h1>
          <p className="font-mono text-sm text-[#1B2B27]/60 mb-4">
            {user.email} não tem permissão de admin.
          </p>
          <button onClick={handleLogout} className="btn-secondary">
            Sair
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
                ← Voltar
              </button>
              <span className="font-mono text-sm text-white/40">|</span>
              <h2 className="font-mono text-sm font-medium text-white">
                {editingProduct.id ? 'Editar Produto' : 'Novo Produto'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
              >
                Ver Loja
              </Link>
              <button
                onClick={() => setEditingProduct(null)}
                className="font-mono text-xs text-white/60 hover:text-white px-3 py-1.5"
              >
                Cancelar
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
              {user.email} • {products.length} produtos
              {hasUnpublishedChanges && (
                <span className="ml-2 text-amber-600">• Alterações não publicadas</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="bg-[#1B2B27] hover:bg-[#2a3f39] text-white font-mono text-sm py-2 px-4 rounded-xl transition-colors"
            >
              📦 Pedidos
            </Link>
            {hasUnpublishedChanges && (
              <button
                onClick={handlePublishAll}
                disabled={publishing}
                className="bg-green-500 hover:bg-green-600 text-white font-mono text-sm py-2 px-4 rounded-xl disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Publicando...' : 'Publicar no Shop'}
              </button>
            )}
            <Link href="/" className="btn-secondary">Ver Loja</Link>
            <button onClick={handleLogout} className="font-mono text-sm text-red-500">
              Sair
            </button>
          </div>
        </div>

        {/* Add product button */}
        <button
          onClick={() => setEditingProduct({
            id: '',
            name: '',
            slug: '',
            description: '',
            base_price: 0,
            images: [],
            sizes: ['P', 'M', 'G', 'GG'],
            colors: [],
            is_active: true,
            is_featured: false,
            is_published: false,
            category_id: categories[0]?.id || '',
          })}
          className="btn-accent mb-6"
        >
          + Adicionar Produto
        </button>

        {/* Products grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 ${
                !product.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-20 h-20 bg-stone-100 rounded-xl flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono font-medium text-[#1B2B27] truncate">
                    {product.name}
                  </h3>
                  <p className="font-mono text-sm text-[#1B2B27]/60">
                    {product.category?.slug || 'sem categoria'}
                  </p>
                  <p className="font-mono text-lg font-bold text-[#F6C343]">
                    CA${product.base_price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 font-mono text-xs py-2 bg-stone-100 rounded-lg hover:bg-stone-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`flex-1 font-mono text-xs py-2 rounded-lg ${
                    product.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="font-mono text-xs py-2 px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Product Form Component
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
  const [form, setForm] = useState(product);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);

    if (url) {
      setForm({ ...form, images: [...(form.images || []), url] });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(form.images || [])];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-4">
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Nome</label>
        <input
          type="text"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-sm text-[#1B2B27] mb-2">Preço (CA$)</label>
          <input
            type="number"
            step="0.01"
            value={form.base_price || ''}
            onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block font-mono text-sm text-[#1B2B27] mb-2">Categoria</label>
          <select
            value={form.category_id || ''}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="input"
            required
          >
            <option value="">Selecione...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Descrição</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input min-h-[100px]"
          rows={3}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">Imagens</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.images?.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="input"
        />
        {uploading && <p className="text-sm text-[#1B2B27]/60 mt-1">Enviando...</p>}
      </div>

      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">
          Tamanhos (separados por vírgula)
        </label>
        <input
          type="text"
          value={(form.sizes || []).join(', ')}
          onChange={(e) => setForm({ ...form, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          className="input"
          placeholder="P, M, G, GG"
        />
      </div>

      <div>
        <label className="block font-mono text-sm text-[#1B2B27] mb-2">
          Cores (separadas por vírgula)
        </label>
        <input
          type="text"
          value={(form.colors || []).join(', ')}
          onChange={(e) => setForm({ ...form, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          className="input"
          placeholder="Preto, Branco, Amber"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Ativo
        </label>
        <label className="flex items-center gap-2 font-mono text-sm">
          <input
            type="checkbox"
            checked={form.is_featured ?? false}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
          />
          Destaque
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={saving} className="btn-accent flex-1 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
      </div>
    </form>
  );
}
