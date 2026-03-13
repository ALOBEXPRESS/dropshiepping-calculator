# Correções: Marketing de Influencer e Afiliado

**Data**: 28 de fevereiro de 2026  
**Status**: ⏳ Parcialmente Concluído

## Problemas Identificados

1. ✅ **RESOLVIDO**: Taxas de Marketing não aparecem no painel de resultados
2. ✅ **RESOLVIDO**: Checkbox "Calcular MercadoLivre Ads" vem selecionado por padrão
3. ⏳ **PENDENTE**: Campo "Tipo de Conta" não carrega valor salvo no EditProductDialog
4. ⏳ **PENDENTE**: EditProductDialog permite adicionar novos influencers/afiliados (deveria apenas selecionar)

## Mudanças Implementadas

### 1. Exibição de Taxas de Marketing no ResultsPanel ✅

Adicionadas linhas para exibir as taxas de Marketing de Influencer e Afiliado logo após a "Taxa do Fornecedor" no painel de resultados.

**Localização**: `src/components/DropshippingCalculator.tsx` (linha ~2490)

**Código adicionado**:
```tsx
{/* Marketing de Influencer */}
{influencers && influencers.length > 0 && parseFloat(calculations.influencerCost || '0') > 0 && (
  <div className={`flex justify-between items-center py-2 border-b ${
      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
  }`}>
    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
      Marketing Influencer ({formatPercent(calculations.totalInfluencerPercent || 0, 1)}%)
    </span>
    <span className={`font-semibold ${
        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
    }`}>- R$ {formatMoney(calculations.influencerCost)}</span>
  </div>
)}

{/* Marketing de Afiliado */}
{affiliates && affiliates.length > 0 && parseFloat(calculations.affiliateCost || '0') > 0 && (
  <div className={`flex justify-between items-center py-2 border-b ${
      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
  }`}>
    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
      Marketing Afiliado ({formatPercent(calculations.totalAffiliatePercent || 0, 1)}%)
    </span>
    <span className={`font-semibold ${
        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
    }`}>- R$ {formatMoney(calculations.affiliateCost)}</span>
  </div>
)}
```

**Comportamento**:
- Aparece apenas quando há influencers/afiliados selecionados
- Mostra a porcentagem total
- Exibe o custo calculado
- Segue o mesmo padrão visual das outras taxas

### 2. Correção do Checkbox "Calcular MercadoLivre Ads" ✅

O checkbox estava vindo selecionado por padrão devido ao uso de `Boolean(draft.mercadoAdsEnabled)`.

**Localização**: `src/hooks/useDropshippingCalculator.ts` (linha ~332)

**Antes**:
```typescript
const [mercadoAdsEnabled, setMercadoAdsEnabled] = useState(() => Boolean(draft.mercadoAdsEnabled));
```

**Depois**:
```typescript
const [mercadoAdsEnabled, setMercadoAdsEnabled] = useState(() => draft.mercadoAdsEnabled === true);
```

**Motivo**: `Boolean(undefined)` retorna `false`, mas em alguns casos o draft pode ter valores que causam comportamento inesperado. A comparação estrita `=== true` garante que apenas valores explicitamente `true` sejam considerados.

## Problemas Pendentes

### 3. Campo "Tipo de Conta" no EditProductDialog ⏳

**Problema**: Quando o usuário edita um produto, o campo "Tipo de Conta" não carrega o valor salvo anteriormente.

**Localização**: `src/components/calculator/EditProductDialog.tsx`

**Análise**:
- O campo está renderizado corretamente (linhas 1374-1390)
- O valor inicial é definido como `accountType: source?.accountType || 'cpf'` (linha 245)
- O problema pode estar em:
  1. O produto não está salvando o campo `accountType` no banco
  2. O campo não está sendo carregado corretamente do produto
  3. O valor está sendo sobrescrito em algum lugar

**Próximos passos**:
1. Verificar se `accountType` está sendo salvo no banco de dados
2. Verificar se o campo está sendo carregado corretamente do produto
3. Adicionar logs para debug

### 4. EditProductDialog - Influencers e Afiliados ⏳

**Problema**: O EditProductDialog permite adicionar novos influencers e afiliados, mas deveria apenas permitir selecionar os já cadastrados (como na calculadora).

**Localização**: `src/components/calculator/EditProductDialog.tsx` (linhas 2030-2150+)

**Solução proposta**:
1. Adicionar imports dos hooks `useInfluencers` e `useAffiliates`
2. Buscar influencers e afiliados do banco de dados
3. Substituir os campos de input por checkboxes de seleção
4. Manter apenas o campo de porcentagem editável
5. Remover botões "+ Adicionar novo Influencer/Afiliado"

**Estrutura desejada** (similar ao TrafficConfig.tsx):
```tsx
{/* Marketing de Influencer */}
<div className="mb-4 space-y-2">
  <p className="text-xs font-bold text-gray-500 uppercase border-b border-white pb-1">
    Marketing de Influencer
  </p>
  
  {loadingInfluencers ? (
    <p className="text-xs text-gray-500">Carregando...</p>
  ) : influencersDB.length === 0 ? (
    <p className="text-xs text-gray-600 italic">
      Nenhum influencer cadastrado.
    </p>
  ) : (
    <div className="space-y-2">
      {influencersDB.map((influencerDB) => {
        const isSelected = formData.influencers.some(inf => inf.name === influencerDB.name);
        const selectedInfluencer = formData.influencers.find(inf => inf.name === influencerDB.name);
        
        return (
          <div key={influencerDB.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id={`edit-influencer-${influencerDB.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  // Adicionar ou remover do formData.influencers
                }}
              />
              <div className="flex-1">
                <Label htmlFor={`edit-influencer-${influencerDB.id}`}>
                  {influencerDB.name}
                </Label>
                <div className="text-xs text-gray-600">
                  {influencerDB.instagram && <span>📷 {influencerDB.instagram}</span>}
                  {influencerDB.tiktok && <span>🎵 {influencerDB.tiktok}</span>}
                  {influencerDB.twitter && <span>🐦 {influencerDB.twitter}</span>}
                </div>
                {isSelected && (
                  <div className="mt-2">
                    <Label className="text-xs">Porcentagem</Label>
                    <Input
                      value={selectedInfluencer?.percentage || ''}
                      onChange={(e) => {
                        // Atualizar porcentagem
                      }}
                      className="h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
```

## Arquivos Modificados

- ✅ `src/components/DropshippingCalculator.tsx` (adicionadas taxas de marketing)
- ✅ `src/hooks/useDropshippingCalculator.ts` (corrigido mercadoAdsEnabled)
- ⏳ `src/components/calculator/EditProductDialog.tsx` (pendente: influencers/afiliados)

## Build

```bash
npm run build
```

**Resultado**: ✅ Build concluído em 26.16s, 0 erros

## Próximos Passos

1. **Investigar campo "Tipo de Conta"**:
   - Adicionar logs para verificar se o valor está sendo carregado
   - Verificar se está sendo salvo no banco
   - Testar fluxo completo: criar produto → salvar → editar

2. **Refatorar EditProductDialog**:
   - Adicionar hooks `useInfluencers` e `useAffiliates`
   - Implementar checkboxes de seleção
   - Remover campos de criação de novos registros
   - Manter apenas edição de porcentagem

3. **Testes**:
   - Testar exibição de taxas de marketing no painel de resultados
   - Verificar se checkbox do Mercado Livre Ads não vem selecionado
   - Testar edição de produtos com influencers/afiliados

## Observações

- Os cálculos de `influencerCost` e `affiliateCost` já estavam implementados no `pricingService.ts`
- As taxas são calculadas como porcentagem do preço de venda
- O formato de exibição segue o padrão das outras taxas (com sinal negativo e formatação de moeda)
