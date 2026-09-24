# Instruções para Correção dos Campos Promo Video

## Problema Identificado
Os campos `promoVideoChannels`, `promoVideoChannelLinks` e `promoVideoChannelNames` não estão sendo salvos no banco de dados porque o `productService.ts` não os mapeia.

## Alterações Já Realizadas
✅ Adicionados campos no tipo `ProductRow` (linha ~51)
✅ Adicionados campos no tipo `ProductPayload` (linha ~235)
✅ Adicionado mapeamento na função `mapProductRow` (linha ~804)
✅ Adicionados campos no array de colunas SELECT (linha ~996)
✅ Criada migração do banco: `supabase/migrations/20260307_add_promo_video_fields.sql`

## Alterações Pendentes (FAZER MANUALMENTE)

### 1. Na função `create` (linha ~1456):
Adicionar após `organic_channel_names`:
```typescript
      promo_video_url: product.promoVideoUrl ?? null,
      promo_video_copy: product.promoVideoCopy ?? null,
      promo_video_channels: product.promoVideoChannels ?? null,
      promo_video_channel_links: product.promoVideoChannelLinks ?? null,
      promo_video_channel_names: product.promoVideoChannelNames ?? null,
```

### 2. Na função `update` (linha ~1681):
Adicionar após `organic_channel_names`:
```typescript
      promo_video_url: product.promoVideoUrl ?? null,
      promo_video_copy: product.promoVideoCopy ?? null,
      promo_video_channels: product.promoVideoChannels ?? null,
      promo_video_channel_links: product.promoVideoChannelLinks ?? null,
      promo_video_channel_names: product.promoVideoChannelNames ?? null,
```

## Passos para Completar a Correção

1. **Aplicar a migração do banco de dados**:
   ```bash
   supabase db push
   ```
   Ou executar manualmente via Dashboard SQL Editor

2. **Editar manualmente o arquivo `src/services/productService.ts`**:
   - Abrir o arquivo
   - Procurar por `organic_channel_names: product.organicChannelNames ?? null,`
   - Adicionar as 5 linhas dos campos `promo_video_*` logo após
   - Fazer isso em DOIS lugares: função `create` (linha ~1456) e função `update` (linha ~1681)

3. **Reiniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Testar o fluxo completo**:
   - Abrir edit dialog de um produto
   - Ir para "Tráfego Orgânico"
   - Selecionar TikTok
   - Adicionar URL: `https://www.tiktok.com/@alobexpress/video/7601557121062358280`
   - Clicar em "Salvar"
   - Verificar console logs (linhas 610-613, 758-761 do EditProductDialog.tsx)
   - Verificar no Supabase se os dados foram salvos
   - Recarregar a página e verificar se o URL persiste
   - Verificar se o vídeo aparece no ProductCard tela 2

## Localização Exata das Alterações

### Função create (linha ~1456):
```typescript
async create(product: Omit<ProductItem, 'id'>): Promise<ProductItem> {
  const insertPayload: ProductPayload = {
    // ... outros campos ...
    video_generation_llm: product.videoGenerationLlm,
    organic_channels: product.organicChannels ?? null,
    organic_channel_links: product.organicChannelLinks ?? null,
    organic_channel_names: product.organicChannelNames ?? null,
    // ADICIONAR AQUI:
    promo_video_url: product.promoVideoUrl ?? null,
    promo_video_copy: product.promoVideoCopy ?? null,
    promo_video_channels: product.promoVideoChannels ?? null,
    promo_video_channel_links: product.promoVideoChannelLinks ?? null,
    promo_video_channel_names: product.promoVideoChannelNames ?? null,
    // FIM DA ADIÇÃO
    shopee_use_ads: product.shopeeUseAds ?? null,
    // ... resto do código ...
  };
}
```

### Função update (linha ~1681):
```typescript
async update(product: ProductItem): Promise<ProductItem> {
  const updatePayload: ProductPayload = {
    // ... outros campos ...
    video_generation_llm: product.videoGenerationLlm,
    organic_channels: product.organicChannels ?? null,
    organic_channel_links: product.organicChannelLinks ?? null,
    organic_channel_names: product.organicChannelNames ?? null,
    // ADICIONAR AQUI:
    promo_video_url: product.promoVideoUrl ?? null,
    promo_video_copy: product.promoVideoCopy ?? null,
    promo_video_channels: product.promoVideoChannels ?? null,
    promo_video_channel_links: product.promoVideoChannelLinks ?? null,
    promo_video_channel_names: product.promoVideoChannelNames ?? null,
    // FIM DA ADIÇÃO
    shopee_use_ads: product.shopeeUseAds ?? null,
    // ... resto do código ...
  };
}
```

## Verificação Final
Após fazer as alterações, verificar que:
- ✅ Migração do banco aplicada
- ✅ Campos adicionados na função `create`
- ✅ Campos adicionados na função `update`
- ✅ Servidor reiniciado
- ✅ Teste completo realizado
- ✅ URL do TikTok salva e persiste
- ✅ Vídeo aparece no ProductCard
