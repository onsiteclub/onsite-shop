# PROMPT PARA WINDSURF/CASCADE — ONSITE SHOP STRIPE INTEGRATION
# Cole este prompt inteiro no agente de código

CONTEXTO:
Estou configurando o Stripe para o OnSite Shop (e-commerce standalone em Next.js 14, fora do monorepo Eagle).
Localização: c:\Dev\Onsite-club\onsite-shop
O checkout é SEM LOGIN — cliente compra direto, eu recebo email com o pedido.
Tudo em TEST MODE por enquanto.

O .env.local já está configurado com todas as keys reais (Stripe, Supabase, Resend).

═══════════════════════════════════════════════════════════════
TAREFA 1: CRIAR lib/stripe-config.ts
═══════════════════════════════════════════════════════════════

Crie o arquivo lib/stripe-config.ts com esta configuração exata:

```typescript
export const STRIPE_PRODUCTS = {
  'cotton-tee': {
    name: 'OnSite Cotton Tee',
    priceId: 'price_1T6yaQGntilt3xkawNdlb3ek',
    productId: 'prod_U58s8pYszcjO7j',
    price: 2999, // centavos CAD
    sku: 'OS-CT',
    sizes: ['M', 'L', 'XL'],
  },
  'sport-tee': {
    name: 'OnSite Sport Tee',
    priceId: 'price_1T6ybPGntilt3xkaA7NoCQ4e',
    productId: 'prod_U58tmZi8KX4fXK',
    price: 3499,
    sku: 'OS-ST',
    sizes: ['M', 'L', 'XL'],
  },
  'hoodie': {
    name: 'OnSite Hoodie',
    priceId: 'price_1T6ydlGntilt3xkaOI5uKbgH',
    productId: 'prod_U58vUGbH17DXoB',
    price: 4999,
    sku: 'OS-HD',
    sizes: ['M', 'L', 'XL'],
  },
  'cap': {
    name: 'OnSite Cap',
    priceId: 'price_1T6ylSGntilt3xka7i5gMdhM',
    productId: 'prod_U593HNSnkMblYq',
    price: 3999,
    sku: 'OS-CP',
    sizes: ['M', 'L', 'XL'],
  },
  'sticker': {
    name: 'OnSite Sticker',
    priceId: 'price_1T6yfRGntilt3xkaNuMeFJSF',
    productId: 'prod_U58xuPhAzhTrgJ',
    price: 999,
    sku: 'OS-SK',
    sizes: [],
  },
} as const;

export type ProductKey = keyof typeof STRIPE_PRODUCTS;

export const SHIPPING_OPTIONS = [
  {
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: 999, currency: 'cad' },
      display_name: 'Ontario',
      delivery_estimate: {
        minimum: { unit: 'business_day' as const, value: 3 },
        maximum: { unit: 'business_day' as const, value: 5 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: 1199, currency: 'cad' },
      display_name: 'Montreal / Quebec',
      delivery_estimate: {
        minimum: { unit: 'business_day' as const, value: 3 },
        maximum: { unit: 'business_day' as const, value: 7 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: 1299, currency: 'cad' },
      display_name: 'Maritimes (NB/NS/PEI/NL)',
      delivery_estimate: {
        minimum: { unit: 'business_day' as const, value: 5 },
        maximum: { unit: 'business_day' as const, value: 10 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: 1499, currency: 'cad' },
      display_name: 'Western Canada (MB/SK/AB/BC)',
      delivery_estimate: {
        minimum: { unit: 'business_day' as const, value: 5 },
        maximum: { unit: 'business_day' as const, value: 10 },
      },
    },
  },
  {
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: 1999, currency: 'cad' },
      display_name: 'Northern Canada (YT/NT/NU)',
      delivery_estimate: {
        minimum: { unit: 'business_day' as const, value: 7 },
        maximum: { unit: 'business_day' as const, value: 14 },
      },
    },
  },
];

export const FREE_SHIPPING_OPTION = {
  shipping_rate_data: {
    type: 'fixed_amount' as const,
    fixed_amount: { amount: 0, currency: 'cad' },
    display_name: 'Free Shipping (orders over $50)',
  },
};

export const FREE_SHIPPING_THRESHOLD = 5000; // $50.00 em centavos
```

═══════════════════════════════════════════════════════════════
TAREFA 2: ALTERAR app/api/checkout/route.ts
═══════════════════════════════════════════════════════════════

Reescreva o checkout route para usar os Price IDs pré-cadastrados no Stripe
em vez de price_data inline. O fluxo:

1. Recebe POST com array de items do carrinho. Cada item tem:
   { product_key: string, color: string, size: string, design: string, quantity: number }

2. Mapeia cada item para line_items do Stripe usando STRIPE_PRODUCTS[item.product_key].priceId

3. Calcula o subtotal. Se >= FREE_SHIPPING_THRESHOLD (5000 centavos),
   adiciona FREE_SHIPPING_OPTION como primeira opção do shipping_options.
   Sempre inclui todas as SHIPPING_OPTIONS também.

4. Passa os detalhes do pedido (cor, tamanho, design, SKU) como metadata
   na session, NÃO nos line_items (metadata de line_item não é retornada no webhook).

5. Configuração da session:
   - mode: 'payment'
   - payment_method_types: ['card']
   - shipping_address_collection: { allowed_countries: ['CA'] }
   - shipping_options: (dinâmico, com ou sem frete grátis)
   - success_url: `${NEXT_PUBLIC_SHOP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
   - cancel_url: `${NEXT_PUBLIC_SHOP_URL}/cart`
   - metadata: { items_detail: JSON.stringify([...detalhes de cada item]) }

Exemplo de metadata.items_detail:
```json
[
  {"sku":"OS-CT","design":"OnSite Logo","color":"Black","size":"L","qty":2},
  {"sku":"OS-HD","design":"Build Different","color":"Navy","size":"XL","qty":1}
]
```

NÃO salve pedido no Supabase neste ponto. O webhook faz isso.
NÃO verifique autenticação. Checkout é aberto.
NÃO use user_id — pode ser null.

═══════════════════════════════════════════════════════════════
TAREFA 3: ALTERAR app/api/webhook/route.ts
═══════════════════════════════════════════════════════════════

O webhook handler para checkout.session.completed deve:

1. Verificar a assinatura com STRIPE_WEBHOOK_SECRET (já faz isso)

2. Retrieve a session com line_items expandidos:
```typescript
const session = await stripe.checkout.sessions.retrieve(
  event.data.object.id,
  { expand: ['line_items.data.price.product', 'shipping_details'] }
);
```

3. Extrair:
   - items_detail do session.metadata (JSON.parse)
   - shipping address do session.shipping_details
   - customer email do session.customer_details.email
   - amount_total do session.amount_total
   - shipping cost do session.shipping_cost

4. Salvar pedido no Supabase (tabela: use o nome que JÁ EXISTE no banco,
   verificar se é 'orders' ou 'app_shop_orders'):
   - status: 'paid'
   - email: customer email
   - items: items_detail (JSONB)
   - shipping_address: shipping details (JSONB)
   - total: amount_total
   - shipping_cost: shipping cost
   - stripe_session_id: session.id
   - created_at: now()

5. Enviar email via Resend para SHOP_ADMIN_EMAIL (dev@onsiteclub.ca):
   - Subject: "🛒 Novo Pedido OnSite Shop - [session.id curto]"
   - Body HTML com:
     - Lista de produtos (nome, SKU, cor, tamanho, quantidade)
     - Endereço de entrega completo
     - Email do cliente
     - Valor total + frete
     - Link para o Stripe Dashboard do pagamento

6. Enviar email de confirmação para o CLIENTE também:
   - Subject: "OnSite Club - Order Confirmed! ✅"
   - Body HTML simples com resumo do pedido e "We'll ship your order soon!"

═══════════════════════════════════════════════════════════════
TAREFA 4: ATUALIZAR lib/store/cart.ts (Zustand)
═══════════════════════════════════════════════════════════════

O CartItem precisa incluir os campos necessários para o checkout:

```typescript
interface CartItem {
  product_key: string;  // chave do STRIPE_PRODUCTS ('cotton-tee', 'hoodie', etc)
  name: string;
  design: string;       // nome do design/arte escolhido
  color: string;
  size: string;
  price: number;        // em centavos
  quantity: number;
  image: string;
}
```

Manter a lógica existente de:
- addItem, removeItem, updateQuantity, clearCart
- Frete grátis acima de $50, senão mostrar aviso no cart
- Persist com localStorage key 'onsite-cart'

Remover:
- saveCartAndGetCheckoutUrl() se existir
- Qualquer referência a temp_carts
- Qualquer referência a variant_id (não usamos mais)

═══════════════════════════════════════════════════════════════
TAREFA 5: ATUALIZAR app/checkout/page.tsx
═══════════════════════════════════════════════════════════════

Simplificar o checkout page:
- Se carrinho vazio → redireciona para /cart
- Senão → POST para /api/checkout com os items do cart store
- O body do POST deve ser:
```json
{
  "items": [
    {
      "product_key": "cotton-tee",
      "color": "Black",
      "size": "L",
      "design": "OnSite Logo",
      "quantity": 2
    }
  ]
}
```
- Recebe { url } → window.location.href = url (redirect para Stripe)
- NÃO verificar auth
- NÃO salvar nada no Supabase aqui

═══════════════════════════════════════════════════════════════
TAREFA 6: LIMPAR CÓDIGO LEGADO
═══════════════════════════════════════════════════════════════

- Remover app/checkout/login/ (pasta inteira)
- Remover MOCK_PRODUCTS do app/page.tsx (ou mover para um fallback simples)
- Corrigir query no page.tsx: trocar .eq('is_published', true) por .eq('is_active', true)
- Verificar nomes de tabela no Supabase real: são 'products' ou 'app_shop_products'?
  Usar o nome que existe de fato no banco.
- Remover referências a temp_carts no schema/código

═══════════════════════════════════════════════════════════════
NÃO FAZER (IMPORTANTE)
═══════════════════════════════════════════════════════════════

- NÃO criar login/auth para checkout
- NÃO adicionar tax/HST (fase futura)
- NÃO alterar o schema do Supabase
- NÃO criar admin dashboard
- NÃO instalar @stripe/stripe-js (não é necessário para checkout redirect)
- NÃO usar price_data inline no checkout (usar os priceId cadastrados)

═══════════════════════════════════════════════════════════════
RESUMO DOS PRODUTOS (referência)
═══════════════════════════════════════════════════════════════

| Produto          | Preço  | SKU   | Price ID                              |
|------------------|--------|-------|---------------------------------------|
| Cotton Tee       | $29.99 | OS-CT | price_1T6yaQGntilt3xkawNdlb3ek       |
| Sport Tee        | $34.99 | OS-ST | price_1T6ybPGntilt3xkaA7NoCQ4e       |
| Hoodie           | $49.99 | OS-HD | price_1T6ydlGntilt3xkaOI5uKbgH       |
| Cap              | $39.99 | OS-CP | price_1T6ylSGntilt3xka7i5gMdhM       |
| Sticker          | $9.99  | OS-SK | price_1T6yfRGntilt3xkaNuMeFJSF       |

═══════════════════════════════════════════════════════════════
FRETE (referência)
═══════════════════════════════════════════════════════════════

| Região              | Províncias       | Frete   |
|---------------------|------------------|---------|
| Ontario             | ON               | $9.99   |
| Montreal / Quebec   | QC               | $11.99  |
| Maritimes           | NB, NS, PEI, NL | $12.99  |
| Western Canada      | MB, SK, AB, BC   | $14.99  |
| Northern Canada     | YT, NT, NU       | $19.99  |
| GRÁTIS              | Todas (> $50)    | $0.00   |

Comece pela Tarefa 1 e vá em ordem. Me mostre cada arquivo alterado.
