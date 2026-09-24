# Correções UX: Vídeos Adicionais e Copy

## Alterações Implementadas

### 1. Badge dos Vídeos Adicionais
**Antes:** Badge genérico "Vídeo 1", "Vídeo 2", etc. em roxo
**Depois:** Badge automático baseado no canal detectado pela URL

Detecção automática por URL:
- TikTok → Badge preto "TikTok"
- YouTube → Badge vermelho "YouTube"
- Instagram → Badge gradiente roxo-rosa "Instagram"
- Streamable → Badge azul "Streamable"
- Outros → Badge roxo "Vídeo"

**Arquivo:** `src/components/calculator/ProductCard.tsx`

### 2. Informações do Canal nos Vídeos Adicionais
Adicionado campo "Canal" que detecta automaticamente o canal baseado na URL:
- TikTok
- YouTube
- Instagram
- Streamable
- Outro

**Arquivo:** `src/components/calculator/ProductCard.tsx`

### 3. Espaço para Copy Aumentado
**Antes:** Copy sem scroll, texto cortado
**Depois:** 
- Copy com `max-h-32` (altura máxima de 8rem / 128px)
- Scroll automático quando o texto excede o limite
- `overflow-y-auto` para scroll vertical
- Espaçamento aumentado de `space-y-2` para `space-y-3`

Aplicado em:
- PromoVideoPanel (vídeos dos canais principais)
- Vídeos adicionais

**Arquivos:** `src/components/calculator/ProductCard.tsx`

### 4. Limitação de 5 Vídeos Adicionais
Implementada validação no frontend:
- Botão "Adicionar Vídeo" desabilitado quando há 5 vídeos
- Contador visual no botão: "+ Adicionar Vídeo (3/5)"
- Alert quando usuário tenta adicionar mais de 5 vídeos
- Botão fica cinza e com cursor "not-allowed" quando desabilitado

**Arquivo:** `src/components/calculator/EditProductDialog.tsx`

**Migration:** Documentado no comentário da coluna `additional_videos`

## Estrutura Visual Atualizada

### Tela 2 (Vídeo Promocional - TikTok)
```
┌─────────────────────┐
│  [Vídeo TikTok]     │
│  Badge: TikTok      │ ← Badge preto do TikTok
└─────────────────────┘
Copy: [texto com scroll]
Canal: TikTok          ← Adicionado
Model Video: Sora2
```

### Tela 3 (Vídeo Adicional 1)
```
┌─────────────────────┐
│  [Vídeo]            │
│  Badge: TikTok      │ ← Badge automático baseado na URL
└─────────────────────┘
Copy: [texto com scroll] ← Mais espaço
Canal: TikTok          ← Detectado automaticamente
Model Video: Sora2
```

## Validações Implementadas

### Frontend (EditProductDialog)
```typescript
// Validação ao adicionar vídeo
if (formData.additionalVideos.length >= 5) {
  alert('Você pode adicionar no máximo 5 vídeos adicionais.');
  return;
}

// Botão desabilitado
disabled={formData.additionalVideos.length >= 5}

// Estilo condicional
className={`... ${
  formData.additionalVideos.length >= 5
    ? 'bg-gray-400 cursor-not-allowed'
    : 'bg-blue-600 hover:bg-blue-700'
}`}
```

### Banco de Dados
- Coluna `additional_videos` tipo JSONB
- Comentário documenta limite de 5 vídeos
- Validação aplicada no frontend (não há constraint no banco)

## Detecção Automática de Canal

### Lógica de Detecção
```typescript
const detectChannel = (url: string) => {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('streamable.com')) return 'Streamable';
  return 'Outro';
};
```

### Badges por Canal
```typescript
const channelBadges = {
  tiktok: { label: 'TikTok', bgColor: 'bg-black', textColor: 'text-white' },
  youtube: { label: 'YouTube', bgColor: 'bg-red-600', textColor: 'text-white' },
  instagram: { label: 'Instagram', bgColor: 'bg-gradient-to-r from-purple-600 to-pink-600', textColor: 'text-white' },
  streamable: { label: 'Streamable', bgColor: 'bg-blue-600', textColor: 'text-white' },
  default: { label: 'Vídeo', bgColor: 'bg-purple-600', textColor: 'text-white' }
};
```

## CSS Aplicado

### Copy com Scroll
```css
max-h-32        /* max-height: 8rem (128px) */
overflow-y-auto /* scroll vertical quando necessário */
leading-relaxed /* line-height: 1.625 */
```

### Espaçamento
```css
space-y-3       /* gap: 0.75rem (12px) entre elementos */
```

## Testes Necessários

- [x] Badge automático aparece corretamente para TikTok
- [x] Badge automático aparece para YouTube, Instagram, Streamable
- [x] Campo "Canal" mostra o canal correto
- [x] Copy com scroll funciona quando texto é grande
- [x] Limitação de 5 vídeos funciona
- [x] Botão desabilita após 5 vídeos
- [x] Contador (X/5) aparece no botão
- [ ] Testar com vídeos reais de diferentes canais
- [ ] Verificar responsividade em diferentes resoluções

## Arquivos Modificados

1. `src/components/calculator/ProductCard.tsx`
   - Badge automático por canal
   - Campo "Canal" adicionado
   - Copy com scroll (max-h-32)
   - Espaçamento aumentado (space-y-3)

2. `src/components/calculator/EditProductDialog.tsx`
   - Validação de máximo 5 vídeos
   - Botão desabilitado após 5 vídeos
   - Contador visual (X/5)
   - Alert quando limite atingido

3. `supabase/migrations/20260307_add_promo_video_copies_additional_videos.sql`
   - Comentário documentando limite de 5 vídeos

## Status
✅ Badge automático implementado
✅ Campo "Canal" adicionado
✅ Copy com scroll implementado
✅ Limitação de 5 vídeos implementada
✅ Validações no frontend
✅ Documentação atualizada
⏳ Testes com usuário pendentes
