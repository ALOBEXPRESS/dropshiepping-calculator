# Implementação: Múltiplos Canais para Vídeo Promocional

## Data
1 de março de 2026

## Objetivo
Permitir que o usuário selecione múltiplos canais para o vídeo promocional, com campos específicos para cada canal (nome do grupo e link).

## Problema Anterior
- Apenas um canal podia ser selecionado por vez
- Não havia campos para nome de grupo e link por canal
- Não estava sincronizado com a funcionalidade de "Configurações de Tráfego Orgânico"

## Solução Implementada

### 1. Atualização do Tipo `ProductItem`

**Arquivo**: `src/types/calculator.ts`

**Antes**:
```typescript
promoVideoUrl?: string;
promoVideoCopy?: string;
promoVideoChannel?: 'youtube_shorts' | 'kaway_video' | 'tiktok' | 'instagram_reels' | 'whatsapp' | 'grupo_facebook' | 'shopee_video';
```

**Depois**:
```typescript
promoVideoUrl?: string;
promoVideoCopy?: string;
promoVideoChannels?: string[]; // Array de canais selecionados
promoVideoChannelLinks?: Record<string, string>; // Links por canal
promoVideoChannelNames?: Record<string, string>; // Nomes de grupos por canal
```

### 2. Atualização do `EditProductDialog`

**Arquivo**: `src/components/calculator/EditProductDialog.tsx`

#### Mudanças no FormData:
```typescript
type EditProductFormData = {
  // ... outros campos
  promoVideoChannels: string[];
  promoVideoChannelLinks: Record<string, string>;
  promoVideoChannelNames: Record<string, string>;
};
```

#### Inicialização:
```typescript
promoVideoChannels: Array.isArray(source?.promoVideoChannels) ? source.promoVideoChannels : [],
promoVideoChannelLinks: source?.promoVideoChannelLinks || {},
promoVideoChannelNames: source?.promoVideoChannelNames || {},
```

#### Interface de Seleção de Canais:

1. **Grid de Botões** (2 colunas):
   - Botões toggle para cada canal
   - Estado visual: preto quando selecionado, branco quando não selecionado
   - Permite seleção/deseleção com um clique

2. **Campos Dinâmicos por Canal**:
   - Aparecem automaticamente ao selecionar um canal
   - Para WhatsApp e Grupo Facebook:
     - Campo "Nome do grupo"
     - Campo "Link do grupo"
   - Para outros canais:
     - Campo "Link" apenas

3. **Remoção de Canal**:
   - Ao desmarcar um canal, remove automaticamente seus dados (nome e link)

### 3. Atualização do `ProductCard`

**Arquivo**: `src/components/calculator/ProductCard.tsx`

#### Badge do Canal:
```typescript
// Pegar o primeiro canal selecionado para exibir o badge
const firstChannel = product.promoVideoChannels && product.promoVideoChannels.length > 0 
  ? product.promoVideoChannels[0] 
  : null;
const channelBadge = firstChannel ? channelBadges[firstChannel] : undefined;
```

**Nota**: Exibe o badge do primeiro canal selecionado. Se houver múltiplos canais, apenas o primeiro é mostrado no card.

## Canais Disponíveis

1. **Youtube Shorts** - Badge vermelho
2. **Kaway Video** - Badge roxo
3. **Tiktok** - Badge preto
4. **Instagram Reels** - Badge gradiente
5. **WhatsApp** - Badge verde (com campos de nome e link de grupo)
6. **Grupo Facebook** - Badge azul (com campos de nome e link de grupo)
7. **Shopee Video** - Badge laranja

## Fluxo de Uso

### No EditProductDialog (Tráfego Orgânico):

1. Usuário clica em um ou mais botões de canal
2. Para cada canal selecionado, aparecem campos específicos:
   - WhatsApp/Grupo Facebook: Nome do grupo + Link
   - Outros canais: Link apenas
3. Usuário preenche os campos
4. Ao salvar o produto, todos os canais e seus dados são salvos

### Sincronização com TrafficConfig:

O sistema agora está alinhado com a funcionalidade existente em "Configurações de Tráfego Orgânico", que já suportava múltiplos canais através de:
- `organicChannels: string[]`
- `organicChannelLinks: Record<string, string>`
- `organicChannelNames: Record<string, string>`

## Estrutura de Dados

### Exemplo de Produto com Múltiplos Canais:

```typescript
{
  promoVideoUrl: "https://streamable.com/...",
  promoVideoCopy: "Vídeo promocional do produto",
  promoVideoChannels: ["youtube_shorts", "tiktok", "grupo_facebook"],
  promoVideoChannelLinks: {
    youtube_shorts: "https://youtube.com/shorts/...",
    tiktok: "https://tiktok.com/@user/video/...",
    grupo_facebook: "https://facebook.com/groups/..."
  },
  promoVideoChannelNames: {
    grupo_facebook: "Grupo de Vendas"
  }
}
```

## Interface Visual

### Botões de Canal:
- **Não selecionado**: Fundo branco, texto cinza, borda cinza
- **Selecionado**: Fundo preto, texto branco, borda preta
- **Hover**: Borda mais escura

### Campos de Canal:
- Fundo branco semi-transparente (`bg-white/70`)
- Borda cinza clara
- Título do canal em negrito
- Campos de input com altura reduzida (`h-8`)

## Arquivos Modificados

1. `src/types/calculator.ts` - Atualizado tipo `ProductItem`
2. `src/components/calculator/EditProductDialog.tsx` - Interface de múltiplos canais
3. `src/components/calculator/ProductCard.tsx` - Badge do primeiro canal

## Testes Realizados

### Build
```bash
npm run build
```
✅ **PASSOU** - Build compilou com sucesso em 1m 24s

### Funcionalidades Testadas
- ✅ Seleção de múltiplos canais
- ✅ Campos dinâmicos aparecem ao selecionar canal
- ✅ Remoção de canal limpa os dados
- ✅ Salvamento de múltiplos canais
- ✅ Badge exibido no ProductCard

## Melhorias Futuras (Opcional)

1. **Exibir todos os badges** no ProductCard (não apenas o primeiro)
2. **Validação de links** antes de salvar
3. **Indicador visual** de quantos canais estão selecionados
4. **Reordenação de canais** (drag and drop)
5. **Preview do vídeo** por canal

## Status

✅ **IMPLEMENTADO E TESTADO**

Sistema agora permite seleção de múltiplos canais com campos específicos para cada um, alinhado com a funcionalidade de "Configurações de Tráfego Orgânico".
