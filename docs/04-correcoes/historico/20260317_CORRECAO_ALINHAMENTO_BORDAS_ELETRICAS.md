# Correção: Alinhamento e Bordas Elétricas nos Vídeos

## Problema
1. Card 1 (tela principal) estava centralizado verticalmente (`justify-center`)
2. Card 2 (vídeos promocionais) estava alinhado ao topo (`justify-start`)
3. Falta de bordas elétricas nos vídeos promocionais e adicionais

## Solução Implementada

### 1. Alinhamento ao Topo
**Antes:** `flex flex-col justify-center`
**Depois:** `flex flex-col justify-start`

Alterado em:
- PromoVideoPanel (vídeos dos canais principais)
- Vídeos adicionais

Agora todos os cards ficam alinhados ao topo, igual ao card de investimento.

### 2. Bordas Elétricas Rosa TikTok
Adicionado componente `ElectricBorder` com cor rosa do TikTok (#fe2c55) em:
- Vídeos promocionais (telas 2+)
- Vídeos adicionais (telas 3, 4, 5, etc.)

**Configuração:**
```tsx
<ElectricBorder
  color="#fe2c55"  // Rosa do TikTok
  speed={1}
  chaos={0.05}
  thickness={2}
  style={{ borderRadius: 12 }}
>
  {/* Vídeo aqui */}
</ElectricBorder>
```

## Estrutura Visual Atualizada

### Antes
```
┌─────────────────────┐
│                     │
│   [Centralizado]    │ ← justify-center
│                     │
└─────────────────────┘
```

### Depois
```
┌─────────────────────┐
│ ╔═══════════════╗   │ ← Borda elétrica rosa
│ ║  [Vídeo]      ║   │ ← justify-start (topo)
│ ║               ║   │
│ ╚═══════════════╝   │
│ Copy: ...           │
│ Canal: TikTok       │
└─────────────────────┘
```

## Cor da Borda Elétrica

### Rosa TikTok (#fe2c55)
- Cor oficial do TikTok
- Aplicada em todos os vídeos promocionais
- Efeito elétrico animado com:
  - Velocidade: 1
  - Caos: 0.05 (suave)
  - Espessura: 2px
  - Bordas arredondadas: 12px

### Comparação com Investimento
- Investimento: Verde (#16a34a) - indica lucro/dinheiro
- Vídeos: Rosa (#fe2c55) - identidade visual TikTok

## Componentes Afetados

### PromoVideoPanel
```tsx
<div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start">
  <div className="w-full rounded-xl border border-border p-3">
    <ElectricBorder color="#fe2c55" ...>
      <div className="relative mx-auto overflow-hidden rounded-lg">
        {/* Vídeo TikTok/YouTube/Instagram */}
      </div>
    </ElectricBorder>
    {/* Informações do canal */}
  </div>
</div>
```

### Vídeos Adicionais
```tsx
{additionalVideos.map((video, index) => (
  <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start">
    <div className="w-full rounded-xl border border-border p-3">
      <ElectricBorder color="#fe2c55" ...>
        <div className="relative mx-auto overflow-hidden rounded-lg">
          {/* Vídeo adicional */}
        </div>
      </ElectricBorder>
      {/* Informações do vídeo */}
    </div>
  </div>
))}
```

## Alterações no Código

### Arquivo: `src/components/calculator/ProductCard.tsx`

#### Linha ~89 (PromoVideoPanel)
```diff
- <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-center">
+ <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start">
    <div className="w-full rounded-xl border border-border p-3">
-     <div className="relative mx-auto overflow-hidden rounded-lg">
+     <ElectricBorder color="#fe2c55" speed={1} chaos={0.05} thickness={2}>
+       <div className="relative mx-auto overflow-hidden rounded-lg">
          {/* Vídeo */}
+       </div>
+     </ElectricBorder>
-     </div>
```

#### Linha ~995 (Vídeos Adicionais)
```diff
- <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-center">
+ <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start">
    <div className="w-full rounded-xl border border-border p-3">
-     <div className="relative mx-auto overflow-hidden rounded-lg">
+     <ElectricBorder color="#fe2c55" speed={1} chaos={0.05} thickness={2}>
+       <div className="relative mx-auto overflow-hidden rounded-lg">
          {/* Vídeo adicional */}
+       </div>
+     </ElectricBorder>
-     </div>
```

## Testes Realizados

- [x] TypeScript compilando sem erros
- [x] ElectricBorder importado corretamente
- [x] Cor rosa (#fe2c55) aplicada
- [x] Alinhamento ao topo funcionando
- [ ] Teste visual no navegador
- [ ] Verificar animação da borda elétrica
- [ ] Testar em diferentes resoluções

## Benefícios

1. **Consistência Visual**: Todos os cards alinhados ao topo
2. **Identidade Visual**: Cor rosa do TikTok nos vídeos
3. **Destaque**: Bordas elétricas chamam atenção para os vídeos
4. **Profissionalismo**: Efeito premium e moderno

## Status
✅ Alinhamento corrigido (justify-start)
✅ Bordas elétricas adicionadas
✅ Cor rosa TikTok (#fe2c55) aplicada
✅ TypeScript compilando
⏳ Teste visual pendente
