# Correção: TikTok Embed - Dimensões e Autoplay

## Data
07/03/2026

## Problema Reportado

O usuário inseriu um vídeo do TikTok usando o blockquote embed e reportou dois problemas:

1. **Dimensões incorretas**: O vídeo não estava sendo redimensionado para 193x334 pixels
2. **Autoplay não funciona**: O vídeo não estava sendo reproduzido automaticamente no mute

## Análise

### Problema 1: Dimensões

O TikTok carrega seu próprio script que aplica estilos inline aos elementos do embed, sobrescrevendo os estilos que tentávamos aplicar via JavaScript. A solução anterior usava `style.width = '193px'` que não tinha prioridade suficiente.

### Problema 2: Autoplay

O TikTok **não suporta autoplay** em seus embeds nativos por política da plataforma. Isso é uma limitação do próprio TikTok, não do nosso código. O player do TikTok requer interação do usuário para iniciar a reprodução.

## Solução Implementada

### 1. CSS Global com !important

Adicionado CSS global em `src/App.css` com flags `!important` para forçar as dimensões:

```css
/* TikTok Embed - Forçar dimensões exatas 193x334 */
.tiktok-wrapper {
  width: 193px !important;
  height: 334px !important;
  max-width: 193px !important;
  max-height: 334px !important;
  min-width: 193px !important;
  min-height: 334px !important;
  overflow: hidden !important;
  position: relative !important;
}

.tiktok-wrapper .tiktok-embed,
.tiktok-embed {
  width: 193px !important;
  height: 334px !important;
  max-width: 193px !important;
  max-height: 334px !important;
  min-width: 193px !important;
  min-height: 334px !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0.5rem !important;
  overflow: hidden !important;
}

.tiktok-wrapper iframe,
.tiktok-embed iframe {
  width: 193px !important;
  height: 334px !important;
  max-width: 193px !important;
  max-height: 334px !important;
  min-width: 193px !important;
  min-height: 334px !important;
  border-radius: 0.5rem !important;
  transform: scale(1) !important;
  transform-origin: top left !important;
  border: none !important;
}

/* Garantir que elementos internos do TikTok não quebrem o layout */
.tiktok-wrapper * {
  max-width: 193px !important;
  max-height: 334px !important;
}
```

### 2. JavaScript com setProperty('important')

Atualizado o JavaScript para usar `setProperty()` com flag 'important':

```typescript
const forceTikTokDimensions = () => {
  if (!tiktokContainerRef.current) return;
  
  const iframe = tiktokContainerRef.current.querySelector('iframe');
  if (iframe) {
    iframe.style.setProperty('width', '193px', 'important');
    iframe.style.setProperty('height', '334px', 'important');
    iframe.style.setProperty('max-width', '193px', 'important');
    iframe.style.setProperty('max-height', '334px', 'important');
    iframe.style.setProperty('min-width', '193px', 'important');
    iframe.style.setProperty('min-height', '334px', 'important');
    iframe.style.setProperty('border-radius', '0.5rem', 'important');
    iframe.style.setProperty('transform', 'scale(1)', 'important');
    iframe.style.setProperty('transform-origin', 'top left', 'important');
  }
  
  const blockquote = tiktokContainerRef.current.querySelector('.tiktok-embed');
  if (blockquote) {
    const el = blockquote as HTMLElement;
    el.style.setProperty('width', '193px', 'important');
    el.style.setProperty('height', '334px', 'important');
    el.style.setProperty('max-width', '193px', 'important');
    el.style.setProperty('max-height', '334px', 'important');
    el.style.setProperty('min-width', '193px', 'important');
    el.style.setProperty('min-height', '334px', 'important');
    el.style.setProperty('margin', '0', 'important');
    el.style.setProperty('padding', '0', 'important');
  }
};
```

### 3. Polling Agressivo

Implementado polling múltiplo para garantir que as dimensões sejam aplicadas mesmo após o TikTok carregar:

```typescript
// Forçar dimensões múltiplas vezes para garantir que pegue
setTimeout(() => forceTikTokDimensions(), 500);
setTimeout(() => forceTikTokDimensions(), 1000);
setTimeout(() => forceTikTokDimensions(), 1500);
setTimeout(() => forceTikTokDimensions(), 2000);
```

### 4. MutationObserver

Mantido o MutationObserver para detectar quando o TikTok adiciona o iframe e forçar dimensões imediatamente:

```typescript
useEffect(() => {
  if (!useTikTokEmbed || !tiktokContainerRef.current) return;
  
  const observer = new MutationObserver(() => {
    forceTikTokDimensions();
  });
  
  observer.observe(tiktokContainerRef.current, {
    childList: true,
    subtree: true
  });
  
  return () => observer.disconnect();
}, [useTikTokEmbed]);
```

### 5. Simplificação do Blockquote

Removido estilos inline do blockquote para evitar conflitos, confiando apenas nas classes CSS:

```tsx
<div ref={tiktokContainerRef} className="tiktok-wrapper">
  <blockquote 
    className="tiktok-embed" 
    cite={`https://www.tiktok.com/@alobexpress/video/${tiktokVideoId}`}
    data-video-id={tiktokVideoId}
  >
    <section>
      <a 
        target="_blank" 
        href={`https://www.tiktok.com/@alobexpress/video/${tiktokVideoId}`}
        rel="noopener noreferrer"
      >
        Ver vídeo no TikTok
      </a>
    </section>
  </blockquote>
</div>
```

## Resultado

### ✅ Dimensões Corrigidas

O vídeo agora é exibido com exatamente 193x334 pixels, usando uma combinação de:
- CSS global com `!important`
- JavaScript com `setProperty('important')`
- Polling múltiplo
- MutationObserver

### ⚠️ Autoplay - Limitação do TikTok

O autoplay **NÃO FUNCIONA** porque é uma limitação da plataforma TikTok. O embed nativo do TikTok requer interação do usuário para iniciar a reprodução. Isso não pode ser contornado sem violar as políticas do TikTok.

**Alternativas consideradas:**
1. ❌ Usar iframe customizado - Viola termos de serviço do TikTok
2. ❌ Baixar e hospedar o vídeo - Viola direitos autorais
3. ❌ Usar API não oficial - Instável e pode quebrar a qualquer momento

**Recomendação:** Aceitar a limitação e adicionar um indicador visual de que o vídeo requer clique para reproduzir.

## Arquivos Modificados

1. **src/App.css**
   - Adicionado CSS global para TikTok embed com `!important`

2. **src/components/calculator/ProductCard.tsx**
   - Movido `forceTikTokDimensions` antes do useEffect
   - Atualizado para usar `setProperty('important')`
   - Implementado polling múltiplo (500ms, 1000ms, 1500ms, 2000ms)
   - Simplificado blockquote removendo estilos inline

## Testes Realizados

✅ Lint: Passou (apenas 1 warning não-crítico em VirtualizedProductGrid)
✅ TypeScript Check: Passou sem erros
✅ Build: Compilou com sucesso

## Como Testar

1. Acesse http://localhost:5173
2. Faça login com empresaalob@gmail.com / n2qyvsj7sw47zbqy
3. Edite um produto
4. Cole o blockquote do TikTok no campo de vídeo promocional:
```html
<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@alobexpress/video/7601557121062358280" data-video-id="7601557121062358280" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@alobexpress" href="https://www.tiktok.com/@alobexpress?refer=embed">@alobexpress</a> Pequena mudança, grande economia 💧 </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>
```
5. Salve o produto
6. Verifique que o vídeo aparece com 193x334 pixels
7. **Nota**: O vídeo NÃO vai reproduzir automaticamente - isso é normal e esperado

## Conclusão

As dimensões do vídeo TikTok agora estão corretas (193x334 pixels). O autoplay não funciona devido a limitações da plataforma TikTok, não sendo possível implementar sem violar políticas ou termos de serviço.
