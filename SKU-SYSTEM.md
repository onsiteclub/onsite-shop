# OnSite Club - Sistema de Codificacao de Produtos (SKU)

## Visao Geral

Sistema escalavel de codigos para identificar produtos, designs e variantes de impressao.
Compativel com a tabela `app_shop_products` do Supabase e com o Stripe.

---

## Estrutura do SKU

```
{TIPO}-{ARTE}{NUMERO}
```

### Nivel 1: TIPO (Tipo do produto)

| Codigo | Produto        | Preco (CAD) | stripe_price_id                    |
|--------|---------------|-------------|-------------------------------------|
| CTEE   | Cotton Tee    | $29.99      | price_1T6yaQGntiIt3xkawNdIb3ek     |
| STEE   | Sport Tee     | $34.99      | price_1T6ybPGntiIt3xkaA7NoCQ4e     |
| HOOD   | Hoodie        | $49.99      | price_1T6ydIGntiIt3xkaOI5uKbgH     |
| CAP    | Cap           | $39.99      | price_1T6ylSGntiIt3xka7i5gMdhM     |
| STK    | Sticker Kit   | $9.99       | price_1T6yfRGntiIt3xkaNuMeFJSF     |

> Para adicionar novos tipos: use 3-4 letras maiusculas descritivas.
> Ex: `TANK` (regata), `CROP` (cropped), `JACK` (jaqueta), `LONG` (manga longa)

---

### Nivel 2: ARTE (Tipo de arte) + NUMERO (Design unico)

Formato: **{CODIGO_ARTE}{3 digitos}** — ex: `FR001`, `DW015`, `MX003`

| Codigo | Tipo de Arte        | Descricao                                         | Qtd estimada |
|--------|--------------------|----------------------------------------------------|--------------|
| FR     | Frase              | Arte escrita — frase impressa na camiseta          | ~50+         |
| DW     | Desenho            | Arte grafica — estampa/ilustracao                  | ~20+         |
| MX     | Mix / Vintage      | Mistura de frase + desenho, estilo autoral/vintage | variavel     |

O numero (001-999) identifica qual frase/desenho/mix especifico.
O mesmo numero com o mesmo tipo de arte = mesmo design em produtos diferentes.

---

### Variante de Impressao (para arquivos de arte)

Cada design existe em ate 3 versoes de impressao (para diferentes cores de tecido):

| Sufixo | Variante        | Aplicacao                      |
|--------|----------------|--------------------------------|
| LT     | Light (Clara)  | White, Light Grey              |
| DK     | Dark (Escura)  | Black, Charcoal, Greens        |
| GD     | Gold           | Amber, Gold tones              |
| UNI    | Universal      | Bordados, estampas universais  |

> Este sufixo e usado nos ARQUIVOS de arte, nao no SKU do produto.

---

## Exemplos Completos de SKU

```
CTEE-FR001    = Cotton Tee, Frase #001
CTEE-FR042    = Cotton Tee, Frase #042
CTEE-DW005    = Cotton Tee, Desenho #005
STEE-FR001    = Sport Tee, Frase #001 (mesma frase, produto diferente)
STEE-DW012    = Sport Tee, Desenho #012
HOOD-MX003    = Hoodie, Mix/Vintage #003
CAP-DW001     = Cap, Desenho #001
STK-DW010     = Sticker Kit, Desenho #010
```

### SKU de Variante (com tamanho) - usado na tabela `product_variants`

```
{TIPO}-{ARTE}{NUMERO}-{TAMANHO}
```

| SKU Completo      | Significado                                    |
|-------------------|------------------------------------------------|
| CTEE-FR001-M      | Cotton Tee, Frase #001, Tamanho M              |
| CTEE-DW005-XL     | Cotton Tee, Desenho #005, Tamanho XL           |
| STEE-FR042-L      | Sport Tee, Frase #042, Tamanho L               |
| HOOD-MX003-L      | Hoodie, Mix #003, Tamanho L                    |
| CAP-DW001-OS      | Cap, Desenho #001, One Size                    |

**Tamanhos validos:** `XS` | `S` | `M` | `L` | `XL` | `XXL` | `OS` (One Size)

---

## Catalogo de Designs (Design Registry)

Esta tabela e a referencia mestre. Cada design recebe um numero unico permanente.

| Design ID | Nome Curto         | Descricao / Frase                              | Tema       | Variantes Disponiveis | Data Criacao |
|-----------|-------------------|-------------------------------------------------|------------|----------------------|--------------|
| 001       | (a preencher)     | (frase ou descricao da estampa)                 | (tema)     | LT / DK / GD         | 2026-03      |
| 002       | (a preencher)     |                                                 |            | LT / DK / GD         | 2026-03      |
| 003       | (a preencher)     |                                                 |            | LT / DK / GD         | 2026-03      |
| ...       | ...               | ...                                             | ...        | ...                  | ...          |

### Temas Sugeridos

| Codigo Tema | Descricao               |
|-------------|------------------------|
| BRAND       | OnSite Club branding    |
| SKULL       | Caveiras / Skulls       |
| FAITH       | Fe / Frases religiosas  |
| NATURE      | Natureza                |
| STREET      | Urbano / Street         |
| QUOTE       | Frases motivacionais    |
| TRADE       | Construction / Trades   |
| HUMOR       | Humor / Fun             |
| CUSTOM      | Designs exclusivos      |

---

## Nomenclatura de Arquivos de Design

### Arquivos de arte/estampa (source files)

Cada arte tem 3 versoes para diferentes cores de tecido:

```
{ARTE}{NUMERO}-{IMPRESSAO}.{ext}
```

Exemplos:
```
FR001-LT.png     = Frase 001, versao para tecido claro
FR001-DK.png     = Frase 001, versao para tecido escuro
FR001-GD.png     = Frase 001, versao para tecido gold
DW005-LT.png     = Desenho 005, versao para tecido claro
DW005-DK.png     = Desenho 005, versao para tecido escuro
DW005-GD.png     = Desenho 005, versao para tecido gold
MX003-LT.png     = Mix 003, versao para tecido claro
```

### Mockups / fotos de produto (para upload no Supabase Storage)

```
{SKU}-{SEQUENCIA}.{ext}
```

Exemplos:
```
CTEE-FR001-1.webp    = Cotton Tee, Frase 001, foto 1
CTEE-FR001-2.webp    = Cotton Tee, Frase 001, foto 2
STEE-DW005-1.webp    = Sport Tee, Desenho 005, foto 1
```

---

## Mapeamento: Cor da Camiseta -> Variante de Impressao

Quando o cliente seleciona uma **cor**, o sistema sabe qual variante de impressao usar:

| Cor da Camiseta       | Variante de Impressao | Sufixo |
|-----------------------|----------------------|--------|
| White                 | Light                | LT     |
| Light Grey            | Light                | LT     |
| Black                 | Dark                 | DK     |
| Charcoal              | Dark                 | DK     |
| Construction Green    | Dark                 | DK     |
| Green                 | Dark                 | DK     |
| Amber                 | Gold                 | GD     |

---

## Como Consultar uma Compra

Quando um cliente compra, o pedido tera:
- `product_name`: ex. "Frase #007 — Cotton Tee"
- `sku`: ex. `CTEE-FR007`
- `size`: ex. "L"
- `color`: ex. "Black"

Para identificar exatamente o que enviar:

1. **Leia o SKU:** `CTEE-FR007`
   - `CTEE` = Cotton Tee
   - `FR` = Frase
   - `007` = Frase #007 → consulte o Catalogo de Designs
2. **Cor do tecido** → determina qual arquivo de arte usar:
   - Black → `FR007-DK.png` (versao escura)
   - White → `FR007-LT.png` (versao clara)
   - Amber → `FR007-GD.png` (versao gold)
3. **Tamanho:** campo `size` do pedido (ex: "L")
4. **Resumo:** Imprimir `FR007-DK.png` em Cotton Tee preta, tamanho L

---

## Estrutura de Pastas Recomendada (para os arquivos de design)

```
designs/
├── frases/
│   ├── FR001-LT.png
│   ├── FR001-DK.png
│   ├── FR001-GD.png
│   ├── FR002-LT.png
│   ├── FR002-DK.png
│   ├── FR002-GD.png
│   └── ... (ate FR050+)
├── desenhos/
│   ├── DW001-LT.png
│   ├── DW001-DK.png
│   ├── DW001-GD.png
│   └── ... (ate DW020+)
├── mix/
│   ├── MX001-LT.png
│   ├── MX001-DK.png
│   ├── MX001-GD.png
│   └── ...
└── catalog.json          ← catalogo master
```

---

## Diretiva para Agente de Renomeacao

### Instrucoes para o agente que vai renomear os arquivos:

**Contexto:** Existe uma pasta com arquivos de design de camisetas. Cada design/frase
existe em ate 3 versoes: para tecido claro (LT), tecido escuro (DK) e tecido gold (GD).

**Regras de renomeacao:**

1. **Identificar grupos:** Agrupe arquivos que representam o mesmo design/frase
   em variantes diferentes (claro, escuro, gold).

2. **Atribuir Design ID:** Cada grupo recebe um numero sequencial de 3 digitos
   comecando em `001`. A ordem de atribuicao deve ser alfabetica pelo nome original.

3. **Identificar variante:** Determine a variante de impressao de cada arquivo:
   - Arquivos com indicacao de "light", "clara", "claro", "white", "branco" → `LT`
   - Arquivos com indicacao de "dark", "escura", "escuro", "black", "preto" → `DK`
   - Arquivos com indicacao de "gold", "amber", "dourado", "ouro" → `GD`
   - Se nao houver indicacao clara, analise a imagem (fundo transparente com arte
     clara = LT, arte clara = DK inverso, etc.)

4. **Renomear:** Formato `{TIPO_ARTE}{ID}-{VARIANTE}.{extensao_original}`
   - Frase: `minha-frase-escura.png` → `FR001-DK.png`
   - Desenho: `skull-design-clara.png` → `DW001-LT.png`
   - Mix: `vintage-badge-gold.png` → `MX001-GD.png`

5. **Mover para subpasta:** Mover frases para `frases/`, desenhos para `desenhos/`, mix para `mix/`

6. **Gerar catalogo:** Apos renomear, criar/atualizar o arquivo `catalog.json`:

```json
{
  "version": "1.0",
  "updated_at": "2026-03-07",
  "designs": [
    {
      "id": "FR001",
      "type": "phrase",
      "original_name": "nome-original-do-arquivo",
      "description": "Texto exato da frase",
      "variants": ["LT", "DK", "GD"],
      "files": {
        "LT": "frases/FR001-LT.png",
        "DK": "frases/FR001-DK.png",
        "GD": "frases/FR001-GD.png"
      }
    },
    {
      "id": "DW001",
      "type": "drawing",
      "original_name": "skull-design",
      "description": "Caveira com rosas",
      "variants": ["LT", "DK", "GD"],
      "files": {
        "LT": "desenhos/DW001-LT.png",
        "DK": "desenhos/DW001-DK.png",
        "GD": "desenhos/DW001-GD.png"
      }
    }
  ]
}
```

6. **Gerar relatorio:** Ao final, produzir uma tabela com:
   - Design ID | Nome Original | Nome Novo | Variante | Tema Sugerido

---

## Integracao com Supabase (app_shop_products)

Ao cadastrar um produto no admin, use o SKU no formato:

```
CTEE-{DESIGN_ID}-{IMPRESSAO}
```

Campos relevantes na tabela `app_shop_products`:

| Campo           | Valor Exemplo                          |
|-----------------|----------------------------------------|
| name            | "Frase #007 — Cotton Tee"              |
| slug            | "frase-007-cotton-tee"                 |
| sku             | "CTEE-FR007"                           |
| product_type    | "cotton-tee"                           |
| stripe_price_id | "price_1T6yaQGntiIt3xkawNdIb3ek"      |
| base_price      | 29.99                                  |
| colors          | ["Black", "White", "Amber"]            |
| sizes           | ["XS", "S", "M", "L", "XL", "XXL"]    |
| color_images    | {"Black": ["url1"], "White": [...]}    |

---

## Escalabilidade

O sistema suporta:
- **999 designs** (expandivel para 4 digitos: `0001`-`9999`)
- **Novos tipos de produto** (basta adicionar codigo de 3-4 letras)
- **Novas variantes de impressao** (basta adicionar codigo de 2-3 letras)
- **Temas ilimitados** para organizacao
- **Multiplos produtos por design** (mesmo design em Cotton Tee, Sport Tee, Hoodie)

### Exemplo de crescimento:

```
Hoje:     CTEE-FR001    (Cotton Tee, Frase 1)
Amanha:   STEE-FR001    (Sport Tee, mesma Frase 1)
Proximo:  HOOD-FR001    (Hoodie, mesma Frase 1)
Futuro:   LONG-DW025    (Long Sleeve, Desenho 25 — novo tipo de produto)
```
