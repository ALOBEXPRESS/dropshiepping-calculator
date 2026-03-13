# Correção: Marketing de Influencer e Afiliado com Checkboxes

**Data**: 28 de fevereiro de 2026  
**Status**: ✅ Concluído

## Objetivo

Modificar as seções "Marketing de Influencer" e "Marketing de Afiliado" na calculadora para que não permitam adicionar novos registros, mas sim selecionar os já cadastrados no banco de dados usando checkboxes.

## Mudanças Implementadas

### 1. Hook para Afiliados

Criado novo hook `src/hooks/useAffiliates.ts` para buscar afiliados do banco de dados:

```typescript
export interface AffiliateDB {
  id: string;
  organization_id: string;
  name: string;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export const useAffiliates = (organizationId?: string) => {
  // Busca afiliados da tabela 'affiliates' filtrados por organization_id
  // Retorna: { affiliates, loading, error }
}
```

### 2. Modificações no TrafficConfig.tsx

#### Imports Adicionados
- `useAffiliates` hook
- `Checkbox` component do shadcn/ui

#### Busca de Dados
```typescript
const { organizationId } = useSettings();
const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
const { affiliates: affiliatesDB, loading: loadingAffiliates } = useAffiliates(organizationId ?? undefined);
```

#### Interface de Seleção

**Marketing de Influencer:**
- Lista todos os influencers cadastrados no banco
- Checkbox para selecionar/desselecionar
- Exibe informações de redes sociais (Instagram, TikTok, Twitter)
- Campo de porcentagem aparece apenas quando selecionado
- Mensagem quando não há influencers cadastrados

**Marketing de Afiliado:**
- Lista todos os afiliados cadastrados no banco
- Checkbox para selecionar/desselecionar
- Exibe informações de redes sociais (Instagram, TikTok, Twitter)
- Campo "Porcentagem de comissão Alob" aparece apenas quando selecionado
- Mensagem quando não há afiliados cadastrados

### 3. Limpeza de Código

Removidas funções não utilizadas:
- `handleAddInfluencer`
- `handleRemoveInfluencer`
- `handleInfluencerChange`
- `handleAddAffiliate`
- `handleRemoveAffiliate`
- `handleAffiliateChange`

Removidos imports não utilizados:
- `Plus` (lucide-react)
- `Trash2` (lucide-react)

## Comportamento

### Estados de Loading
- Exibe "Carregando influencers..." enquanto busca dados
- Exibe "Carregando afiliados..." enquanto busca dados

### Estados Vazios
- Mensagem: "Nenhum influencer cadastrado. Cadastre influencers primeiro para poder selecioná-los."
- Mensagem: "Nenhum afiliado cadastrado. Cadastre afiliados primeiro para poder selecioná-los."

### Seleção
1. Usuário marca checkbox do influencer/afiliado
2. Registro é adicionado ao array local com dados do banco
3. Campo de porcentagem aparece para edição
4. Usuário pode ajustar a porcentagem
5. Ao desmarcar, registro é removido do array local

### Persistência
- Dados selecionados são salvos no produto através dos arrays `influencers` e `affiliates`
- Porcentagens editadas são mantidas no estado local

## Arquivos Modificados

- ✅ `src/hooks/useAffiliates.ts` (criado)
- ✅ `src/components/calculator/TrafficConfig.tsx` (modificado)

## Build

```bash
npm run build
```

**Resultado**: ✅ Build concluído em 21.89s, 0 erros

## Próximos Passos

1. Testar fluxo completo:
   - Cadastrar influencers/afiliados no Supabase
   - Verificar se aparecem na lista com checkboxes
   - Selecionar influencers/afiliados
   - Ajustar porcentagens
   - Salvar produto
   - Verificar se dados foram salvos corretamente

2. Validar integração com n8n para processamento de comissões

## Observações

- A interface mantém o design consistente com o resto da aplicação
- Suporte a dark mode implementado
- Emojis usados para identificar redes sociais (📷 Instagram, 🎵 TikTok, 🐦 Twitter)
- Campos de porcentagem aparecem apenas quando necessário para melhor UX
