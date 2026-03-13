# Problemas Pendentes - EditProductDialog

**Data**: 28 de fevereiro de 2026  
**Status**: ⏳ Documentado - Aguardando Implementação

## Problemas Identificados

### 1. Campo "Tipo de Conta" Não Carrega Valor Salvo ⏳

**Descrição**: Quando um produto é editado, o campo "Tipo de Conta" não exibe o valor que foi salvo (CPF ou CNPJ).

**Localização**: `src/components/calculator/EditProductDialog.tsx` (linhas 1374-1390)

**Código atual**:
```tsx
<Select 
  value={formData.accountType} 
  onValueChange={(val) => handleChange('accountType', val)}
>
  <SelectTrigger className="col-span-3">
    <SelectValue placeholder="Selecione o tipo" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="cpf">CPF</SelectItem>
    <SelectItem value="cnpj">CNPJ</SelectItem>
  </SelectContent>
</Select>
```

**Investigação necessária**:
1. Verificar se o campo `accountType` está sendo salvo no banco de dados
2. Verificar se o campo está sendo carregado corretamente do produto
3. Adicionar logs para debug
4. Verificar se há algum problema de sincronização entre formData e produto

**Possíveis causas**:
- Campo não está sendo salvo no banco
- Campo não está sendo carregado do banco
- Valor está sendo sobrescrito em algum lugar
- Problema de tipo de dados (string vs enum)

---

### 2. Seção de Tráfego Orgânico com Campos Desnecessários ⏳

**Descrição**: A seção de Tráfego Orgânico no EditProductDialog tem muitos campos que não deveriam estar lá.

**Localização**: `src/components/calculator/EditProductDialog.tsx` (linhas 1935-2030)

**Campos atuais**:
- ✅ Video Model (correto - deve permanecer)
- ❌ Canais orgânicos (Instagram, TikTok, etc.) - REMOVER
- ❌ Nome do canal - REMOVER
- ❌ Link do canal - REMOVER
- ❌ Seletor "Adicionar canal" - REMOVER
- ⚠️ Marketing de Influencer - MANTER mas MODIFICAR (usar checkboxes)
- ⚠️ Marketing de Afiliado - MANTER mas MODIFICAR (usar checkboxes)

**Estrutura desejada**:
```
Tráfego Orgânico
├── Video Model (dropdown - já existe)
├── Marketing de Influencer
│   ├── Dropdown para selecionar influencer do banco
│   ├── Ao selecionar, preencher automaticamente:
│   │   ├── Instagram
│   │   ├── TikTok
│   │   └── Twitter/X
│   └── Campo de porcentagem (editável)
└── Marketing de Afiliado
    ├── Dropdown para selecionar afiliado do banco
    ├── Ao selecionar, preencher automaticamente:
    │   ├── Instagram
    │   ├── TikTok
    │   └── Twitter/X
    └── Campo de porcentagem (editável)
```

**Implementação necessária**:

1. **Adicionar hooks**:
```typescript
import { useInfluencers } from '@/hooks/useInfluencers';
import { useAffiliates } from '@/hooks/useAffiliates';

// No componente:
const { organizationId } = useSettings();
const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
const { affiliates: affiliatesDB, loading: loadingAffiliates } = useAffiliates(organizationId ?? undefined);
```

2. **Remover seção de canais orgânicos** (linhas ~1950-2020):
   - Remover seletor "Adicionar canal"
   - Remover lista de canais selecionados
   - Remover campos de nome e link do canal

3. **Modificar Marketing de Influencer** (linhas ~2030-2120):
   - Substituir botão "+ Adicionar novo Influencer" por dropdown
   - Dropdown deve listar influencers do banco (`influencersDB`)
   - Ao selecionar, adicionar ao `formData.influencers` com dados do banco
   - Exibir influencers selecionados com:
     - Nome (não editável)
     - Redes sociais (não editáveis, vindas do banco)
     - Porcentagem (editável)
     - Botão X para remover

4. **Modificar Marketing de Afiliado** (linhas ~2120-2200):
   - Substituir botão "+ Adicionar novo Afiliado" por dropdown
   - Dropdown deve listar afiliados do banco (`affiliatesDB`)
   - Ao selecionar, adicionar ao `formData.affiliates` com dados do banco
   - Exibir afiliados selecionados com:
     - Nome (não editável)
     - Redes sociais (não editáveis, vindas do banco)
     - Porcentagem (editável)
     - Botão X para remover

**Exemplo de código para dropdown de influencer**:
```tsx
<div className="mb-4 space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-xs font-bold text-gray-500 uppercase">Marketing de Influencer</p>
    <Select 
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
      <SelectTrigger className="w-[200px] h-7 text-xs">
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
  </div>
  
  {formData.influencers.length === 0 ? (
    <p className="text-xs text-gray-600 italic">Nenhum influencer selecionado.</p>
  ) : (
    <div className="space-y-2">
      {formData.influencers.map((influencer) => (
        <div key={influencer.id} className="bg-white/70 rounded-md p-3 border border-white relative">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                influencers: prev.influencers.filter(inf => inf.id !== influencer.id)
              }));
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
          
          <p className="font-semibold text-sm">{influencer.name}</p>
          <div className="text-xs text-gray-600 mt-1">
            {influencer.instagram && <span>📷 {influencer.instagram}</span>}
            {influencer.tiktok && <span className="ml-2">🎵 {influencer.tiktok}</span>}
            {influencer.twitter && <span className="ml-2">🐦 {influencer.twitter}</span>}
          </div>
          
          <div className="mt-2">
            <Label className="text-xs">Porcentagem</Label>
            <div className="relative mt-1">
              <Input
                value={influencer.percentage}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    influencers: prev.influencers.map(inf =>
                      inf.id === influencer.id
                        ? { ...inf, percentage: e.target.value }
                        : inf
                    )
                  }));
                }}
                className="h-8 text-xs pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

---

### 3. Produto Aparece como "Investido" Sem Clicar em Investir ⏳

**Descrição**: Quando um produto é adicionado, ele já aparece com algum indicador visual de que está "investido", mesmo sem o usuário ter clicado no botão "Investir" ou habilitado "{Marketplace} Ads".

**Investigação necessária**:
1. Identificar qual indicador visual está sendo exibido
2. Verificar se é relacionado aos ads do marketplace (Shopee Ads, Mercado Ads, etc.)
3. Verificar se há algum campo booleano que está sendo definido como `true` por padrão
4. Verificar a lógica de exibição no ProductCard

**Possíveis causas**:
- Checkbox de ads do marketplace vindo selecionado por padrão
- Campo de investimento sendo definido como `true` ao criar produto
- Lógica visual incorreta no ProductCard
- Dados de campanha sendo preenchidos automaticamente

**Localização**: 
- `src/components/calculator/ProductCard.tsx`
- `src/hooks/useDropshippingCalculator.ts`

---

## Prioridade de Implementação

1. **Alta**: Correção do campo "Tipo de Conta" (afeta dados do produto)
2. **Alta**: Simplificação da seção de Tráfego Orgânico (UX confusa)
3. **Média**: Problema do produto "investido" (visual, não afeta dados)

## Estimativa de Esforço

- Campo "Tipo de Conta": 1-2 horas (investigação + correção)
- Seção de Tráfego Orgânico: 3-4 horas (refatoração completa)
- Produto "investido": 1-2 horas (investigação + correção)

**Total estimado**: 5-8 horas

## Observações

- Todas as mudanças devem manter compatibilidade com dados existentes
- Testes devem ser executados após cada correção
- Documentação deve ser atualizada
- Commit deve ser feito após cada correção funcionar
