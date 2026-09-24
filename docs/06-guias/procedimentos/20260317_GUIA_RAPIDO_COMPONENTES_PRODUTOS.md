# Guia Rápido - Componentes Produtos CSS Pack

**Referência rápida para usar os 7 novos componentes da página Produtos**

---

## 🎯 Card3D

**Quando usar:** Card principal de destaque (produto em análise)

```tsx
import { Card3D } from '@/components/ui/Card3D';

<Card3D intensity={0.2} glowColor="rgba(254, 44, 85, 0.3)">
  {/* Conteúdo do card */}
</Card3D>
```

**Props:**
- `intensity?: number` - 0-1, intensidade do 3D (padrão: 0.15)
- `glowColor?: string` - Cor do brilho opcional

---

## 🖼️ HoverBlur

**Quando usar:** Imagens de produtos

```tsx
import { HoverBlur } from '@/components/ui/HoverBlur';

<HoverBlur
  src="/produto.jpg"
  alt="Produto"
  blurAmount={4}
  overlayOpacity={0.2}
/>
```

**Props:**
- `blurAmount?: number` - 0-10, intensidade do blur (padrão: 4)
- `overlayOpacity?: number` - 0-1, opacidade do overlay (padrão: 0.2)

---

## ✨ LightBar

**Quando usar:** Badges de métricas (Shopee Ads, preços, etc.)

```tsx
import { LightBar } from '@/components/ui/LightBar';

<LightBar variant="badge">
  <span>Shopee Ads</span>
</LightBar>
```

**Variantes:**
- `default` - Estilo padrão
- `badge` - Badge colorido (#fe2c55)
- `metric` - Card de métrica

---

## 🧲 MagneticButton

**Quando usar:** Botões de ação (Preencher, Adicionar, etc.)

```tsx
import { MagneticButton } from '@/components/ui/MagneticButton';

<MagneticButton strength={0.3} variant="primary">
  Preencher
</MagneticButton>
```

**Variantes:**
- `primary` - Rosa gradiente (#fe2c55)
- `secondary` - Cinza
- `outline` - Borda rosa

---

## 🌈 AnimatedGradient

**Quando usar:** Fundo do card principal

```tsx
import { AnimatedGradient } from '@/components/ui/AnimatedGradient';

<AnimatedGradient
  colors={['#fe2c55', '#f472b6', '#fe2c55']}
  speed="slow"
>
  {/* Conteúdo */}
</AnimatedGradient>
```

**Velocidades:**
- `slow` - 8s
- `normal` - 5s
- `fast` - 3s

---

## 📋 CopyToClipboard

**Quando usar:** SKUs, preços, links

```tsx
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';

<CopyToClipboard text="SKU-12345" successMessage="SKU copiado!">
  SKU-12345
</CopyToClipboard>
```

**Features:**
- Copia ao clicar
- Ícone muda para check
- Toast notification

---

## 📊 InteractiveMetric

**Quando usar:** Projeções de vendas (50un, 100un, etc.)

```tsx
import { InteractiveMetric } from '@/components/ui/InteractiveMetric';
import { Package } from 'lucide-react';

<InteractiveMetric
  label="50 unidades"
  value="R$ 1.250,00"
  icon={<Package />}
  onClick={() => handleProjection(50)}
/>
```

**Features:**
- Animação no hover
- Feedback ao clicar
- Ícone opcional

---

## 🎨 Exemplo Completo

```tsx
import { Card3D } from '@/components/ui/Card3D';
import { AnimatedGradient } from '@/components/ui/AnimatedGradient';
import { HoverBlur } from '@/components/ui/HoverBlur';
import { LightBar } from '@/components/ui/LightBar';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';
import { InteractiveMetric } from '@/components/ui/InteractiveMetric';
import { Package } from 'lucide-react';

export const ProductView = ({ product }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Card Principal */}
      <Card3D intensity={0.2} glowColor="rgba(254, 44, 85, 0.3)">
        <AnimatedGradient
          colors={['#fe2c55', '#f472b6', '#fe2c55']}
          speed="slow"
          className="rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            {product.name}
          </h2>
          
          <HoverBlur
            src={product.image}
            alt={product.name}
            blurAmount={4}
            className="w-full h-64 mb-4"
          />
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <LightBar variant="metric">
              <p className="text-sm text-gray-600">Preço de venda</p>
              <CopyToClipboard text={product.price}>
                <p className="text-lg font-bold">{product.price}</p>
              </CopyToClipboard>
            </LightBar>
            
            <LightBar variant="badge">
              <span>Shopee Ads</span>
            </LightBar>
          </div>
          
          {/* Projeções */}
          <div className="grid grid-cols-3 gap-3">
            {[50, 100, 200].map((qty) => (
              <InteractiveMetric
                key={qty}
                label={`${qty} unidades`}
                value={formatCurrency(product.price * qty)}
                icon={<Package />}
                onClick={() => handleProjection(qty)}
              />
            ))}
          </div>
        </AnimatedGradient>
      </Card3D>
      
      {/* Grid de Produtos */}
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-lg p-4">
            <HoverBlur
              src={p.image}
              alt={p.name}
              className="w-full h-32 mb-3"
            />
            
            <CopyToClipboard text={p.sku}>
              <p className="text-sm text-gray-600">{p.sku}</p>
            </CopyToClipboard>
            
            <p className="font-bold mt-2">{p.name}</p>
            
            <MagneticButton
              strength={0.3}
              variant="primary"
              className="w-full mt-3"
              onClick={() => handleFill(p)}
            >
              Preencher
            </MagneticButton>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 Dicas de Uso

### Performance
- Use `intensity` baixo (0.1-0.2) para melhor performance
- `blurAmount` ideal: 3-5px
- `strength` magnético ideal: 0.2-0.4

### Acessibilidade
- Sempre forneça `alt` em HoverBlur
- Use `aria-label` em botões com apenas ícones
- Teste navegação por teclado

### Responsividade
- Ajuste `intensity` em mobile (0.1 ou desabilite)
- Simplifique animações em telas pequenas
- Teste em diferentes resoluções

---

**Última Atualização:** 28 de Fevereiro de 2026
