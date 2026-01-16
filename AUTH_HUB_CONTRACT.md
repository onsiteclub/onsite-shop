# 📋 CONTRATO: SHOP → AUTH HUB

Este documento descreve exatamente como o OnSite Shop se integra com o Auth Hub para checkout.

---

## 1. NOVA ROTA NO AUTH HUB

```
auth.onsiteclub.ca/checkout/shop
```

### Query Parameters

| Param | Tipo | Descrição |
|-------|------|-----------|
| `cart_id` | UUID | ID do carrinho em `temp_carts` |
| `return_url` | URL | URL de retorno (shop.onsiteclub.ca) |

### Exemplo de URL
```
https://auth.onsiteclub.ca/checkout/shop?cart_id=abc123-def456&return_url=https://shop.onsiteclub.ca
```

---

## 2. TABELA `temp_carts` (Supabase)

```sql
CREATE TABLE temp_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- NULL se guest
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
```

### Estrutura do `items` (JSONB Array)

```typescript
interface CartItem {
  product_id: string;      // UUID do produto
  variant_id: string;      // UUID da variante
  name: string;            // "Camiseta OnSite Amber"
  color: string;           // "Amber"
  size: string;            // "M"
  price: number;           // 29.99
  quantity: number;        // 2
  image: string;           // URL completa
}
```

### Exemplo completo

```json
{
  "id": "abc123-def456-...",
  "user_id": null,
  "items": [
    {
      "product_id": "prod-001",
      "variant_id": "var-001-m-amber",
      "name": "Camiseta OnSite Amber",
      "color": "Amber",
      "size": "M",
      "price": 29.99,
      "quantity": 2,
      "image": "https://xxx.supabase.co/storage/v1/object/public/products/camiseta-amber.webp"
    }
  ],
  "subtotal": 59.98,
  "shipping": 0,
  "total": 59.98,
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-16T10:00:00Z"
}
```

---

## 3. FLUXO NO AUTH HUB

### 3.1 Página `/checkout/shop`

```typescript
// app/checkout/shop/page.tsx

export default async function ShopCheckout({ searchParams }) {
  const { cart_id, return_url } = searchParams;
  
  // 1. Buscar carrinho
  const { data: cart, error } = await supabase
    .from('temp_carts')
    .select('*')
    .eq('id', cart_id)
    .single();

  if (error || !cart) {
    redirect(`${return_url}/cart?error=cart_not_found`);
  }

  // 2. Verificar se expirou
  if (new Date(cart.expires_at) < new Date()) {
    redirect(`${return_url}/cart?error=cart_expired`);
  }

  // 3. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const loginUrl = new URL('/login', 'https://auth.onsiteclub.ca');
    loginUrl.searchParams.set('redirect', `/checkout/shop?cart_id=${cart_id}&return_url=${return_url}`);
    redirect(loginUrl.toString());
  }

  // 4. Buscar endereço padrão
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single();

  // 5. Renderizar página de checkout
  return <ShopCheckoutPage cart={cart} address={address} returnUrl={return_url} />;
}
```

### 3.2 Página de Checkout (UI)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Voltar ao Shop                              ONSITE CHECKOUT  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RESUMO DO PEDIDO                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [img] Camiseta OnSite Amber - M - Amber    x2      $59.98     │
│  [img] Boné OnSite Classic - Black          x1      $24.99     │
│                                                                 │
│                                    Subtotal:        $84.97     │
│                                    Frete:           GRÁTIS     │
│                                    ─────────────────────────   │
│                                    TOTAL:           $84.97     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ENDEREÇO DE ENTREGA                         [Alterar]         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  João Silva                                                     │
│  123 Main Street, Apt 4                                        │
│  Ottawa, ON K1A 0B1                                            │
│  Canada                                                         │
│                                                                 │
│  (ou formulário se não tem endereço)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           ┌───────────────────────────────────────┐             │
│           │         PAGAR COM STRIPE              │             │
│           │            $84.97 CAD                 │             │
│           └───────────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. API ENDPOINT

### `POST /api/checkout/shop`

```typescript
// app/api/checkout/shop/route.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { cart_id, address_id } = await req.json();

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Buscar carrinho
  const { data: cart } = await supabase
    .from('temp_carts')
    .select('*')
    .eq('id', cart_id)
    .single();

  if (!cart) {
    return Response.json({ error: 'Cart not found' }, { status: 404 });
  }

  // 3. Buscar endereço
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', address_id)
    .single();

  // 4. Criar ordem pendente
  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      shipping_address_id: address_id,
      shipping_address: address, // Snapshot
    })
    .select('id, order_number')
    .single();

  // 5. Criar Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: cart.items.map((item: any) => ({
      price_data: {
        currency: 'cad',
        unit_amount: Math.round(item.price * 100), // centavos
        product_data: {
          name: item.name,
          description: `${item.color} - ${item.size}`,
          images: item.image ? [item.image] : [],
        },
      },
      quantity: item.quantity,
    })),
    metadata: {
      type: 'shop_order',     // IMPORTANTE: Diferencia no webhook
      order_id: order.id,
      cart_id: cart_id,
      user_id: user.id,
    },
    success_url: `https://shop.onsiteclub.ca/order/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://shop.onsiteclub.ca/cart?cancelled=true`,
  });

  return Response.json({ 
    url: session.url,
    order_id: order.id,
    order_number: order.order_number,
  });
}
```

---

## 5. WEBHOOK (mesmo endpoint existente)

### Atualização em `/api/webhooks/stripe`

```typescript
// Adicionar ao handler de checkout.session.completed

case 'checkout.session.completed': {
  const session = event.data.object;
  
  // Detectar tipo pelo metadata
  if (session.metadata?.type === 'shop_order') {
    // ═══════════════════════════════════════════
    // É um pedido do E-COMMERCE
    // ═══════════════════════════════════════════
    
    const { order_id, cart_id, user_id } = session.metadata;

    // 1. Atualizar status do pedido
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    // 2. Buscar carrinho
    const { data: cart } = await supabase
      .from('temp_carts')
      .select('items')
      .eq('id', cart_id)
      .single();

    // 3. Criar order_items
    if (cart?.items) {
      const orderItems = cart.items.map((item: any) => ({
        order_id: order_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.name,
        product_image: item.image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
      }));

      await supabase.from('order_items').insert(orderItems);
    }

    // 4. Deletar carrinho temporário
    await supabase
      .from('temp_carts')
      .delete()
      .eq('id', cart_id);

    // 5. (Opcional) Decrementar estoque
    // for (const item of cart.items) {
    //   await supabase.rpc('decrement_variant_stock', {
    //     variant_id: item.variant_id,
    //     quantity: item.quantity
    //   });
    // }

    // 6. (Opcional) Enviar email de confirmação
    // await sendOrderConfirmationEmail(order_id, user_id);

    console.log(`✅ Shop order ${order_id} paid successfully`);

  } else if (session.metadata?.app === 'calculator') {
    // Assinatura do Calculator (código existente)
  } else if (session.metadata?.app === 'timekeeper') {
    // Assinatura do Timekeeper (código existente)
  }
  
  break;
}
```

---

## 6. TABELA `orders` (referência)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number VARCHAR(20) UNIQUE, -- OSC-2024-0001
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  shipping_address_id UUID,
  shipping_address JSONB,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

---

## 7. RESUMO DAS ROTAS

| Rota | Método | Descrição |
|------|--------|-----------|
| `/checkout/shop` | GET | Página de checkout (recebe cart_id) |
| `/api/checkout/shop` | POST | Cria Stripe Session |
| `/api/webhooks/stripe` | POST | Webhook (já existe, adicionar case) |

---

## 8. CHECKLIST PARA AUTH HUB

- [ ] Criar página `/checkout/shop`
- [ ] Criar API `/api/checkout/shop`
- [ ] Atualizar webhook para detectar `type: 'shop_order'`
- [ ] Testar fluxo completo
- [ ] Adicionar formulário de endereço (se não existir)

---

## 9. EXEMPLO DE TESTE

```bash
# 1. Criar carrinho de teste no Supabase
INSERT INTO temp_carts (items, subtotal, shipping, total) VALUES (
  '[{"product_id":"test","variant_id":"test-m","name":"Camiseta Teste","color":"Black","size":"M","price":29.99,"quantity":1,"image":""}]',
  29.99,
  0,
  29.99
) RETURNING id;

# 2. Acessar URL de checkout
# https://auth.onsiteclub.ca/checkout/shop?cart_id=<ID_RETORNADO>&return_url=http://localhost:3000

# 3. Fazer login se necessário
# 4. Preencher/confirmar endereço
# 5. Clicar em pagar
# 6. Completar no Stripe (usar cartão de teste 4242...)
# 7. Verificar redirecionamento para success page
# 8. Verificar tabela orders no Supabase
```
