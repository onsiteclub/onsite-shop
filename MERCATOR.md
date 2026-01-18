# MERCATOR - Shop Agent

> **"O comércio une os povos."** - *Provérbio medieval*

---

## [LOCKED] Identity

| Attribute | Value |
|-----------|-------|
| **Name** | MERCATOR |
| **Domain** | OnSite Shop |
| **Role** | Specialist AI Agent |
| **Orchestrator** | Blueprint (Blue) |
| **Version** | v1.0 |
| **Sync Date** | 2026-01-17 |

### Etymology

**MERCATOR** - Do latim "mercator" (comerciante). Gerardus Mercator (1512-1594) foi um cartógrafo flamengo que revolucionou a navegação marítima, conectando comerciantes do mundo inteiro. Nome perfeito para um agente de e-commerce que conecta trabalhadores canadenses aos produtos que precisam.

---

## [LOCKED] Hierarchy

```
┌─────────────────────────────────────────────┐
│             BLUEPRINT (Blue)                │
│           Orchestrator Agent                │
├─────────────────────────────────────────────┤
│  - Define schemas (SQLs em migrations/)     │
│  - Coordena entre agentes                   │
│  - Mantém documentação central              │
│  - Emite diretivas para subordinados        │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   MERCATOR    │       │   (outros)    │
│     Shop      │       │    agents     │
└───────────────┘       └───────────────┘
```

**MERCATOR recebe diretivas de Blue e:**
1. Implementa código no repositório `onsite-shop`
2. Segue schemas definidos por Blue (não cria tabelas)
3. Reporta implementações a Blue
4. Documenta decisões técnicas neste arquivo

---

## [LOCKED] Rules

1. **Schemas são de Blue** - MERCATOR não cria tabelas/migrations
2. **Código é de MERCATOR** - Implementação Next.js/React
3. **Reportar sempre** - Após implementar, enviar relatório a Blue
4. **Documentar aqui** - Decisões técnicas ficam neste arquivo
5. **Stripe é a fonte de verdade** - Webhooks atualizam banco

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | 14.2.21 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (Email + Google OAuth) | - |
| Payments | Stripe Checkout + Webhooks | 20.1.2 |
| State | Zustand (persisted to localStorage) | 4.5.2 |
| Styling | Tailwind CSS + Custom CSS | 3.4.1 |
| Font | JetBrains Mono (Google Fonts) | - |
| Deploy | Vercel | - |

---

## Project Structure

```
onsite-shop/
├── app/
│   ├── layout.tsx              # Root layout + metadata + fonts
│   ├── page.tsx                # Main shop (floating products, 1384 lines)
│   ├── globals.css             # Design system + motion + tokens
│   ├── admin/
│   │   └── page.tsx            # Admin dashboard (CRUD products)
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts        # Stripe Checkout session
│   │   └── webhook/
│   │       └── route.ts        # Stripe webhooks handler
│   ├── cart/
│   │   └── page.tsx            # Shopping cart + checkout flow
│   ├── checkout/
│   │   └── success/
│   │       └── page.tsx        # Payment success + cart clear
│   └── login/
│       └── page.tsx            # Login/Register (Supabase Auth)
├── lib/
│   ├── store/
│   │   └── cart.ts             # Zustand cart store (249 lines)
│   └── supabase/
│       ├── client.ts           # Browser client (with fallback)
│       └── server.ts           # Server-side client
└── public/
    └── assets/                 # Logo, background images
        ├── onsite-logo.png
        └── blueprint-bg.png
```

> **Nota:** Imagens de produtos são carregadas via URLs do Supabase Storage, não de `public/products/`

---

## UI/UX Premium Features

### Motion System

| Component | Location | Effect |
|-----------|----------|--------|
| `useAmbientParticles(count)` | page.tsx:24-70 | Floating dust motes, opacity 5-20%, drift 0.015px/frame |
| `useInertialValue(target)` | page.tsx:73-95 | 80-150ms lag via ref-based smoothing |
| `CustomCursor` | page.tsx:98-154 | Desktop cursor with "VIEW" label, hides on touch |
| `BackgroundSystem` | page.tsx:157-233 | Blueprint grid + parallax + vignette mask |
| `FloatingProductCard` | page.tsx:823-971 | Hover preview, micro-compression (0.98 scale) |
| `DraggableScrollBar` | page.tsx:236-327 | Interactive scroll progress (desktop only) |

### Responsive Layout

| Viewport | Products | Layout | Card Size |
|----------|----------|--------|-----------|
| Mobile (<768px) | 3 | Center zone only, X: 30-70% | w-44 (176px) |
| Desktop (>=768px) | 10 | Three zones (left/center/right) | w-44 to w-64 |

### Animation Loop

```typescript
// page.tsx:1092-1140 - Continuous animation, never stops
useEffect(() => {
  const animate = () => {
    setFloatingProducts(prev => {
      let newY = product.y - product.speed + scrollDeltaRef.current;
      // Loop products when off-screen
      if (newY < -25) { /* reset to bottom with new X position */ }
    });
    animationRef.current = requestAnimationFrame(animate);
  };
  animationRef.current = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationRef.current);
}, []);
```

### Accessibility

- `prefers-reduced-motion` support (page.tsx:30)
- Touch device detection for cursor hiding
- Keyboard navigation for modals

---

## Database Tables (Supabase)

> Schemas gerenciados por Blue em `migrations/001_schema.sql`

### Shop Tables

| Table | Purpose |
|-------|---------|
| `app_shop_categories` | Categorias de produtos |
| `app_shop_products` | Produtos |
| `app_shop_product_variants` | Variantes (tamanho, cor) |
| `app_shop_orders` | Pedidos |
| `app_shop_order_items` | Itens dos pedidos |
| `app_shop_carts` | Carrinhos (temp) |

### Product Schema

```sql
id            UUID PRIMARY KEY
name          TEXT NOT NULL
slug          TEXT UNIQUE
description   TEXT
base_price    DECIMAL NOT NULL
images        JSONB (array of URLs)
sizes         JSONB (array of strings)
colors        JSONB (array of strings)
is_active     BOOLEAN DEFAULT true
is_featured   BOOLEAN DEFAULT false
is_published  BOOLEAN DEFAULT false
category_id   UUID REFERENCES categories(id)
```

---

## Cart Store (Zustand)

> **Arquivo:** `lib/store/cart.ts` (249 linhas)

### State

```typescript
interface CartItem {
  product_id: string;
  variant_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  shipping: number;  // $0 if subtotal >= $50, else $9.99
  total: number;
}

// Constants
const FREE_SHIPPING_THRESHOLD = 50;  // CAD
const SHIPPING_COST = 9.99;          // CAD
```

### Actions

| Action | Location | Description |
|--------|----------|-------------|
| `addItem(item)` | lines 55-80 | Add or increment quantity |
| `removeItem(variant_id)` | lines 82-87 | Remove item by variant_id |
| `updateQuantity(variant_id, qty)` | lines 89-101 | Update item quantity |
| `clearCart()` | lines 103-110 | Empty cart completely |
| `getCartForCheckout()` | lines 112-120 | Format cart for Stripe API |
| `saveCartAndGetCheckoutUrl()` | lines 175-213 | Auth Hub integration helper |

### Persistence

```typescript
// localStorage key: 'onsite-cart'
persist(
  (set, get) => ({ /* store */ }),
  { name: 'onsite-cart' }
)
```

---

## Payment Flow

```
1. User clicks "Checkout" in /cart
   ↓
2. POST /api/checkout
   - Validates cart
   - Creates order (status: pending)
   - Creates Stripe Checkout Session
   ↓
3. Redirect to Stripe Checkout
   - User enters payment + shipping
   ↓
4. Payment Success → /checkout/success
   - Cart cleared
   ↓
5. Stripe Webhook (checkout.session.completed)
   - Updates order status to "paid"
   - Creates order_items records
   - Stores shipping address
```

---

## Webhook Handler

### Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Update order → paid |
| `customer.subscription.updated` | Update subscription |
| `customer.subscription.deleted` | Cancel subscription |
| `invoice.payment_failed` | Mark past_due |

### Metadata Pattern

```typescript
metadata: {
  order_id: string,
  order_number: string,
  type: 'shop_order',
  items: JSON.stringify([{
    product_id,
    variant_id,
    name,
    quantity,
    price
  }])
}
```

---

## CSS Architecture

> **Arquivo:** `app/globals.css`

### Design Tokens

```css
:root {
  /* Brand Colors */
  --onsite-primary: #1B2B27;     /* Dark green */
  --onsite-light: #FBFAFC;       /* Off-white */
  --onsite-amber: #B8860B;       /* Dark goldenrod (updated for contrast) */

  /* Grain Palette */
  --grain-light: #D8D4C8;
  --grain-mid: #C9C4B5;
  --grain-dark: #B8B3A4;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
}
```

### Component Classes

| Class | Location | Usage |
|-------|----------|-------|
| `.btn-primary` | lines 60-64 | Dark button with white text |
| `.btn-accent` | lines 66-70 | Amber/gold button (CTA) |
| `.btn-secondary` | lines 72-76 | White button with border |
| `.card` | lines 78-80 | White card with blur backdrop |
| `.input` | lines 82-86 | Form input styling |
| `.micro-press:active` | lines 185-187 | 0.98 scale on click |

### Animations

| Animation | Keyframes | Usage |
|-----------|-----------|-------|
| `fadeIn` | lines 104-107 | Opacity 0 → 1 |
| `slideUp` | lines 114-123 | Y translate + fade |
| `microPress` | lines 179-183 | Scale 1 → 0.98 → 1 |
| `subtle-fade-in` | lines 174-176 | Very subtle opacity animation |

### Reduced Motion

```css
/* lines 222-248 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Admin Dashboard

### Features

- Login required (checks `admin_users` table)
- CRUD operations for products
- Draft/Publish workflow (`is_published` flag)
- Image URL management
- Size and color variants

### Access Control

```typescript
// Check admin access
const { data: admin } = await supabase
  .from('shop_admins')
  .select('id')
  .eq('email', user.email)
  .single();

if (!admin) redirect('/');
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# URLs
NEXT_PUBLIC_SHOP_URL=https://shop.onsiteclub.ca
NEXT_PUBLIC_AUTH_URL=https://auth.onsiteclub.ca
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-17 | v1.0 | Documento de identidade criado por Blue |
| 2026-01-18 | v1.1 | Alinhamento estrutural com código real (MERCATOR) |
| 2026-01-18 | v1.2 | Checkout + Stripe + Supabase integration (MERCATOR) |

---

## Reports to Blue

*Seção para relatórios de implementação de MERCATOR para Blue*

### Report #002 - Checkout Integration (2026-01-18)

**Status:** Completo

**Diretiva recebida:** Checkout + Stripe + Supabase

#### Arquivos Criados/Atualizados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `app/checkout/page.tsx` | CRIADO | Auth gate - verifica login antes de Stripe |
| `app/checkout/login/page.tsx` | CRIADO | Login/Signup antes do checkout |
| `app/api/checkout/route.ts` | ATUALIZADO | Usa `app_shop_orders`, adiciona `user_id` no metadata |
| `app/api/webhook/route.ts` | ATUALIZADO | Usa `app_shop_orders`, `app_shop_order_items` |
| `app/cart/page.tsx` | ATUALIZADO | Redireciona para `/checkout` em vez de API |

#### Fluxo Implementado

```
┌─────────────────────────────────────────────────────────────────┐
│  USUÁRIO NÃO LOGADO                                             │
├─────────────────────────────────────────────────────────────────┤
│  1. /cart → Clica "Checkout"                                    │
│  2. /checkout → Verifica auth → NÃO LOGADO                      │
│  3. /checkout/login → Login ou Signup (Supabase Auth)           │
│  4. /checkout → Verifica auth → LOGADO                          │
│  5. POST /api/checkout → Cria order + Stripe session            │
│  6. Redirect → Stripe Checkout (payment + shipping)             │
│  7. /checkout/success → Limpa carrinho                          │
│  8. Webhook → Atualiza order status = 'paid'                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Webhook Events

| Event | Ação |
|-------|------|
| `checkout.session.completed` | Update `app_shop_orders` → `status: 'paid'`, create `app_shop_order_items` |
| `payment_intent.payment_failed` | Update `app_shop_orders` → `status: 'cancelled'` |

#### Metadata no Stripe

```typescript
metadata: {
  order_id: string,       // UUID do pedido
  order_number: string,   // OS-XXXXX
  user_id: string,        // UUID do usuário
  type: 'shop_order',     // Diferencia de subscriptions
  items: JSON.stringify([{
    product_id, variant_id, name, quantity, price, size, color
  }])
}
```

#### Tabelas Utilizadas (Schema by Blue)

- `app_shop_orders` - Pedidos
- `app_shop_order_items` - Itens dos pedidos

#### Checklist

- [x] `/checkout` verifica auth
- [x] `/checkout/login` funciona (email + Google OAuth)
- [x] Stripe session criada com metadata completo
- [x] Webhook recebe `checkout.session.completed`
- [x] Webhook atualiza `app_shop_orders` (status: paid)
- [x] Webhook cria `app_shop_order_items`
- [x] Webhook trata `payment_intent.payment_failed`

#### Env Vars Necessárias

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

### Report #001 - Alinhamento Estrutural (2026-01-18)

**Status:** Completo

Atualizações realizadas no documento:
- Tech Stack com versões exatas (Next.js 14.2.21, Stripe 20.1.2, Zustand 4.5.2, Tailwind 3.4.1)
- Project Structure refletindo estrutura real de pastas
- Motion System com line numbers precisos
- Responsive Layout documentation (mobile/desktop)
- Cart Store com todas as actions e line numbers
- CSS Architecture com tokens atualizados (--onsite-amber: #B8860B)
- Accessibility features documentados

**Diferenças corrigidas:**
- `public/products/` → `public/assets/` (imagens via Supabase URLs)
- `--onsite-amber: #F6C343` → `#B8860B` (melhor contraste)
- Adicionado `DraggableScrollBar` ao Motion System

---

### Pending Implementation

- [x] ~~Checkout flow com auth gate~~
- [x] ~~Webhook gravando no Supabase~~
- [ ] Integração com Auth Hub para checkout unificado (futuro)
- [ ] Sistema de notificação de pedidos
- [ ] Order history page (`/orders`)
- [ ] Email notifications (transactional)
- [ ] Inventory tracking
- [ ] Discount codes (Stripe Coupons)
- [ ] Multiple currencies (USD)

---

*Última atualização: 2026-01-18*
