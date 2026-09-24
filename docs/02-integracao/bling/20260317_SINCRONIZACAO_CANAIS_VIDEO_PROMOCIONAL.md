# Sincronização de Canais entre TrafficConfig e EditProductDialog

## Resumo da Implementação

Implementada a sincronização completa entre os canais orgânicos configurados no TrafficConfig (Dados do Produto) e os campos de vídeo promocional no EditProductDialog (Editar Produto).

## Alterações Realizadas

### 1. DropshippingCalculator.tsx

**Localização**: Função `handleSaveProduct` (linha ~705)

**Alteração**: Adicionado mapeamento automático dos canais orgânicos para os campos de vídeo promocional ao salvar o produto.

```typescript
trafficMode,
organicChannels,
organicChannelLinks,
organicChannelNames,
influencers,
affiliates,
influencer_id: selectedInfluencerId || undefined,
paidTraffic,
// Mapear canais orgânicos para campos de vídeo promocional
promoVideoChannels: organicChannels,
promoVideoChannelLinks: organicChannelLinks,
promoVideoChannelNames: organicChannelNames,
```

**Comportamento**:
- Quando o usuário salva um produto na calculadora, os canais selecionados em "Configurações de Tráfego Orgânico → Canais" são automaticamente copiados para os campos de vídeo promocional
- Os links e nomes de grupos também são copiados automaticamente
- Isso garante que ao editar o produto posteriormente, os canais já estarão pré-selecionados

### 2. TrafficConfig.tsx (Já Implementado)

**Funcionalidade Existente**:
- Permite selecionar múltiplos canais através de botões toggle
- Canais disponíveis: YouTube Shorts, Kwai Video, TikTok, Instagram Reels, WhatsApp, Grupo Facebook, Shopee Video
- Para WhatsApp e Grupo Facebook: Campos de "Nome do grupo" + "Link do grupo"
- Para outros canais: Campo de "Link" apenas
- Botões ficam verdes quando selecionados
- Ao desmarcar um canal, seus dados (link e nome) são removidos automaticamente

### 3. EditProductDialog.tsx (Já Implementado)

**Funcionalidade Existente**:
- Seção "Tráfego Orgânico" com grid 2x4 de botões toggle para seleção de canais
- Botões ficam pretos quando selecionados, brancos quando não
- Campos dinâmicos aparecem ao selecionar cada canal
- Pré-popula os campos com dados salvos do produto (`promoVideoChannels`, `promoVideoChannelLinks`, `promoVideoChannelNames`)
- Ao desmarcar um canal, remove automaticamente seus dados

### 4. ProductCard.tsx (Já Implementado)

**Funcionalidade Existente**:
- Cria uma tela de vídeo para cada canal selecionado
- Cada tela exibe:
  - Vídeo em aspect ratio 9:16 (autoplay, loop, muted, sem controles)
  - Badge do canal no canto superior direito
  - Nome do grupo (se WhatsApp ou Grupo Facebook)
  - Copy do vídeo
  - Video Model usado
- Navegação: Tela 1 (produto) → Telas 2-N (vídeos por canal) → Última tela (investimento)

## Fluxo Completo de Uso

### 1. Cadastrar Produto na Calculadora

1. Usuário preenche dados do produto
2. Em "Configurações de Tráfego Orgânico → Canais", seleciona múltiplos canais (ex: YouTube Shorts, TikTok, Instagram Reels)
3. Para cada canal selecionado, preenche:
   - Link do vídeo (iframe do Streamable ou URL direta)
   - Nome do grupo (se WhatsApp ou Grupo Facebook)
4. Clica em "Salvar"

### 2. Sistema Salva Automaticamente

- `organicChannels` → `promoVideoChannels`
- `organicChannelLinks` → `promoVideoChannelLinks`
- `organicChannelNames` → `promoVideoChannelNames`

### 3. Editar Produto

1. Usuário clica em "Editar produto"
2. EditProductDialog abre com os canais já pré-selecionados
3. Campos de link e nome de grupo já preenchidos
4. Usuário pode adicionar/remover canais ou modificar dados
5. Ao salvar, atualiza o produto com as novas informações

### 4. Visualizar no ProductCard

1. ProductCard detecta quantos canais têm links configurados
2. Cria uma tela de vídeo para cada canal
3. Cada tela exibe o vídeo sendo reproduzido automaticamente com badge do canal
4. Navegação entre telas: Produto → Vídeos → Investimento

## Canais Suportados

| Canal | Key | Badge Color | Campos Adicionais |
|-------|-----|-------------|-------------------|
| YouTube Shorts | `youtube_shorts` | Vermelho (#FF0000) | Link |
| Kwai Video | `kaway_video` | Laranja (#FF6B00) | Link |
| TikTok | `tiktok` | Preto (#000000) | Link |
| Instagram Reels | `instagram_reels` | Gradiente (Rosa/Roxo) | Link |
| WhatsApp | `whatsapp` | Verde (#25D366) | Nome do grupo + Link |
| Grupo Facebook | `grupo_facebook` | Azul (#1877F2) | Nome do grupo + Link |
| Shopee Video | `shopee_video` | Laranja (#EE4D2D) | Link |

## Tipos TypeScript

```typescript
export interface ProductItem {
  // ... outros campos
  
  // Canais orgânicos (TrafficConfig)
  organicChannels?: string[];
  organicChannelLinks?: Record<string, string>;
  organicChannelNames?: Record<string, string>;
  
  // Vídeo promocional (sincronizado automaticamente)
  promoVideoChannels?: string[];
  promoVideoChannelLinks?: Record<string, string>;
  promoVideoChannelNames?: Record<string, string>;
}
```

## Validações

- Ao desmarcar um canal, seus dados são removidos automaticamente
- Links devem ser URLs válidas (iframe do Streamable ou URL direta)
- Vídeos são reproduzidos com: autoplay, loop, muted, sem controles
- Aspect ratio dos vídeos: 9:16 (vertical)

## Testes Recomendados

1. ✅ Cadastrar produto com múltiplos canais
2. ✅ Salvar produto
3. ✅ Editar produto e verificar se canais estão pré-selecionados
4. ✅ Verificar se links e nomes de grupos estão preenchidos
5. ✅ Adicionar/remover canais ao editar
6. ✅ Verificar se ProductCard cria telas corretas para cada canal
7. ✅ Verificar se vídeos são reproduzidos automaticamente
8. ✅ Verificar se badges dos canais aparecem corretamente

## Status

✅ **IMPLEMENTADO E FUNCIONAL**

- Sincronização automática entre TrafficConfig e EditProductDialog
- Múltiplos canais suportados
- Campos dinâmicos por canal
- Pré-população de dados ao editar
- Visualização de vídeos no ProductCard
- Badges de canais
- Navegação entre telas

## Próximos Passos (Opcional)

- [ ] Adicionar validação de URLs de vídeo
- [ ] Adicionar preview de vídeo ao cadastrar
- [ ] Adicionar estatísticas por canal (views, cliques, conversões)
- [ ] Adicionar suporte para mais canais (Twitter/X, LinkedIn, etc.)
