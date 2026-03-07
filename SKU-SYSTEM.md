# OnSite Club - Sistema de Codificacao de Produtos (SKU)

## Visao Geral

Sistema escalavel de codigos para identificar produtos, designs e variantes de impressao.
Compativel com a tabela `app_shop_products` do Supabase e com o Stripe.

---

## Estrutura do SKU

```
{TIPO}-{DESIGN}-{IMPRESSAO}
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

### Nivel 2: DESIGN (Identificador unico do design/estampa)

Formato: **3 digitos sequenciais** - `001` a `999`

Cada design tem um registro no **Catalogo de Designs** (tabela abaixo).
O mesmo design pode ser usado em diferentes tipos de produto.

---

### Nivel 3: IMPRESSAO (Variante de impressao/tecido)

| Codigo | Variante        | Descricao                                       | Aplicacao                      |
|--------|----------------|--------------------------------------------------|--------------------------------|
| LT     | Light (Clara)  | Arte para impressao em tecido claro              | White, Light Grey              |
| DK     | Dark (Escura)  | Arte para impressao em tecido escuro             | Black, Charcoal, Greens        |
| GD     | Gold           | Arte para impressao em tecido gold/amber         | Amber, Gold tones              |
| UNI    | Universal      | Arte unica que funciona em qualquer tecido       | Bordados, estampas universais  |

> Para adicionar novas variantes: `NE` (Neon), `PS` (Pastel), `CM` (Camo), etc.

---

## Exemplos Completos de SKU

```
CTEE-001-LT   = Cotton Tee, Design #001, versao Light
CTEE-001-DK   = Cotton Tee, Design #001, versao Dark
CTEE-001-GD   = Cotton Tee, Design #001, versao Gold
STEE-001-LT   = Sport Tee, Design #001, versao Light
HOOD-015-DK   = Hoodie, Design #015, versao Dark
CAP-003-UNI   = Cap, Design #003, bordado universal
STK-010-UNI   = Sticker Kit, Design #010, universal
```

### SKU de Variante (com tamanho) - usado na tabela `product_variants`

```
{TIPO}-{DESIGN}-{IMPRESSAO}-{TAMANHO}
```

| SKU Completo      | Significado                                    |
|-------------------|------------------------------------------------|
| CTEE-001-LT-M    | Cotton Tee, Design 001, Light, Tamanho M       |
| CTEE-001-DK-XL   | Cotton Tee, Design 001, Dark, Tamanho XL       |
| HOOD-015-DK-L    | Hoodie, Design 015, Dark, Tamanho L            |
| CAP-003-UNI-OS   | Cap, Design 003, Universal, One Size           |

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

```
DSN-{DESIGN_ID}-{IMPRESSAO}.{ext}
```

Exemplos:
```
DSN-001-LT.png     = Design 001, versao para tecido claro
DSN-001-DK.png     = Design 001, versao para tecido escuro
DSN-001-GD.png     = Design 001, versao para tecido gold
DSN-002-LT.png     = Design 002, versao para tecido claro
DSN-002-DK.png     = Design 002, versao para tecido escuro
DSN-002-GD.png     = Design 002, versao para tecido gold
```

### Mockups / fotos de produto (para upload no Supabase Storage)

```
{SKU}-{SEQUENCIA}.{ext}
```

Exemplos:
```
CTEE-001-LT-1.webp    = Cotton Tee, Design 001, Light, foto 1
CTEE-001-LT-2.webp    = Cotton Tee, Design 001, Light, foto 2
CTEE-001-DK-1.webp    = Cotton Tee, Design 001, Dark, foto 1
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

Quando um cliente compra, o pedido (`order_items`) tera:
- `product_name`: ex. "OnSite Skull Roses Cotton Tee"
- `size`: ex. "L"
- `color`: ex. "Black"

Para identificar exatamente o que enviar:

1. **Pegue o SKU** do produto na tabela `app_shop_products`
   - Ex: `CTEE-007-DK`
2. **Decodifique:**
   - `CTEE` = Cotton Tee
   - `007` = Design #007 → consulte o Catalogo de Designs → "Skull Roses"
   - `DK` = Versao para tecido escuro
3. **Arquivo de arte:** `DSN-007-DK.png`
4. **Tamanho:** verifique o campo `size` do pedido

---

## Estrutura de Pastas Recomendada (para os arquivos de design)

```
designs/
├── DSN-001-LT.png
├── DSN-001-DK.png
├── DSN-001-GD.png
├── DSN-002-LT.png
├── DSN-002-DK.png
├── DSN-002-GD.png
├── ...
└── catalog.json          ← catalogo master (opcional, gerado automaticamente)
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

4. **Renomear:** Formato `DSN-{ID}-{VARIANTE}.{extensao_original}`
   - Ex: `minha-frase-camiseta-escura.png` → `DSN-001-DK.png`

5. **Gerar catalogo:** Apos renomear, criar/atualizar o arquivo `catalog.json`:

```json
{
  "version": "1.0",
  "updated_at": "2026-03-06",
  "designs": [
    {
      "id": "001",
      "original_name": "nome-original-do-arquivo",
      "short_name": "Nome Curto",
      "description": "Descricao da frase ou estampa",
      "theme": "QUOTE",
      "variants": ["LT", "DK", "GD"],
      "files": {
        "LT": "DSN-001-LT.png",
        "DK": "DSN-001-DK.png",
        "GD": "DSN-001-GD.png"
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
| name            | "Skull Roses Tee - Dark"               |
| slug            | "skull-roses-tee-dark"                 |
| sku             | "CTEE-007-DK"                          |
| product_type    | "cotton-tee"                           |
| stripe_price_id | "price_1T6yaQGntiIt3xkawNdIb3ek"      |
| base_price      | 29.99                                  |
| colors          | ["Black", "Charcoal"]                  |
| sizes           | ["XS", "S", "M", "L", "XL", "XXL"]    |
| color_images    | {"Black": ["url1"], "Charcoal": [...]} |

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
Hoje:     CTEE-001-LT  (Cotton Tee, Design 1, Light)
Amanha:   STEE-001-LT  (Sport Tee, mesmo Design 1, Light)
Proximo:  HOOD-001-DK  (Hoodie, mesmo Design 1, Dark)
Futuro:   LONG-001-NE  (Long Sleeve, mesmo Design 1, Neon - novo tipo + nova variante)
```
