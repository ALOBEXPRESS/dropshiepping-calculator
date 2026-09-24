# Adicionar Edição de Influencers e Affiliates no EditProductDialog

## Objetivo
Permitir que o usuário adicione, edite e remova influenciadores e afiliados diretamente na tela de "Editar Produto", na aba "Tráfego Orgânico" (step 3), logo abaixo da seção "Video Model".

## Alterações Necessárias

### 1. Adicionar Handlers no EditProductDialog.tsx

Adicionar as seguintes funções após a função `handleRemoveOrganicChannel`:

```typescript
// Handlers para Influencers
const handleAddInfluencer = () => {
  const newInfluencer = {
    id: crypto.randomUUID(),
    name: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    percentage: '0'
  };
  setFormData((prev) => ({
    ...prev,
    influencers: [...prev.influencers, newInfluencer]
  }));
};

const handleUpdateInfluencer = (id: string, field: keyof typeof formData.influencers[0], value: string) => {
  setFormData((prev) => ({
    ...prev,
    influencers: prev.influencers.map((inf) =>
      inf.id === id ? { ...inf, [field]: value } : inf
    )
  }));
};

const handleRemoveInfluencer = (id: string) => {
  setFormData((prev) => ({
    ...prev,
    influencers: prev.influencers.filter((inf) => inf.id !== id)
  }));
};

// Handlers para Affiliates
const handleAddAffiliate = () => {
  const newAffiliate = {
    id: crypto.randomUUID(),
    name: '',
    percentage: '0'
  };
  setFormData((prev) => ({
    ...prev,
    affiliates: [...prev.affiliates, newAffiliate]
  }));
};

const handleUpdateAffiliate = (id: string, field: keyof typeof formData.affiliates[0], value: string) => {
  setFormData((prev) => ({
    ...prev,
    affiliates: prev.affiliates.map((aff) =>
      aff.id === id ? { ...aff, [field]: value } : aff
    )
  }));
};

const handleRemoveAffiliate = (id: string) => {
  setFormData((prev) => ({
    ...prev,
    affiliates: prev.affiliates.filter((aff) => aff.id !== id)
  }));
};
```

### 2. Substituir a Seção de Exibição no Step 3

Localizar a seção atual (linhas ~1920-1960) e substituir por:

```typescript
{/* Influencers Section - EDITABLE */}
<div className="mb-4 space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-xs font-bold text-gray-500 uppercase border-b border-white pb-1">Marketing de Influencer</p>
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={handleAddInfluencer}
      className="h-7 text-xs"
    >
      + Adicionar novo Influencer
    </Button>
  </div>
  
  {formData.influencers.length === 0 ? (
    <p className="text-xs text-gray-600 italic">Nenhum influenciador adicionado.</p>
  ) : (
    <div className="grid grid-cols-1 gap-3">
      {formData.influencers.map((influencer) => (
        <div key={influencer.id} className="bg-white/70 rounded-md p-3 border border-white relative">
          <button
            type="button"
            onClick={() => handleRemoveInfluencer(influencer.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Remover influenciador"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-1 gap-2 pr-6">
            <div>
              <Label className="text-xs text-gray-600">Nome do Influenciador</Label>
              <Input
                value={influencer.name}
                onChange={(e) => handleUpdateInfluencer(influencer.id, 'name', e.target.value)}
                placeholder="Nome"
                className="h-8 text-xs bg-white mt-1"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-gray-600">Conta do instagram</Label>
                <Input
                  value={influencer.instagram || ''}
                  onChange={(e) => handleUpdateInfluencer(influencer.id, 'instagram', e.target.value)}
                  placeholder="@usuario ou link"
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Conta do tiktok</Label>
                <Input
                  value={influencer.tiktok || ''}
                  onChange={(e) => handleUpdateInfluencer(influencer.id, 'tiktok', e.target.value)}
                  placeholder="@usuario ou link"
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Conta do X</Label>
                <Input
                  value={influencer.twitter || ''}
                  onChange={(e) => handleUpdateInfluencer(influencer.id, 'twitter', e.target.value)}
                  placeholder="@usuario ou link"
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Porcentagem Influencer</Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={influencer.percentage}
                  onChange={(e) => handleCurrencyChange(e, (val) => handleUpdateInfluencer(influencer.id, 'percentage', val))}
                  placeholder="0,00"
                  className="h-8 text-xs bg-white pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* Affiliates Section - EDITABLE */}
<div className="mb-4 space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-xs font-bold text-gray-500 uppercase border-b border-white pb-1">Marketing de Afiliado</p>
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={handleAddAffiliate}
      className="h-7 text-xs"
    >
      + Adicionar novo Afiliado
    </Button>
  </div>
  
  {formData.affiliates.length === 0 ? (
    <p className="text-xs text-gray-600 italic">Nenhum afiliado adicionado.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {formData.affiliates.map((affiliate) => (
        <div key={affiliate.id} className="bg-white/70 rounded-md p-3 border border-white relative">
          <button
            type="button"
            onClick={() => handleRemoveAffiliate(affiliate.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Remover afiliado"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-1 gap-2 pr-6">
            <div>
              <Label className="text-xs text-gray-600">Nome do afiliado</Label>
              <Input
                value={affiliate.name}
                onChange={(e) => handleUpdateAffiliate(affiliate.id, 'name', e.target.value)}
                placeholder="Nome"
                className="h-8 text-xs bg-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Porcentagem de comissão Alob</Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={affiliate.percentage}
                  onChange={(e) => handleCurrencyChange(e, (val) => handleUpdateAffiliate(affiliate.id, 'percentage', val))}
                  placeholder="0,00"
                  className="h-8 text-xs bg-white pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

### 3. Posicionamento no Código

A nova seção deve ser inserida logo após a seção de "Video Model" e antes da seção de métricas (Custo/vídeo, Impressões, etc.).

Localizar esta linha (aproximadamente linha 1855):
```typescript
</div>
```

E inserir as novas seções de Influencers e Affiliates ANTES da linha:
```typescript
<div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
```

## Fluxo de Dados

1. **Adicionar**: Usuário clica em "+ Adicionar novo Influencer/Afiliado"
2. **Editar**: Usuário preenche os campos inline
3. **Remover**: Usuário clica no X para remover
4. **Salvar**: Ao clicar em "Salvar alterações", os dados são persistidos no banco

## Validações

- IDs são gerados automaticamente com `crypto.randomUUID()`
- Porcentagens usam `handleCurrencyChange` para formatação brasileira
- Campos opcionais (redes sociais) podem ficar vazios
- Arrays vazios são o padrão quando não há dados

## Resultado Esperado

Após a implementação, o usuário poderá:
- ✅ Ver influenciadores e afiliados existentes
- ✅ Adicionar novos influenciadores e afiliados
- ✅ Editar informações inline
- ✅ Remover influenciadores e afiliados
- ✅ Salvar todas as alterações no banco de dados

## Compatibilidade

- Funciona com dados existentes (modo leitura → modo edição)
- Mantém compatibilidade com a calculadora (TrafficConfig)
- Dados fluem corretamente: EditDialog ↔ Database ↔ Calculator
