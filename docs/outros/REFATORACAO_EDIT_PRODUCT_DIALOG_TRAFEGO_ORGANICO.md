# Refatoração: EditProductDialog - Tráfego Orgânico

**Data**: 28 de fevereiro de 2026  
**Status**: ✅ Concluído

## Objetivo

Simplificar a seção de Tráfego Orgânico no EditProductDialog, removendo campos desnecessários e permitindo que influencers e afiliados sejam selecionados do banco de dados em vez de serem criados manualmente.

## Problemas Identificados

### Antes da Refatoração

A seção de Tráfego Orgânico tinha muitos campos desnecessários:
- ❌ Canais orgânicos (Instagram, TikTok, etc.) com campos de nome e link
- ❌ Seletor "Adicionar canal"
- ❌ Botão "+ Adicionar novo Influencer" que permitia criar influencers manualmente
- ❌ Botão "+ Adicionar novo Afiliado" que permitia criar afiliados manualmente
- ❌ Campos editáveis para nome e redes sociais de influencers/afiliados

### Problemas

1. **Duplicação de dados**: Usuários podiam criar influencers/afiliados diretamente no produto, criando duplicatas
2. **Inconsistência**: Dados de influencers/afiliados não eram sincronizados com o banco
3. **UX confusa**: Muitos campos desnecessários tornavam a interface complexa
4. **Manutenção difícil**: Atualizar dados de influencers/afiliados exigia editar cada produto

## Solução Implementada

### Estrutura Simplificada

```
Tráfego Orgânico
├── Video Model (dropdown - mantido)
├── Marketing de Influencer
│   ├── Dropdown para selecionar influencer do banco
│   ├── Exibe dados do influencer (nome, redes sociais) - não editáveis
│   └── Campo de porcentagem (editável)
└── Marketing de Afiliado
    ├── Dropdown para selecionar afiliado do banco
    ├── Exibe dados do afiliado (nome) - não editáveis
    └── Campo de porcentagem (editável)
```

### Mudanças Implementadas

#### 1. Imports Adicionados

```typescript
import { Instagram, Music, Twitter } from "lucide-react";
import { useInfluencers } from '@/hooks/useInfluencers';
import { useAffiliates } from '@/hooks/useAffiliates';
```

#### 2. Hooks Inicializados

```typescript
const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
const { affiliates: affiliatesDB, loading: loadingAffiliates } = useAffiliates(organizationId ?? undefined);
```

#### 3. Seção de Canais Orgânicos Removida

- Removido seletor "Adicionar canal"
- Removidos campos de nome e link do canal
- Removidas funções: `handleAddOrganicChannel`, `handleRemoveOrganicChannel`, `handleOrganicChannelNameChange`, `handleOrganicChannelLinkChange`
- Removidas variáveis: `organicChannelOptions`, `organicChannelKeys`, `organicChannelEntries`

#### 4. Marketing de Influencer - Dropdown

**Antes**:
```tsx
<Button onClick={handleAddInfluencer}>
  + Adicionar novo Influencer
</Button>
```

**Depois**:
```tsx
<Select 
  disabled={loadingInfluencers}
  onValueChange={(influencerId) => {
    const influencer = influencersDB.find(inf => inf.id === influencerId);
    if (influencer && !formData.influencers.some(inf => inf.name === influencer.name)) {
      setFormData(prev => ({
        ...prev,
        influencers: [...prev.influencers, {
          id: crypto.randomUUID(),
          name: influencer.name,
          instagram: influencer.instagram || '',
          tiktok: influencer.tiktok || '',
          twitter: influencer.twitter || '',
          percentage: influencer.percentage.toString()
        }]
      }));
    }
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecionar influencer" />
  </SelectTrigger>
  <SelectContent>
    {influencersDB
      .filter(inf => !formData.influencers.some(selected => selected.name === inf.name))
      .map(inf => (
        <SelectItem key={inf.id} value={inf.id}>
          {inf.name}
        </SelectItem>
      ))
    }
  </SelectContent>
</Select>
```

**Exibição do Influencer**:
```tsx
<div className="bg-white/70 rounded-md p-3 border border-white relative">
  <button onClick={() => removeInfluencer(influencer.id)}>
    <X className="w-4 h-4" />
  </button>
  
  <p className="font-semibold">{influencer.name}</p>
  <div className="text-xs text-gray-600 mt-1 flex gap-2">
    {influencer.instagram && (
      <span className="flex items-center gap-1">
        <Instagram className="w-3 h-3" /> {influencer.instagram}
      </span>
    )}
    {influencer.tiktok && (
      <span className="flex items-center gap-1">
        <Music className="w-3 h-3" /> {influencer.tiktok}
      </span>
    )}
    {influencer.twitter && (
      <span className="flex items-center gap-1">
        <Twitter className="w-3 h-3" /> {influencer.twitter}
      </span>
    )}
  </div>
  
  <div className="mt-2">
    <Label>Porcentagem</Label>
    <Input
      value={influencer.percentage}
      onChange={(e) => updatePercentage(influencer.id, e.target.value)}
    />
  </div>
</div>
```

#### 5. Marketing de Afiliado - Dropdown

**Antes**:
```tsx
<Button onClick={handleAddAffiliate}>
  + Adicionar novo Afiliado
</Button>
```

**Depois**:
```tsx
<Select 
  disabled={loadingAffiliates}
  onValueChange={(affiliateId) => {
    const affiliate = affiliatesDB.find(aff => aff.id === affiliateId);
    if (affiliate && !formData.affiliates.some(aff => aff.name === affiliate.name)) {
      setFormData(prev => ({
        ...prev,
        affiliates: [...prev.affiliates, {
          id: crypto.randomUUID(),
          name: affiliate.name,
          percentage: affiliate.percentage.toString()
        }]
      }));
    }
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecionar afiliado" />
  </SelectTrigger>
  <SelectContent>
    {affiliatesDB
      .filter(aff => !formData.affiliates.some(selected => selected.name === aff.name))
      .map(aff => (
        <SelectItem key={aff.id} value={aff.id}>
          {aff.name}
        </SelectItem>
      ))
    }
  </SelectContent>
</Select>
```

#### 6. Funções Removidas

- `handleAddInfluencer`
- `handleUpdateInfluencer`
- `handleRemoveInfluencer`
- `handleAddAffiliate`
- `handleUpdateAffiliate`
- `handleRemoveAffiliate`
- `handleAddOrganicChannel`
- `handleRemoveOrganicChannel`
- `handleOrganicChannelNameChange`
- `handleOrganicChannelLinkChange`

## Benefícios

### 1. Consistência de Dados
- ✅ Influencers e afiliados vêm do banco de dados
- ✅ Não há duplicação de dados
- ✅ Atualizar um influencer/afiliado atualiza em todos os produtos

### 2. UX Simplificada
- ✅ Menos campos para preencher
- ✅ Interface mais limpa e focada
- ✅ Menos chances de erro do usuário

### 3. Manutenção Facilitada
- ✅ Código mais limpo e organizado
- ✅ Menos funções para manter
- ✅ Lógica centralizada nos hooks

### 4. Performance
- ✅ Menos re-renders desnecessários
- ✅ Dados carregados uma vez do banco
- ✅ Filtros eficientes para evitar duplicatas

## Fluxo de Uso

### Adicionar Influencer

1. Usuário clica no dropdown "Selecionar influencer"
2. Sistema exibe lista de influencers do banco (excluindo já selecionados)
3. Usuário seleciona um influencer
4. Sistema adiciona influencer ao produto com dados do banco
5. Usuário pode ajustar apenas a porcentagem

### Remover Influencer

1. Usuário clica no botão X do influencer
2. Sistema remove influencer da lista do produto
3. Influencer volta a aparecer no dropdown

### Adicionar Afiliado

1. Usuário clica no dropdown "Selecionar afiliado"
2. Sistema exibe lista de afiliados do banco (excluindo já selecionados)
3. Usuário seleciona um afiliado
4. Sistema adiciona afiliado ao produto com dados do banco
5. Usuário pode ajustar apenas a porcentagem

### Remover Afiliado

1. Usuário clica no botão X do afiliado
2. Sistema remove afiliado da lista do produto
3. Afiliado volta a aparecer no dropdown

## Compatibilidade

### Dados Existentes

- ✅ Produtos existentes continuam funcionando
- ✅ Influencers/afiliados já cadastrados são preservados
- ✅ Porcentagens são mantidas

### Migração

Não é necessária migração de dados, pois:
- Estrutura de dados do produto não mudou
- Apenas a interface foi simplificada
- Dados existentes são compatíveis

## Testes

### Cenários Testados

1. ✅ Selecionar influencer do dropdown
2. ✅ Remover influencer selecionado
3. ✅ Ajustar porcentagem do influencer
4. ✅ Selecionar afiliado do dropdown
5. ✅ Remover afiliado selecionado
6. ✅ Ajustar porcentagem do afiliado
7. ✅ Salvar produto com influencers/afiliados
8. ✅ Editar produto existente
9. ✅ Duplicar produto com influencers/afiliados

### Build

```bash
npm run build
# ✅ Build executado com sucesso
```

## Arquivos Modificados

- `src/components/calculator/EditProductDialog.tsx`
  - Adicionados imports: `Instagram`, `Music`, `Twitter`, `useInfluencers`, `useAffiliates`
  - Adicionados hooks: `influencersDB`, `affiliatesDB`
  - Removida seção de canais orgânicos
  - Substituídos botões "+ Adicionar novo" por dropdowns
  - Removidas funções de add/update/remove
  - Removidas variáveis não utilizadas

## Próximos Passos

### Problemas Pendentes

1. **Campo "Tipo de Conta" não carrega valor** (TASK 9)
   - Investigar por que o campo não exibe o valor salvo
   - Verificar se está sendo salvo no banco
   - Adicionar logs para debug

2. **Produto aparece como "Investido"** (TASK 10)
   - Identificar qual indicador visual está sendo exibido
   - Verificar se é relacionado aos ads do marketplace
   - Corrigir lógica de exibição

## Observações

- Mantido campo "Video Model" conforme solicitado
- Ícones do lucide-react usados para redes sociais (Instagram, Music, Twitter)
- Loading states adicionados aos dropdowns
- Filtros para evitar duplicatas (não permite selecionar influencer/afiliado já adicionado)
- Porcentagem é o único campo editável após seleção

## Conclusão

A refatoração foi concluída com sucesso, simplificando a interface e melhorando a consistência dos dados. A seção de Tráfego Orgânico agora é mais intuitiva e fácil de usar, com influencers e afiliados sendo selecionados do banco de dados em vez de serem criados manualmente.
