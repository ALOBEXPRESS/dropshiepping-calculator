# Refatoração do productService.ts - Conteúdo Promocional

## Objetivo
Remover campos `promo_video_*` do productService.ts já que agora são gerenciados pela tabela `product_promotional_content`.

## Alterações Necessárias

### 1. Remover do tipo `ProductRow` (linha ~51)
```typescript
// REMOVER estas linhas:
promo_video_url?: string | null;
promo_video_copy?: string | null;
promo_video_channels?: string[] | null;
promo_video_channel_links?: Record<string, string> | null;
promo_video_channel_names?: Record<string, string> | null;
```

### 2. Remover do tipo `ProductPayload` (linha ~235)
```typescript
// REMOVER estas linhas:
promo_video_url?: string | null;
promo_video_copy?: string | null;
promo_video_channels?: string[] | null;
promo_video_channel_links?: Record<string, string> | null;
promo_video_channel_names?: Record<string, string> | null;
```

### 3. Remover do `mapProductRow` (linha ~804)
```typescript
// REMOVER estas linhas:
promoVideoUrl: item.promo_video_url ?? undefined,
promoVideoCopy: item.promo_video_copy ?? undefined,
promoVideoChannels: item.promo_video_channels ?? undefined,
promoVideoChannelLinks: item.promo_video_channel_links ?? undefined,
promoVideoChannelNames: item.promo_video_channel_names ?? undefined,
```

### 4. Remover do array SELECT (linha ~996)
```typescript
// REMOVER estas linhas do array de colunas:
'promo_video_url',
'promo_video_copy',
'promo_video_channels',
'promo_video_channel_links',
'promo_video_channel_names',
```

### 5. Remover da função `create` (linha ~1456)
```typescript
// REMOVER estas linhas:
promo_video_url: product.promoVideoUrl ?? null,
promo_video_copy: product.promoVideoCopy ?? null,
promo_video_channels: product.promoVideoChannels ?? null,
promo_video_channel_links: product.promoVideoChannelLinks ?? null,
promo_video_channel_names: product.promoVideoChannelNames ?? null,
```

### 6. Remover da função `update` (linha ~1681)
```typescript
// REMOVER estas linhas:
promo_video_url: product.promoVideoUrl ?? null,
promo_video_copy: product.promoVideoCopy ?? null,
promo_video_channels: product.promoVideoChannels ?? null,
promo_video_channel_links: product.promoVideoChannelLinks ?? null,
promo_video_channel_names: product.promoVideoChannelNames ?? null,
```

## IMPORTANTE: Manter campos `organic_*` temporariamente

Os campos `organic_channels`, `organic_channel_links` e `organic_channel_names` devem ser MANTIDOS no productService.ts durante o período de transição (dual-write).

Eles serão removidos apenas na Fase 4, após validação completa.

## Status
- ⏳ Aguardando execução manual ou script automatizado
