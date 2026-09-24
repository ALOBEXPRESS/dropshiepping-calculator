# Guia Rápido - Componentes Vendas CSS Pack

**Referência rápida para usar os 6 novos componentes da página Vendas**

---

## 📊 ScrollCardProgress

**Quando usar:** Lista de transações/vendas com scroll

```tsx
import { ScrollCardProgress } from '@/components/ui/ScrollCardProgress';

<ScrollCardProgress maxHeight="400px" progressColor="#fe2c55">
  <div className="space-y-4">
    {transactions.map((tx) => (
      <div key={tx.id} className="p-4 bg-white rounded-lg">
        <p>{tx.description}</p>
        <p className="font-bold">{tx.amount}</p>
      </div>
    ))}
  </div>
</ScrollCardProgress>
```

**Props:**
- `maxHeight?: string` - Altura máxima (padrão: "400px")
- `progressColor?: string` - Cor da barra (padrão: "#fe2c55")

---

## 🎯 BounceAnimation

**Quando usar:** Card de status, alertas importantes

```tsx
import { BounceAnimation } from '@/components/ui/BounceAnimation';

<BounceAnimation delay={0.2} duration={0.6}>
  <div className="bg-green-100 p-6 rounded-lg">
    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
    <p className="text-center mt-2">Tudo processado!</p>
  </div>
</BounceAnimation>
```

**Props:**
- `delay?: number` - Delay em segundos (padrão: 0)
- `duration?: number` - Duração em segundos (padrão: 0.6)

---

## 📈 PageProgressBar

**Quando usar:** Indicador de scroll da página

```tsx
import { PageProgressBar } from '@/components/ui/PageProgressBar';

// No layout ou App.tsx
<PageProgressBar color="#fe2c55" height={3} />
```

**Props:**
- `color?: string` - Cor da barra (padrão: "#fe2c55")
- `height?: number` - Altura em pixels (padrão: 3)

---

## 🔄 AutoplayTabs

**Quando usar:** Alternar entre métricas/períodos automaticamente

```tsx
import { AutoplayTabs } from '@/components/ui/AutoplayTabs';

<AutoplayTabs
  tabs={[
    {
      value: 'daily',
      label: 'Diário',
      content: <DailyStats />,
    },
    {
      value: 'weekly',
      label: 'Semanal',
      content: <WeeklyStats />,
    },
    {
      value: 'monthly',
      label: 'Mensal',
      content: <MonthlyStats />,
    },
  ]}
  autoplayInterval={5000}
  autoplayEnabled={true}
  progressColor="#fe2c55"
/>
```

**Props:**
- `tabs: Tab[]` - Array de abas (value, label, content)
- `autoplayInterval?: number` - Intervalo em ms (padrão: 5000)
- `autoplayEnabled?: boolean` - Ativar autoplay (padrão: true)
- `progressColor?: string` - Cor da barra (padrão: "#fe2c55")

---

## 🎈 FloatingAnimation

**Quando usar:** Ícones, badges, elementos decorativos

```tsx
import { FloatingAnimation } from '@/components/ui/FloatingAnimation';
import { CheckCircle } from 'lucide-react';

<FloatingAnimation duration={3} yOffset={10}>
  <CheckCircle className="w-12 h-12 text-green-500" />
</FloatingAnimation>
```

**Props:**
- `duration?: number` - Duração do ciclo em segundos (padrão: 3)
- `yOffset?: number` - Deslocamento vertical em pixels (padrão: 10)

---

## 🎭 Text3DHover

**Quando usar:** Valores de receita, métricas importantes

```tsx
import { Text3DHover } from '@/components/ui/Text3DHover';

<Text3DHover intensity={10}>
  <span className="text-4xl font-bold text-green-600">
    R$ 1.250,00
  </span>
</Text3DHover>
```

**Props:**
- `intensity?: number` - Intensidade da rotação 3D (padrão: 10)

---

## 🎨 Exemplo Completo - Dashboard de Vendas

```tsx
import { ScrollCardProgress } from '@/components/ui/ScrollCardProgress';
import { BounceAnimation } from '@/components/ui/BounceAnimation';
import { PageProgressBar } from '@/components/ui/PageProgressBar';
import { AutoplayTabs } from '@/components/ui/AutoplayTabs';
import { FloatingAnimation } from '@/components/ui/FloatingAnimation';
import { Text3DHover } from '@/components/ui/Text3DHover';
import { CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

export const SalesDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Barra de progresso da página */}
      <PageProgressBar color="#fe2c55" height={3} />
      
      {/* Card de status com animação */}
      <BounceAnimation delay={0.2}>
        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-2xl">
          <FloatingAnimation duration={3} yOffset={10}>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          </FloatingAnimation>
          <p className="text-center mt-4 text-lg font-semibold">
            Tudo processado!
          </p>
        </div>
      </BounceAnimation>
      
      {/* Métricas com hover 3D */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
          <Text3DHover intensity={10}>
            <p className="text-3xl font-bold text-green-600">
              R$ 12.500,00
            </p>
          </Text3DHover>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">Custo</p>
          <Text3DHover intensity={10}>
            <p className="text-3xl font-bold text-red-600">
              R$ 5.200,00
            </p>
          </Text3DHover>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">Lucro</p>
          <Text3DHover intensity={10}>
            <p className="text-3xl font-bold text-blue-600">
              R$ 7.300,00
            </p>
          </Text3DHover>
        </div>
      </div>
      
      {/* Abas com autoplay */}
      <AutoplayTabs
        tabs={[
          {
            value: 'daily',
            label: 'Diário',
            content: (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4">Vendas Diárias</h3>
                {/* Gráfico ou dados */}
              </div>
            ),
          },
          {
            value: 'weekly',
            label: 'Semanal',
            content: (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4">Vendas Semanais</h3>
                {/* Gráfico ou dados */}
              </div>
            ),
          },
          {
            value: 'monthly',
            label: 'Mensal',
            content: (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4">Vendas Mensais</h3>
                {/* Gráfico ou dados */}
              </div>
            ),
          },
        ]}
        autoplayInterval={5000}
        progressColor="#fe2c55"
      />
      
      {/* Lista de transações com scroll */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>
        <ScrollCardProgress maxHeight="400px" progressColor="#fe2c55">
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tx.date}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{tx.amount}</p>
              </div>
            ))}
          </div>
        </ScrollCardProgress>
      </div>
    </div>
  );
};
```

---

## 🎯 Dicas de Uso

### Performance
- Use `autoplayInterval` >= 3000ms para melhor UX
- `yOffset` ideal para FloatingAnimation: 8-12px
- `intensity` ideal para Text3DHover: 8-12

### Acessibilidade
- PageProgressBar não interfere com navegação
- AutoplayTabs pausa ao interagir
- Text3DHover mantém legibilidade

### Responsividade
- ScrollCardProgress ajusta altura automaticamente
- BounceAnimation funciona em todos os tamanhos
- AutoplayTabs é responsivo por padrão

---

## 🔄 Integração com SmoothScroll

```tsx
// Em App.tsx ou layout principal
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { PageProgressBar } from '@/components/ui/PageProgressBar';

export const App = () => {
  return (
    <>
      <SmoothScroll />
      <PageProgressBar color="#fe2c55" height={3} />
      
      {/* Resto da aplicação */}
    </>
  );
};
```

---

**Última Atualização:** 28 de Fevereiro de 2026
