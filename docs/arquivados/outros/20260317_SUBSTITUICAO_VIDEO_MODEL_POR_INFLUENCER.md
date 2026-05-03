# Substituição de Video Model por Influencer

**Data**: 28 de Fevereiro de 2026  
**Status**: ✅ Concluído

## Objetivo

Substituir o dropdown "Video Model" (que mostrava modelos de vídeo como Veo3, Sora2, Grok, etc.) por um dropdown "Influencer" que mostra os influencers cadastrados no banco de dados. O influencer selecionado será usado para gerar vídeos do produto com uma LLM de video model.

## Contexto

Na calculadora, na seção "Tráfego Orgânico > Forma Manual", havia um dropdown "Video Model" que permitia selecionar modelos de IA para geração de vídeo. O usuário solicitou que esse dropdown fosse substituído por um dropdown de influencers cadastrados, permitindo associar um influencer específico ao produto para geração de vídeo.

## Mudanças Implementadas

### 1. Banco de Dados

#### Migração Aplicada
- **Arquivo**: `supabase/migrations/20260228_create_influencers_table.sql`
- **Ação**: Adicionada coluna `influencer_id` na tabela `products`
  ```sql
  ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES public.influencers(id) ON DELETE SET NULL;
  
  CREATE INDEX IF NOT EXISTS idx_products_influencer_id ON public.products(influencer_id);
  ```

**Nota**: A tabela `influencers` já existia no banco de dados, criada anteriormente.

### 2. Frontend - TrafficConfig.tsx

#### Imports Adicionados
```typescript
import { useInfluencers } from '../../hooks/useInfluencers';
import { useSettings } from '../../contexts/SettingsContext';
```

#### Props Modificadas
**Removido**:
```typescript
videoGenerationLlm?: 'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance' | null;
setVideoGenerationLlm?: (value: ...) => void;
videoGenerationPlan?: 'free' | 'paid' | null;
setVideoGenerationPlan?: (value: 'free' | 'paid' | null) => void;
```

**Adicionado**:
```typescript
selectedInfluencerId?: string | null;
setSelectedInfluencerId?: (value: string | null) => void;
```

#### Hooks Adicionados
```typescript
const { organizationId } = useSettings();
const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
```

#### UI Substituída
**Antes**: Seção "Video Model" com botões e dropdown de modelos de vídeo (Veo3, Sora2, Grok, etc.)

**Depois**: Seção "Influencer para Vídeo" com:
- Dropdown simples mostrando influencers cadastrados
- Mensagem quando não há influencers cadastrados
- Indicador visual quando um influencer é selecionado

### 3. Hook - useDropshippingCalculator.ts

#### State Modificado
**Removido**:
```typescript
const [videoGenerationLlm, setVideoGenerationLlm] = useState<'veo3' | 'sora2' | 'grok' | ...>('sora2');
const [videoGenerationPlan, setVideoGenerationPlan] = useState<'free' | 'paid' | null>('free');
```

**Adicionado**:
```typescript
const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
```

#### Return Modificado
```typescript
// Removido: videoGenerationLlm, setVideoGenerationLlm, videoGenerationPlan, setVideoGenerationPlan
// Adicionado: selectedInfluencerId, setSelectedInfluencerId
```

### 4. DropshippingCalculator.tsx

#### Props do TrafficConfig Atualizadas
```typescript
<TrafficConfig
  // ... outras props
  selectedInfluencerId={selectedInfluencerId}
  setSelectedInfluencerId={setSelectedInfluencerId}
  // ... outras props
/>
```

#### Payload de Salvamento
```typescript
const payload = {
  // ... outros campos
  influencer_id: selectedInfluencerId || undefined,
  // ... outros campos
};
```

### 5. Types - calculator.ts

#### Interface ProductItem Atualizada
```typescript
export interface ProductItem {
  // ... outros campos
  influencer_id?: string;
  // ... outros campos
}
```

## Fluxo de Uso

1. **Cadastrar Influencers**: Na seção "Marketing de Influencer" dentro de "Tráfego Orgânico", o usuário adiciona influencers com nome, redes sociais e porcentagem
2. **Selecionar Influencer**: Na seção "Influencer para Vídeo" (Forma Manual), o usuário seleciona um influencer do dropdown
3. **Salvar Produto**: Ao salvar o produto, o `influencer_id` é persistido no banco de dados
4. **Geração de Vídeo**: O influencer selecionado será usado para gerar vídeos do produto com LLM de video model

## Arquivos Modificados

1. ✅ `supabase/migrations/20260228_create_influencers_table.sql` (migração aplicada)
2. ✅ `src/components/calculator/TrafficConfig.tsx`
3. ✅ `src/hooks/useDropshippingCalculator.ts`
4. ✅ `src/components/DropshippingCalculator.tsx`
5. ✅ `src/types/calculator.ts`

## Arquivos Criados

1. ✅ `src/hooks/useInfluencers.ts` (já existia)

## Testes

### Build
```bash
npm run build
```
**Resultado**: ✅ Build concluído com sucesso em 34.08s

### Verificações Necessárias

1. ✅ Migração aplicada no Supabase
2. ✅ Coluna `influencer_id` adicionada em `products`
3. ✅ Dropdown de influencers aparece na calculadora
4. ✅ Influencers cadastrados são carregados do banco
5. ⏳ Testar seleção de influencer e salvamento do produto
6. ⏳ Verificar se `influencer_id` é salvo corretamente no banco

## Próximos Passos

1. Testar o fluxo completo:
   - Cadastrar influencers na seção de Marketing de Influencer
   - Verificar se aparecem no dropdown "Influencer para Vídeo"
   - Selecionar um influencer
   - Salvar o produto
   - Verificar no banco se `influencer_id` foi salvo corretamente

2. Implementar a lógica de geração de vídeo usando o influencer selecionado (se necessário)

## Notas Técnicas

- A tabela `influencers` já existia no banco, criada em uma migração anterior
- O hook `useInfluencers` já estava implementado
- A coluna `influencer_id` foi adicionada com `ON DELETE SET NULL` para não quebrar produtos caso um influencer seja deletado
- O dropdown mostra uma mensagem amigável quando não há influencers cadastrados
- O campo é opcional, permitindo produtos sem influencer associado

## Conclusão

A substituição foi concluída com sucesso. O dropdown "Video Model" foi removido e substituído por "Influencer para Vídeo", que busca influencers cadastrados no banco de dados e permite associá-los ao produto para geração de vídeo.
