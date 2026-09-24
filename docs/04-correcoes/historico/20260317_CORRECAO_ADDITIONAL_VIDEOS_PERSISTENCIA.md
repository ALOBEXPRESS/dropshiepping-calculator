# Correção: Persistência de Vídeos Adicionais e Copies por Canal

## Problema
O usuário adicionou um novo vídeo adicional na interface de edição do produto, mas ele não apareceu na tela 3 do card do produto após salvar.

## Causa Raiz
Os campos `promoVideoChannelCopies` e `additionalVideos` estavam:
- ✅ Definidos nos tipos TypeScript (`src/types/calculator.ts`)
- ✅ Sendo salvos no `EditProductDialog` (`src/components/calculator/EditProductDialog.tsx`)
- ✅ Sendo renderizados no `ProductCard` (`src/components/calculator/ProductCard.tsx`)
- ❌ **NÃO** existiam no schema do banco de dados
- ❌ **NÃO** estavam nos tipos `ProductRow` e `ProductPayload` do `ProductService`
- ❌ **NÃO** estavam sendo mapeados no `mapProductRow`
- ❌ **NÃO** estavam sendo incluídos nos métodos `create` e `update`

Resultado: Os dados eram salvos no frontend mas descartados silenciosamente ao persistir no banco.

## Solução Implementada

### 1. Migration do Banco de Dados
Criado arquivo: `supabase/migrations/20260307_add_promo_video_copies_additional_videos.sql`

```sql
-- Add promo_video_channel_copies column (JSONB object with channel keys and copy text values)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS promo_video_channel_copies JSONB DEFAULT '{}'::jsonb;

-- Add additional_videos column (JSONB array of video objects with id, url, and copy)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS additional_videos JSONB DEFAULT '[]'::jsonb;
```

**Aplicado com sucesso no projeto Supabase.**

### 2. Atualização do ProductService (`src/services/productService.ts`)

#### 2.1. Tipos ProductRow e ProductPayload
Adicionados os campos:
```typescript
promo_video_channel_copies?: Record<string, string> | null;
additional_videos?: Array<{ id: string; url: string; copy: string }> | null;
```

#### 2.2. Função mapProductRow
Adicionado mapeamento:
```typescript
promoVideoChannelCopies: item.promo_video_channel_copies ?? {},
additionalVideos: item.additional_videos ?? [],
```

#### 2.3. Método create
Adicionado ao `insertPayload`:
```typescript
promo_video_channel_copies: product.promoVideoChannelCopies ?? null,
additional_videos: product.additionalVideos ?? null,
```

#### 2.4. Método update
Adicionado ao `updatePayload`:
```typescript
promo_video_channel_copies: product.promoVideoChannelCopies ?? null,
additional_videos: product.additionalVideos ?? null,
```

#### 2.5. productSelectColumnList
Adicionadas as colunas:
```typescript
'promo_video_channel_copies',
'additional_videos',
```

## Estrutura dos Dados

### promoVideoChannelCopies
Objeto JSONB com chaves sendo os canais e valores sendo o texto da copy:
```json
{
  "tiktok": "Confira este produto incrível!",
  "instagram": "Oferta por tempo limitado!",
  "youtube": "Assista ao vídeo completo"
}
```

### additionalVideos
Array JSONB de objetos de vídeo:
```json
[
  {
    "id": "uuid-1",
    "url": "https://www.tiktok.com/@user/video/123",
    "copy": "Vídeo demonstrando o produto em uso"
  },
  {
    "id": "uuid-2",
    "url": "https://streamable.com/abc123",
    "copy": "Depoimento de cliente satisfeito"
  }
]
```

## Fluxo de Dados Completo

1. **Edição**: Usuário adiciona vídeo e copy no `EditProductDialog`
2. **Salvamento**: `handleSave` inclui `promoVideoChannelCopies` e `additionalVideos` no objeto `updated`
3. **Persistência**: `ProductService.update()` salva os campos no banco via Supabase
4. **Carregamento**: `ProductService.getAll()` busca os dados incluindo os novos campos
5. **Mapeamento**: `mapProductRow` converte os dados do banco para o formato TypeScript
6. **Renderização**: `ProductCard` exibe os vídeos adicionais nas telas 3, 4, etc.

## Testes Necessários

1. ✅ Compilação TypeScript (`npx tsc --noEmit`) - PASSOU
2. ⏳ Build do projeto (`npm run build`) - EM PROGRESSO
3. ⏳ Testar adicionar vídeo adicional e verificar persistência
4. ⏳ Testar adicionar copy para cada canal
5. ⏳ Verificar renderização dos vídeos adicionais no card
6. ⏳ Testar com múltiplos vídeos adicionais

## Próximos Passos

1. Aguardar conclusão do build
2. Testar o fluxo completo:
   - Editar produto
   - Adicionar vídeo adicional com URL e copy
   - Salvar
   - Recarregar página
   - Verificar se o vídeo aparece na tela 3 do card
3. Verificar se a copy está sendo exibida corretamente
4. Testar com diferentes tipos de URLs (TikTok, Streamable, etc.)

## Arquivos Modificados

- `supabase/migrations/20260307_add_promo_video_copies_additional_videos.sql` (NOVO)
- `src/services/productService.ts` (MODIFICADO)
  - Tipos ProductRow e ProductPayload
  - Função mapProductRow
  - Métodos create e update
  - productSelectColumnList

## Status
✅ Migration aplicada
✅ Código atualizado
✅ TypeScript compilando
⏳ Build em progresso
⏳ Testes pendentes
