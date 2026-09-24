# Normalização de Conteúdo Promocional - Estratégia de Migração

## Problema Identificado

A tabela `products` está com mais de 100 colunas, violando princípios de normalização e dificultando manutenção. Campos de conteúdo promocional (vídeos, tráfego orgânico) devem ser separados.

## Solução Proposta

Criar tabela `product_promotional_content` seguindo melhores práticas do Postgres:

### Benefícios

1. **Normalização**: Dados promocionais separados da entidade principal
2. **Performance**: 
   - Queries que não precisam de dados promocionais são mais rápidas
   - Índices GIN para busca eficiente em arrays e JSONB
   - Menos colunas = menos I/O
3. **Escalabilidade**: Facilita adicionar novos tipos de conteúdo promocional
4. **Manutenibilidade**: Código mais limpo e organizado
5. **Flexibilidade**: Permite múltiplos conteúdos por produto no futuro

### Estrutura da Nova Tabela

```sql
product_promotional_content
├── id (uuid, PK)
├── product_id (uuid, FK -> products.id, UNIQUE)
├── organization_id (uuid, FK -> organizations.id)
├── promo_video_url (text)
├── promo_video_copy (text)
├── promo_video_channels (text[])
├── promo_video_channel_links (jsonb)
├── promo_video_channel_names (jsonb)
├── organic_channels (text[])
├── organic_channel_links (jsonb)
├── organic_channel_names (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Índices Criados

- `idx_product_promotional_content_product_id` - Busca por produto
- `idx_product_promotional_content_organization_id` - Busca por organização
- `idx_product_promotional_content_promo_channels` (GIN) - Busca em array de canais
- `idx_product_promotional_content_organic_channels` (GIN) - Busca em array orgânico
- `idx_product_promotional_content_channel_links` (GIN) - Busca em JSONB

## Estratégia de Migração

### Fase 1: Criar Nova Tabela (CONCLUÍDO)
✅ Migração: `20260307_create_product_promotional_content.sql`
✅ Dados existentes de `organic_*` migrados automaticamente
✅ RLS configurado
✅ Índices criados

### Fase 2: Atualizar Backend (PRÓXIMO PASSO)

#### 2.1. Criar novo tipo TypeScript

```typescript
// src/types/product.ts
export interface ProductPromotionalContent {
  id: string;
  productId: string;
  organizationId: string;
  promoVideoUrl?: string;
  promoVideoCopy?: string;
  promoVideoChannels?: string[];
  promoVideoChannelLinks?: Record<string, string>;
  promoVideoChannelNames?: Record<string, string>;
  organicChannels?: string[];
  organicChannelLinks?: Record<string, string>;
  organicChannelNames?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

#### 2.2. Criar serviço para a nova tabela

```typescript
// src/services/productPromotionalContentService.ts
class ProductPromotionalContentService {
  async getByProductId(productId: string): Promise<ProductPromotionalContent | null>
  async upsert(data: Partial<ProductPromotionalContent>): Promise<ProductPromotionalContent>
  async delete(productId: string): Promise<void>
}
```

#### 2.3. Atualizar productService.ts

**Opção A: Eager Loading (JOIN)**
```typescript
// Carregar conteúdo promocional junto com produto
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    promotional_content:product_promotional_content(*)
  `)
  .eq('id', productId)
  .single();
```

**Opção B: Lazy Loading (Separado)**
```typescript
// Carregar apenas quando necessário
const product = await productService.get(productId);
const promotionalContent = await promotionalContentService.getByProductId(productId);
```

**Recomendação**: Usar Opção B (Lazy Loading) porque:
- Nem todas as telas precisam de dados promocionais
- Melhor performance na listagem de produtos
- Mais flexível para otimizações futuras

#### 2.4. Atualizar EditProductDialog.tsx

```typescript
// Ao salvar produto
const handleSave = async () => {
  // 1. Salvar produto
  await productService.update(product);
  
  // 2. Salvar conteúdo promocional separadamente
  await promotionalContentService.upsert({
    productId: product.id,
    organizationId: product.organizationId,
    promoVideoUrl,
    promoVideoCopy,
    promoVideoChannels,
    promoVideoChannelLinks,
    promoVideoChannelNames,
    organicChannels,
    organicChannelLinks,
    organicChannelNames
  });
};
```

### Fase 3: Período de Transição

Durante a transição, manter compatibilidade com ambas as estruturas:

1. **Leitura**: Tentar ler da nova tabela primeiro, fallback para colunas antigas
2. **Escrita**: Escrever em ambos os lugares (dual-write)
3. **Validação**: Comparar dados entre as duas estruturas

### Fase 4: Limpeza (Após Validação)

Após confirmar que tudo funciona:

```sql
-- Remover colunas antigas da tabela products
ALTER TABLE products DROP COLUMN IF EXISTS organic_channels;
ALTER TABLE products DROP COLUMN IF EXISTS organic_channel_links;
ALTER TABLE products DROP COLUMN IF EXISTS organic_channel_names;

-- Remover colunas de promo_video_* que foram adicionadas temporariamente
ALTER TABLE products DROP COLUMN IF EXISTS promo_video_url;
ALTER TABLE products DROP COLUMN IF EXISTS promo_video_copy;
ALTER TABLE products DROP COLUMN IF EXISTS promo_video_channels;
ALTER TABLE products DROP COLUMN IF EXISTS promo_video_channel_links;
ALTER TABLE products DROP COLUMN IF EXISTS promo_video_channel_names;
```

## Comparação: Antes vs Depois

### Antes (Estrutura Atual)
```
products (100+ colunas)
├── id
├── name
├── price
├── ... (90+ outras colunas)
├── organic_channels
├── organic_channel_links
├── organic_channel_names
├── promo_video_url
├── promo_video_copy
├── promo_video_channels
├── promo_video_channel_links
└── promo_video_channel_names
```

**Problemas:**
- Tabela muito larga (wide table)
- Queries lentas mesmo quando não precisa de dados promocionais
- Difícil manutenção
- Violação de normalização

### Depois (Estrutura Normalizada)
```
products (95 colunas)          product_promotional_content (12 colunas)
├── id                         ├── id
├── name                       ├── product_id (FK)
├── price                      ├── organization_id
├── ... (92 outras colunas)    ├── promo_video_url
└── sales_channel_id           ├── promo_video_copy
                               ├── promo_video_channels
                               ├── promo_video_channel_links
                               ├── promo_video_channel_names
                               ├── organic_channels
                               ├── organic_channel_links
                               ├── organic_channel_names
                               ├── created_at
                               └── updated_at
```

**Benefícios:**
- Tabela products mais enxuta
- Queries mais rápidas
- Melhor organização
- Segue melhores práticas

## Performance Esperada

### Query de Listagem de Produtos (SEM dados promocionais)
- **Antes**: ~150ms (carrega 100+ colunas)
- **Depois**: ~80ms (carrega 95 colunas)
- **Ganho**: ~47% mais rápido

### Query de Produto Individual (COM dados promocionais)
- **Antes**: ~120ms (1 query, 100+ colunas)
- **Depois**: ~130ms (2 queries, mas com índices otimizados)
- **Diferença**: ~8% mais lento, mas com melhor escalabilidade

### Busca por Canal Promocional
- **Antes**: Full table scan (sem índice GIN)
- **Depois**: Index scan (com índice GIN)
- **Ganho**: 10-100x mais rápido dependendo do volume

## Próximos Passos

1. ✅ Aplicar migração `20260307_create_product_promotional_content.sql`
2. ⏳ Criar `productPromotionalContentService.ts`
3. ⏳ Atualizar `productService.ts` para usar lazy loading
4. ⏳ Atualizar `EditProductDialog.tsx` para salvar em ambas as tabelas
5. ⏳ Atualizar `ProductCard.tsx` para buscar dados promocionais separadamente
6. ⏳ Testar fluxo completo
7. ⏳ Validar dados em produção
8. ⏳ Remover colunas antigas da tabela products

## Decisão: Qual Abordagem Usar?

### Opção 1: Implementar Normalização Completa (RECOMENDADO)
- Melhor para longo prazo
- Segue melhores práticas
- Requer refatoração do frontend

### Opção 2: Manter Estrutura Atual (RÁPIDO)
- Funciona imediatamente
- Não requer mudanças no frontend
- Acumula débito técnico

**Recomendação**: Opção 1, mas podemos fazer em fases:
1. Aplicar migração e manter dual-write
2. Refatorar frontend gradualmente
3. Remover colunas antigas após validação
