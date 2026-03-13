# Guia de Integração - Componentes CSS Pack

**Como aplicar os 22 componentes nas páginas da aplicação**

---

## 🎯 Visão Geral

Este guia mostra como integrar os componentes CSS Pack nas páginas existentes da aplicação, com exemplos práticos e código pronto para uso.

---

## 📦 Página Produtos - Integração Completa

### Estrutura Atual vs Nova

**Antes:**
```tsx
// Card simples sem efeitos
<div className="bg-white rounded-lg p-4">
  <img src={product.image} alt={product.name} />
  <h3>{product.name}</h3>
  <p>{product.price}</p>
  <button onClick={handleFill}>Preencher</button>
</div>
```

**Depois:**
```tsx
import { Card3D } from '@/components/ui/Card3D';
import { AnimatedGradient } from '@/components/ui/AnimatedGradient';
import { HoverBlur } from '@/components/ui/HoverBlur';
import { LightBar } from '@/components/ui/LightBar';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';
import { InteractiveMetric } from '@/components/ui/InteractiveMetric';

// Card premium com todos os efeitos
<Card3D intensity={0.2} glowColor="rgba(254, 44, 85, 0.3)">
  <AnimatedGradient
    colors={['#fe2c55', '#f472b6', '#fe2c55']}
    speed="slow"
    className="rounded-2xl p-6"
  >
    <h3 className="text-2xl font-bold text-white mb-4">
      {product.name}
    </h3>
    
    <HoverBlur
      src={product.image}
      alt={product.name}
      blurAmount={4}
      className="w-full h-64 mb-4"
    />
    
    <div className="grid grid-cols-2 gap-3 mb-4">
      <LightBar variant="metric">
        <p className="text-sm text-gray-600">Preço</p>
        <CopyToClipboard text={product.price}>
          <p className="text-lg font-bold">{product.price}</p>
        </CopyToClipboard>
      </LightBar>
      
      <LightBar variant="badge">
        <span>Shopee Ads</span>
      </LightBar>
    </div>
    
    <div className="grid grid-cols-3 gap-3">
      {[50, 100, 200].map((qty) => (
        <InteractiveMetric
          key={qty}
          label={`${qty} un`}
          value={formatCurrency(product.price * qty)}
          onClick={() => handleProjection(qty)}
        />
      ))}
    </div>
    
    <MagneticButton
      strength={0.3}
      variant="primary"
      className="w-full mt-4"
      onClick={handleFill}
    >
      Preencher
    </MagneticButton>
  </AnimatedGradient>
</Card3D>
```

### Passo a Passo

1. **Importar componentes necessários**
```tsx
import { Card3D } from '@/components/ui/Card3D';
import { AnimatedGradient } from '@/components/ui/AnimatedGradient';
import { HoverBlur } from '@/components/ui/HoverBlur';
import { LightBar } from '@/components/ui/LightBar';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';
import { InteractiveMetric } from '@/components/ui/InteractiveMetric';
```

2. **Substituir card principal**
```tsx
// Encontre o card rosa principal
// Substitua por Card3D + AnimatedGradient
<Card3D intensity={0.2} glowColor="rgba(254, 44, 85, 0.3)">
  <AnimatedGradient colors={['#fe2c55', '#f472b6']} speed="slow">
    {/* Conteúdo existente */}
  </AnimatedGradient>
</Card3D>
```

3. **Atualizar imagens**
```tsx
// Substitua <img> por HoverBlur
<HoverBlur
  src={product.image}
  alt={product.name}
  blurAmount={4}
  className="w-full h-64"
/>
```

4. **Adicionar badges com efeito**
```tsx
// Envolva badges em LightBar
<LightBar variant="badge">
  <span>Shopee Ads</span>
</LightBar>
```

5. **Substituir botões**
```tsx
// Substitua <button> por MagneticButton
<MagneticButton strength={0.3} variant="primary">
  Preencher
</MagneticButton>
```

6. **Adicionar projeções interativas**
```tsx
<div className="grid grid-cols-3 gap-3">
  {[50, 100, 200].map((qty) => (
    <InteractiveMetric
      key={qty}
      label={`${qty} unidades`}
      value={formatCurrency(product.price * qty)}
      onClick={() => handleProjection(qty)}
    />
  ))}
</div>
```

---

## 📊 Página Vendas - Integração Completa

### Estrutura Atual vs Nova

**Antes:**
```tsx
<div className="p-6">
  <div className="bg-green-100 p-4">
    <CheckCircle />
    <p>Tudo processado!</p>
  </div>
  
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p>Receita</p>
      <p className="text-2xl">R$ 12.500,00</p>
    </div>
  </div>
  
  <div className="overflow-auto max-h-96">
    {transactions.map(tx => (
      <div key={tx.id}>{tx.description}</div>
    ))}
  </div>
</div>
```

**Depois:**
```tsx
import { BounceAnimation } from '@/components/ui/BounceAnimation';
import { FloatingAnimation } from '@/components/ui/FloatingAnimation';
import { Text3DHover } from '@/components/ui/Text3DHover';
import { AutoplayTabs } from '@/components/ui/AutoplayTabs';
import { ScrollCardProgress } from '@/components/ui/ScrollCardProgress';
import { PageProgressBar } from '@/components/ui/PageProgressBar';

<div className="p-6">
  <PageProgressBar color="#fe2c55" height={3} />
  
  <BounceAnimation delay={0.2}>
    <div className="bg-green-100 p-6 rounded-2xl">
      <FloatingAnimation duration={3} yOffset={10}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
      </FloatingAnimation>
      <p className="text-center mt-4">Tudo processado!</p>
    </div>
  </BounceAnimation>
  
  <div className="grid grid-cols-3 gap-6 mt-6">
    <div className="bg-white p-6 rounded-2xl">
      <p className="text-sm text-gray-600">Receita</p>
      <Text3DHover intensity={10}>
        <p className="text-3xl font-bold text-green-600">
          R$ 12.500,00
        </p>
      </Text3DHover>
    </div>
  </div>
  
  <AutoplayTabs
    tabs={[
      { value: 'daily', label: 'Diário', content: <DailyStats /> },
      { value: 'weekly', label: 'Semanal', content: <WeeklyStats /> },
    ]}
    autoplayInterval={5000}
    className="mt-6"
  />
  
  <div className="mt-6 bg-white p-6 rounded-2xl">
    <h3 className="text-lg font-semibold mb-4">Transações</h3>
    <ScrollCardProgress maxHeight="400px" progressColor="#fe2c55">
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx.id} className="p-4 bg-gray-50 rounded-lg">
            {tx.description}
          </div>
        ))}
      </div>
    </ScrollCardProgress>
  </div>
</div>
```

### Passo a Passo

1. **Adicionar barra de progresso global**
```tsx
// No topo da página
<PageProgressBar color="#fe2c55" height={3} />
```

2. **Animar card de status**
```tsx
<BounceAnimation delay={0.2}>
  <div className="bg-green-100 p-6 rounded-2xl">
    <FloatingAnimation duration={3} yOffset={10}>
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
    </FloatingAnimation>
    <p>Tudo processado!</p>
  </div>
</BounceAnimation>
```

3. **Adicionar hover 3D nas métricas**
```tsx
<Text3DHover intensity={10}>
  <p className="text-3xl font-bold text-green-600">
    R$ 12.500,00
  </p>
</Text3DHover>
```

4. **Implementar abas com autoplay**
```tsx
<AutoplayTabs
  tabs={[
    { value: 'daily', label: 'Diário', content: <DailyStats /> },
    { value: 'weekly', label: 'Semanal', content: <WeeklyStats /> },
    { value: 'monthly', label: 'Mensal', content: <MonthlyStats /> },
  ]}
  autoplayInterval={5000}
  progressColor="#fe2c55"
/>
```

5. **Adicionar scroll com progresso**
```tsx
<ScrollCardProgress maxHeight="400px" progressColor="#fe2c55">
  <div className="space-y-3">
    {transactions.map(tx => (
      <div key={tx.id}>{tx.description}</div>
    ))}
  </div>
</ScrollCardProgress>
```

---

## 🌐 Configuração Global

### App.tsx ou Layout Principal

```tsx
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { PageProgressBar } from '@/components/ui/PageProgressBar';

export const App = () => {
  return (
    <>
      {/* Scroll suave global */}
      <SmoothScroll />
      
      {/* Barra de progresso (opcional - pode ser por página) */}
      <PageProgressBar color="#fe2c55" height={3} />
      
      {/* Resto da aplicação */}
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/vendas" element={<Sales />} />
      </Routes>
    </>
  );
};
```

---

## 🎨 Calculadora - Componentes Já Aplicados

A página Calculadora já tem os componentes aplicados:

- ✅ LoadingState
- ✅ AnimatedCard
- ✅ GradientButton
- ✅ AnimatedCheckbox
- ✅ ProgressBar
- ✅ ExpandableSection
- ✅ DynamicHoverCard
- ✅ AnimatedTabs

**Nenhuma ação necessária** - já está 100% implementado.

---

## 🔧 Dicas de Integração

### Performance

1. **Lazy Loading**
```tsx
// Carregar componentes pesados sob demanda
const Card3D = lazy(() => import('@/components/ui/Card3D'));

<Suspense fallback={<LoadingState />}>
  <Card3D>{/* ... */}</Card3D>
</Suspense>
```

2. **Condicional por Dispositivo**
```tsx
// Simplificar em mobile
const isMobile = window.innerWidth < 768;

<Card3D intensity={isMobile ? 0.05 : 0.2}>
  {/* ... */}
</Card3D>
```

3. **Respeitar Preferências**
```tsx
// Desabilitar animações se usuário preferir
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

{!prefersReducedMotion && (
  <BounceAnimation>{/* ... */}</BounceAnimation>
)}
```

### Acessibilidade

1. **ARIA Labels**
```tsx
<MagneticButton aria-label="Preencher dados do produto">
  Preencher
</MagneticButton>
```

2. **Navegação por Teclado**
```tsx
// Componentes já suportam, mas teste:
// - Tab para navegar
// - Enter/Space para ativar
// - Esc para fechar modais
```

3. **Contraste**
```tsx
// Use cores com contraste adequado
<LightBar variant="badge" lightColor="rgba(254, 44, 85, 0.5)">
  <span className="text-gray-900 dark:text-gray-100">
    Badge
  </span>
</LightBar>
```

### Responsividade

1. **Grid Adaptativo**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <InteractiveMetric label="50un" value="R$ 1.250" />
  <InteractiveMetric label="100un" value="R$ 2.500" />
  <InteractiveMetric label="200un" value="R$ 5.000" />
</div>
```

2. **Altura Dinâmica**
```tsx
<ScrollCardProgress 
  maxHeight="400px" // Desktop
  className="md:max-h-[600px]" // Tablet+
>
  {/* ... */}
</ScrollCardProgress>
```

---

## 📋 Checklist de Integração

### Produtos

- [ ] Importar componentes necessários
- [ ] Substituir card principal por Card3D + AnimatedGradient
- [ ] Atualizar imagens para HoverBlur
- [ ] Adicionar LightBar nos badges
- [ ] Substituir botões por MagneticButton
- [ ] Adicionar InteractiveMetric nas projeções
- [ ] Implementar CopyToClipboard em SKUs/preços
- [ ] Testar em diferentes resoluções
- [ ] Verificar acessibilidade
- [ ] Validar performance

### Vendas

- [ ] Adicionar PageProgressBar no topo
- [ ] Envolver card de status em BounceAnimation
- [ ] Adicionar FloatingAnimation no ícone
- [ ] Aplicar Text3DHover nas métricas
- [ ] Implementar AutoplayTabs para períodos
- [ ] Adicionar ScrollCardProgress na lista
- [ ] Testar autoplay das abas
- [ ] Verificar scroll com progresso
- [ ] Validar em mobile
- [ ] Testar acessibilidade

### Global

- [ ] Adicionar SmoothScroll no App.tsx
- [ ] Configurar PageProgressBar (se global)
- [ ] Testar scroll suave em todas as páginas
- [ ] Verificar compatibilidade com navegadores
- [ ] Validar prefers-reduced-motion

---

## 🚀 Exemplo Completo - Produtos

```tsx
// src/pages/Products.tsx ou src/components/ProductsView.tsx

import React from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { AnimatedGradient } from '@/components/ui/AnimatedGradient';
import { HoverBlur } from '@/components/ui/HoverBlur';
import { LightBar } from '@/components/ui/LightBar';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';
import { InteractiveMetric } from '@/components/ui/InteractiveMetric';
import { Package } from 'lucide-react';

export const ProductsView = () => {
  const product = {
    id: '1',
    name: 'KIT 3 Toucas de cetim',
    image: '/produto.jpg',
    price: 'R$ 89,90',
    sku: 'SKU-12345',
    shopeeAds: true,
  };

  const handleFill = () => {
    console.log('Preencher produto');
  };

  const handleProjection = (qty: number) => {
    console.log(`Projeção para ${qty} unidades`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              overlayOpacity={0.2}
              className="w-full h-64 mb-4"
            />
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <LightBar variant="metric">
                <p className="text-sm text-white/80">Preço de venda</p>
                <CopyToClipboard 
                  text={product.price}
                  successMessage="Preço copiado!"
                  className="bg-white/20 hover:bg-white/30"
                >
                  <p className="text-lg font-bold text-white">
                    {product.price}
                  </p>
                </CopyToClipboard>
              </LightBar>
              
              {product.shopeeAds && (
                <LightBar variant="badge">
                  <span className="text-white">Shopee Ads</span>
                </LightBar>
              )}
            </div>
            
            <div className="mb-4">
              <CopyToClipboard 
                text={product.sku}
                successMessage="SKU copiado!"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                {product.sku}
              </CopyToClipboard>
            </div>
            
            {/* Projeções */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[50, 100, 200].map((qty) => (
                <InteractiveMetric
                  key={qty}
                  label={`${qty} un`}
                  value={`R$ ${(parseFloat(product.price.replace('R$ ', '').replace(',', '.')) * qty).toFixed(2)}`}
                  icon={<Package className="w-4 h-4" />}
                  onClick={() => handleProjection(qty)}
                  className="bg-white/20 hover:bg-white/30 text-white"
                />
              ))}
            </div>
            
            <MagneticButton
              strength={0.3}
              variant="primary"
              className="w-full"
              onClick={handleFill}
            >
              Preencher
            </MagneticButton>
          </AnimatedGradient>
        </Card3D>
        
        {/* Grid de Produtos */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Produtos adicionados</h3>
          {/* Lista de produtos... */}
        </div>
      </div>
    </div>
  );
};
```

---

## 📞 Suporte

### Problemas Comuns

**1. Componente não aparece**
- Verifique se importou corretamente
- Confira se o caminho está correto
- Veja se há erros no console

**2. Animação não funciona**
- Verifique se Framer Motion está instalado
- Confira se `prefers-reduced-motion` não está ativo
- Teste em outro navegador

**3. Performance ruim**
- Reduza `intensity` dos efeitos 3D
- Use lazy loading
- Simplifique em mobile

**4. Erro de TypeScript**
- Verifique tipos das props
- Confira se passou todas as props obrigatórias
- Veja exemplos na documentação

---

**Última Atualização:** 28 de Fevereiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
