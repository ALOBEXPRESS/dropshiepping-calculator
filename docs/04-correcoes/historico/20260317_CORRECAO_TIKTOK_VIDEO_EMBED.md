# Correção: TikTok Video Embed e Autoplay

## Problema Identificado

1. **URL do TikTok não está sendo salva**: O campo está sendo preenchido mas não persiste após salvar
2. **Vídeo não reproduz automaticamente**: O vídeo do TikTok não inicia automaticamente no card

## Análise

### Estrutura de Dados
- O sistema usa `promoVideoChannelLinks` para armazenar URLs dos canais
- O campo `promoVideoChannelLinks[' tiktok']` deve conter a URL do vídeo do TikTok

### Limitações do TikTok
O TikTok não permite embed direto de vídeos através de URLs simples. Existem duas opções:

1. **TikTok Embed API** (Recomendado)
   - Requer conversão da URL para formato embed: `https://www.tiktok.com/embed/v2/{VIDEO_ID}`
   - Suporta autoplay através do parâmetro `autoplay=1`

2. **URL Direta** (Limitado)
   - URLs diretas do TikTok não funcionam em iframes
   - Não há suporte para autoplay

## Correções Aplicadas

### 1. ProductCard.tsx - Conversão de URL do TikTok

```typescript
// Extrair URL do iframe ou usar URL direta
const iframeMatch = videoLink.match(/src=["']([^"']+)["']/);
let videoUrl = iframeMatch && iframeMatch[1] ? iframeMatch[1] : videoLink;

// Converter URL do TikTok para embed
if (videoUrl.includes('tiktok.com') && !videoUrl.includes('/embed/')) {
  const tiktokMatch = videoUrl.match(/\/video\/(\d+)/);
  if (tiktokMatch && tiktokMatch[1]) {
    videoUrl = `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
  }
}

const isIframe = videoLink.includes('<iframe') || videoLink.includes('streamable.com') || videoUrl.includes('tiktok.com/embed');
```

### 2. ProductCard.tsx - Iframe com Autoplay

```typescript
<iframe
  src={videoUrl}
  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
  allowFullScreen
  className="absolute inset-0 h-full w-full border-none"
  style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, overflow: 'hidden' }}
  title={`Vídeo ${channelLabel}`}
  loading="lazy"
/>
```

## Como Usar

### Formato de URL Aceito

Cole a URL completa do vídeo do TikTok:
```
https://www.tiktok.com/@alobexpress/video/7601557121062358280?is_from_webapp=1&sender_device=pc&web_id=7581502487019652625
```

O sistema automaticamente:
1. Extrai o ID do vídeo: `7601557121062358280`
2. Converte para URL embed: `https://www.tiktok.com/embed/v2/7601557121062358280`
3. Adiciona permissões de autoplay no iframe

### Testando

1. Vá em **Produtos** → **Editar Produto**
2. Selecione o canal **TikTok**
3. Cole a URL do vídeo do TikTok
4. Clique em **Salvar**
5. Navegue até a tela 2 do card (seta direita)
6. O vídeo deve aparecer e reproduzir automaticamente

## Limitações Conhecidas

### Autoplay do TikTok
- O TikTok pode bloquear autoplay dependendo das configurações do navegador
- Alguns navegadores exigem interação do usuário antes de permitir autoplay
- O vídeo pode não reproduzir automaticamente em modo incógnito

### Política de Embed do TikTok
- O TikTok pode restringir embed de vídeos privados ou com restrições de idade
- Vídeos removidos ou bloqueados não serão exibidos
- A API de embed do TikTok pode ter limitações de taxa

## Próximos Passos

### Melhorias Futuras

1. **Validação de URL**
   - Adicionar validação para verificar se a URL do TikTok é válida
   - Mostrar preview do vídeo antes de salvar

2. **Fallback para Erro**
   - Exibir mensagem amigável se o vídeo não carregar
   - Permitir re-upload ou nova URL

3. **Suporte a Outros Formatos**
   - Aceitar URLs curtas do TikTok (vm.tiktok.com)
   - Suportar códigos de embed diretos

4. **Cache de Thumbnails**
   - Salvar thumbnail do vídeo para exibição rápida
   - Reduzir dependência da API do TikTok

## Debugging

### Verificar se a URL está sendo salva

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Edite o produto e salve
4. Procure pela requisição de update/create
5. Verifique se `promoVideoChannelLinks.tiktok` contém a URL

### Verificar se o vídeo está sendo renderizado

1. Inspecione o elemento do vídeo
2. Verifique se o iframe tem o atributo `src` correto
3. Verifique se há erros no console relacionados ao TikTok
4. Teste em modo anônimo para descartar extensões do navegador

## Referências

- [TikTok Embed Documentation](https://developers.tiktok.com/doc/embed-videos)
- [HTML5 Video Autoplay Policy](https://developer.chrome.com/blog/autoplay/)
- [TikTok oEmbed API](https://developers.tiktok.com/doc/oembed-api)


---

## ROOT CAUSE IDENTIFIED (2026-03-07):
The issue is that the database columns for promotional video data might not exist or aren't properly mapped in the ProductService.

### Database Schema Issue:
The following columns need to exist in the `products` table:
- `promo_video_channels` (text[]) - Array of selected channel keys
- `promo_video_channel_links` (jsonb) - Maps channel keys to video URLs
- `promo_video_channel_names` (jsonb) - Maps channel keys to custom group names
- `promo_video_url` (text) - Legacy single video URL field
- `promo_video_copy` (text) - Marketing copy for videos

### Solution Created:
1. **Migration File**: Created `supabase/migrations/20260307_add_promo_video_fields.sql`
   - Adds all required columns if they don't exist
   - Uses conditional logic to avoid errors if columns already exist
   - Includes comments documenting each column's purpose

## NEXT STEPS TO FIX:
1. **Apply the migration**:
   ```bash
   # If using Supabase CLI locally
   supabase db push
   
   # Or apply directly via Supabase Dashboard:
   # Go to SQL Editor and run the migration file
   ```

2. **Verify ProductService mapping**:
   - Check that `productService.ts` properly maps these fields
   - Ensure the payload includes all promo video fields
   - Verify the column names match between frontend and database

3. **Test the complete flow**:
   - Open edit dialog for a product
   - Navigate to "Tráfego Orgânico" section
   - Select TikTok channel
   - Add test URL: `https://www.tiktok.com/@alobexpress/video/7601557121062358280`
   - Click "Salvar" button
   - Check browser console for debug logs (lines 610-613, 758-761 in EditProductDialog.tsx)
   - Verify data in Supabase database
   - Reload page and check if URL persists
   - Check if video displays on ProductCard screen 2

4. **If still not working after migration**:
   - Check ProductService.ts for proper field mapping
   - Verify the payload structure matches database schema
   - Check for any TypeScript type mismatches
   - Review network tab for API errors


---

## PROBLEMA IDENTIFICADO COM CERTEZA (2026-03-07 - Análise Completa):

### O Problema Real:
1. **Frontend (`EditProductDialog.tsx`)** envia os campos:
   - `promoVideoChannels` (array de canais)
   - `promoVideoChannelLinks` (objeto com URLs por canal)
   - `promoVideoChannelNames` (objeto com nomes de grupos)

2. **ProductService (`productService.ts`)** NÃO mapeia esses campos:
   - A função `mapProductRow` (linha 759) não inclui `promoVideo*`
   - Os tipos `ProductRow` e `ProductPayload` não têm esses campos
   - O service só mapeia `organic_channel_links` (campo antigo)

3. **Banco de Dados** não tem as colunas:
   - `promo_video_channels`
   - `promo_video_channel_links`
   - `promo_video_channel_names`

### Por que não funciona:
Quando o usuário salva um produto com URL do TikTok:
1. ✅ O `EditProductDialog` captura os dados corretamente (debug logs confirmam)
2. ✅ Os dados são enviados para `onSave(updated)` com os campos `promoVideo*`
3. ❌ O `productService.ts` recebe os dados mas NÃO os mapeia para o banco
4. ❌ Os campos `promoVideo*` são ignorados silenciosamente
5. ❌ Nada é salvo no banco de dados

## SOLUÇÃO COMPLETA:

### Passo 1: Aplicar a migração do banco de dados
```bash
# Executar a migração criada
supabase db push

# Ou aplicar manualmente via Dashboard SQL Editor:
# Arquivo: supabase/migrations/20260307_add_promo_video_fields.sql
```

### Passo 2: Atualizar o productService.ts
Adicionar os campos em 4 lugares:

1. **Tipo `ProductRow`** (linha ~51):
```typescript
organic_channel_links?: Record<string, string> | null;
organic_channel_names?: Record<string, string> | null;
promo_video_url?: string | null;
promo_video_copy?: string | null;
promo_video_channels?: string[] | null;
promo_video_channel_links?: Record<string, string> | null;
promo_video_channel_names?: Record<string, string> | null;
shopee_use_ads?: boolean | null;
```

2. **Tipo `ProductPayload`** (linha ~235):
```typescript
organic_channel_links?: Record<string, string> | null;
organic_channel_names?: Record<string, string> | null;
promo_video_url?: string | null;
promo_video_copy?: string | null;
promo_video_channels?: string[] | null;
promo_video_channel_links?: Record<string, string> | null;
promo_video_channel_names?: Record<string, string> | null;
shopee_use_ads?: boolean | null;
```

3. **Função `mapProductRow`** (linha ~804):
```typescript
organicChannels: item.organic_channels ?? [],
organicChannelLinks: item.organic_channel_links ?? {},
organicChannelNames: item.organic_channel_names ?? {},
promoVideoUrl: item.promo_video_url ?? '',
promoVideoCopy: item.promo_video_copy ?? '',
promoVideoChannels: item.promo_video_channels ?? [],
promoVideoChannelLinks: item.promo_video_channel_links ?? {},
promoVideoChannelNames: item.promo_video_channel_names ?? {},
shopeeUseAds: item.shopee_use_ads ?? false,
```

4. **Array de colunas para SELECT** (linha ~981):
```typescript
'organic_channels',
'organic_channel_links',
'organic_channel_names',
'promo_video_url',
'promo_video_copy',
'promo_video_channels',
'promo_video_channel_links',
'promo_video_channel_names',
'shopee_use_ads',
```

5. **Funções `create` e `update`** (linhas ~1436 e ~1661):
```typescript
organic_channels: product.organicChannels ?? null,
organic_channel_links: product.organicChannelLinks ?? null,
organic_channel_names: product.organicChannelNames ?? null,
promo_video_url: product.promoVideoUrl ?? null,
promo_video_copy: product.promoVideoCopy ?? null,
promo_video_channels: product.promoVideoChannels ?? null,
promo_video_channel_links: product.promoVideoChannelLinks ?? null,
promo_video_channel_names: product.promoVideoChannelNames ?? null,
shopee_use_ads: product.shopeeUseAds ?? null,
```

### Passo 3: Testar o fluxo completo
1. Aplicar migração do banco
2. Atualizar productService.ts com os mapeamentos
3. Reiniciar o servidor de desenvolvimento
4. Abrir edit dialog de um produto
5. Ir para "Tráfego Orgânico"
6. Selecionar TikTok
7. Adicionar URL: `https://www.tiktok.com/@alobexpress/video/7601557121062358280`
8. Clicar em "Salvar"
9. Verificar console logs (linhas 610-613, 758-761)
10. Verificar no Supabase se os dados foram salvos
11. Recarregar a página e verificar se o URL persiste
12. Verificar se o vídeo aparece no ProductCard tela 2

## ARQUIVOS AFETADOS:
- ✅ `supabase/migrations/20260307_add_promo_video_fields.sql` (criado)
- ⏳ `src/services/productService.ts` (precisa ser atualizado)
- ✅ `src/components/calculator/EditProductDialog.tsx` (já tem debug logs)
- ✅ `src/components/calculator/ProductCard.tsx` (já tem conversão de URL TikTok)


---

## ATUALIZAÇÃO FINAL (2026-03-07):

### Alterações Realizadas com Sucesso:
1. ✅ Criada migração do banco: `supabase/migrations/20260307_add_promo_video_fields.sql`
2. ✅ Adicionados campos no tipo `ProductRow` do `productService.ts`
3. ✅ Adicionados campos no tipo `ProductPayload` do `productService.ts`
4. ✅ Adicionado mapeamento na função `mapProductRow`
5. ✅ Adicionados campos no array de colunas SELECT

### Alterações Pendentes (FAZER MANUALMENTE):
⏳ Adicionar campos `promo_video_*` nas funções `create` e `update` do `productService.ts`

**Arquivo com instruções detalhadas**: `INSTRUCOES_CORRECAO_PROMO_VIDEO.md`

### Próximos Passos:
1. Aplicar a migração do banco de dados
2. Editar manualmente as funções `create` e `update` (ver instruções no arquivo acima)
3. Reiniciar o servidor
4. Testar o fluxo completo

### Resumo do Problema:
O `EditProductDialog` envia os campos `promoVideoChannelLinks` mas o `productService.ts` não os mapeava para o banco de dados. Agora o mapeamento está quase completo, faltando apenas adicionar os campos nas funções `create` e `update` (linhas ~1456 e ~1681).
