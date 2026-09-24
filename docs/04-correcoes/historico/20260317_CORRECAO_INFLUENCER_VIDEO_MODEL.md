# Correção: Influencer + Video Model

**Data**: 28 de Fevereiro de 2026  
**Status**: ✅ Concluído

## Problema Identificado

Na implementação anterior, o dropdown "Video Model" foi completamente substituído pelo dropdown "Influencer". No entanto, o usuário solicitou que AMBOS os dropdowns existam:

1. **Influencer para Vídeo**: Dropdown para selecionar o influencer cadastrado
2. **Video Model**: Dropdown para selecionar o modelo de IA de vídeo (Veo3, Sora2, Grok, etc.)

## Solução Implementada

### 1. Estrutura Final

Agora temos DUAS seções separadas em "Tráfego Orgânico > Forma Manual":

#### Seção 1: Influencer para Vídeo
- Dropdown com influencers cadastrados no banco de dados
- Carrega dados da tabela `influencers`
- Salva `influencer_id` no produto
- Mensagem quando não há influencers cadastrados

#### Seção 2: Video Model
- Botões rápidos para modelos populares (Veo3, Grok, Sora2, Wan2)
- Botões adicionais (Cópia, Kling, Runway, Luma, Pika 2.5, Seedance)
- Dropdown com todos os modelos
- Checkboxes para Plano Gratuito/Pago

### 2. Fluxo de Uso

1. Usuário cadastra influencers na seção "Marketing de Influencer"
2. Usuário seleciona um influencer no dropdown "Influencer para Vídeo"
3. Usuário seleciona um modelo de vídeo (Veo3, Sora2, etc.)
4. Usuário escolhe o plano (Gratuito ou Pago)
5. Ao salvar o produto:
   - `influencer_id` é salvo (FK para tabela influencers)
   - `videoGenerationLlm` é salvo (texto: 'veo3', 'sora2', etc.)

### 3. Dados Salvos no Banco

```typescript
{
  influencer_id: "uuid-do-influencer",
  videoGenerationLlm: "sora2",
  // ... outros campos
}
```

## Arquivos Modificados

### 1. `src/components/calculator/TrafficConfig.tsx`

**Adicionado**:
- Props `videoGenerationLlm`, `setVideoGenerationLlm`
- Props `videoGenerationPlan`, `setVideoGenerationPlan`
- Seção "Video Model" completa com botões e dropdown
- Mantida seção "Influencer para Vídeo"

**Estrutura**:
```typescript
{organicSubMode === 'manual' && (
  <>
    {/* Seção 1: Influencer para Vídeo */}
    <CollapsibleSection title="Influencer para Vídeo">
      <Select> {/* Influencers do banco */} </Select>
    </CollapsibleSection>

    {/* Seção 2: Video Model */}
    <CollapsibleSection title="Video Model">
      <Button>Veo3</Button>
      <Button>Sora2</Button>
      {/* ... outros modelos */}
      <Select> {/* Dropdown de modelos */} </Select>
      <Checkbox>Plano Gratuito</Checkbox>
      <Checkbox>Plano Pago</Checkbox>
    </CollapsibleSection>
  </>
)}
```

### 2. `src/hooks/useDropshippingCalculator.ts`

**Adicionado de volta**:
```typescript
const [videoGenerationLlm, setVideoGenerationLlm] = useState<'veo3' | 'sora2' | ...>('sora2');
const [videoGenerationPlan, setVideoGenerationPlan] = useState<'free' | 'paid' | null>('free');
```

**Return**:
```typescript
return {
  // ... outros estados
  selectedInfluencerId, setSelectedInfluencerId,
  videoGenerationLlm, setVideoGenerationLlm,
  videoGenerationPlan, setVideoGenerationPlan,
  // ... outros estados
};
```

### 3. `src/components/DropshippingCalculator.tsx`

**Props do TrafficConfig**:
```typescript
<TrafficConfig
  selectedInfluencerId={selectedInfluencerId}
  setSelectedInfluencerId={setSelectedInfluencerId}
  videoGenerationLlm={videoGenerationLlm}
  setVideoGenerationLlm={setVideoGenerationLlm}
  videoGenerationPlan={videoGenerationPlan}
  setVideoGenerationPlan={setVideoGenerationPlan}
  // ... outras props
/>
```

**Payload de Salvamento**:
```typescript
const payload = {
  // ... outros campos
  influencer_id: selectedInfluencerId || undefined,
  videoGenerationLlm,
  // ... outros campos
};
```

## Modelos de Vídeo Disponíveis

1. **Veo3** - Google Veo 3
2. **Sora2** - OpenAI Sora 2
3. **Grok** - xAI Grok
4. **Wan2** - Wan 2
5. **Cópia** - Cópia AI
6. **Kling** - Kling AI
7. **Runway** - Runway ML
8. **Luma** - Luma AI
9. **Pika 2.5** - Pika Labs 2.5
10. **Seedance** - Seedance AI

## Build

```bash
npm run build
```

**Resultado**: ✅ Build concluído com sucesso em 27.17s

## Testes Necessários

1. ✅ Build sem erros
2. ⏳ Cadastrar influencer na seção de Marketing
3. ⏳ Verificar se influencer aparece no dropdown
4. ⏳ Selecionar influencer
5. ⏳ Selecionar modelo de vídeo
6. ⏳ Salvar produto
7. ⏳ Verificar se ambos os campos foram salvos no banco

## Próximos Passos

### Melhorias Futuras

1. **Criar tabela de Video Models no banco**
   - Permitir cadastro dinâmico de modelos
   - Adicionar informações de custo por modelo
   - Adicionar limites de plano gratuito/pago

2. **Integração com APIs de Vídeo**
   - Implementar geração real de vídeos
   - Usar influencer_id + videoGenerationLlm
   - Armazenar vídeos gerados

3. **Dashboard de Vídeos**
   - Listar vídeos gerados por produto
   - Estatísticas de uso de modelos
   - Custos de geração

## Notas Técnicas

- Ambos os campos são opcionais
- `influencer_id` é FK para tabela `influencers`
- `videoGenerationLlm` é TEXT (enum no TypeScript)
- Suporte a dark mode mantido
- Animações GSAP preservadas

## Conclusão

Correção aplicada com sucesso. Agora temos DUAS seções separadas:
1. **Influencer para Vídeo** - Seleciona o influencer do banco
2. **Video Model** - Seleciona o modelo de IA de vídeo

Ambos os campos são salvos no produto e podem ser usados para gerar vídeos personalizados.
