# Análise de Alinhamento Frontend x Banco de Dados

**Data**: 23/02/2026  
**Status**: ⚠️ PARCIALMENTE ALINHADO - Requer Atualizações

---

## 📋 Resumo Executivo

O frontend está **parcialmente alinhado** com as mudanças recentes do banco de dados. Os campos `influencers` e `affiliates` estão corretamente implementados, mas os novos campos de normalização (`marketplace_id` e `supplier_id`) **NÃO estão sendo utilizados**.

---

## ✅ O que está CORRETO

### 1. Campos JSONB (Influencers e Affiliates)
- ✅ `ProductItem` type inclui `influencers` e `affiliates`
- ✅ `ProductRow` type inclui os campos JSONB
- ✅ `ProductPayload` type inclui os campos
- ✅ `mapProductRow()` mapeia corretamente os campos
- ✅ Hook `useDropshippingCalculator` gerencia os estados

### 2. Campos Legados Mantidos
- ✅ `marketplace` (TEXT) - mantido por compatibilidade
- ✅ `supplier_name` (TEXT) - mantido por compatibilidade
- ✅ Frontend continua funcionando com campos antigos

### 3. Serviço de Referências
- ✅ `ReferenceService` implementado corretamente
- ✅ Busca marketplaces, suppliers e account holders
- ✅ Suporta filtro por `organization_id`
- ✅ Componentes carregam listas de referência

---

## ❌ O que está FALTANDO

### 1. Campos de Normalização NÃO Implementados

#### `marketplace_id` (UUID FK)
**Status**: ❌ NÃO EXISTE no código

**Onde deveria estar**:
```typescript
// src/types/calculator.ts
export interface ProductItem {
  // ... campos existentes
  marketplace?: string;        // ✅ Existe (legado)
  marketplace_id?: string;     // ❌ FALTA ADICIONAR
}

// src/services/productService.ts
type ProductRow = {
  // ... campos existentes
  marketplace?: string | null;        // ✅ Existe
  marketplace_id?: string | null;     // ❌ FALTA ADICIONAR
}

type ProductPayload = {
  // ... campos existentes
  marketplace?: string | null;        // ✅ Existe
  marketplace_id?: string | null;     // ❌ FALTA ADICIONAR
}
```

#### `supplier_id` (UUID FK)
**Status**: ❌ NÃO EXISTE no código

**Onde deveria estar**:
```typescript
// src/types/calculator.ts
export interface ProductItem {
  // ... campos existentes
  supplierName?: string;       // ✅ Existe (legado)
  supplier_id?: string;        // ❌ FALTA ADICIONAR
}

// src/services/productService.ts
type ProductRow = {
  // ... campos existentes
  supplier_name?: string | null;      // ✅ Existe
  supplier_id?: string | null;        // ❌ FALTA ADICIONAR
}

type ProductPayload = {
  // ... campos existentes
  supplier_name?: string | null;      // ✅ Existe
  supplier_id?: string | null;        // ❌ FALTA ADICIONAR
}
```

### 2. Seleção por ID nos Componentes

#### ProductInfo.tsx
**Status**: ⚠️ USA NOME ao invés de ID

**Problema Atual**:
```typescript
// Usa nome do supplier diretamente
<Input value={supplierName} onChange={...} />
```

**Deveria ser**:
```typescript
// Usar dropdown com ID do supplier
<Select value={supplier_id} onValueChange={setSupplier_id}>
  <SelectContent>
    {suppliersList.map((supplier) => (
      <SelectItem key={supplier.id} value={supplier.id}>
        {supplier.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### MarketplaceConfig (presumido)
**Status**: ⚠️ USA SLUG ao invés de ID

**Problema Atual**:
```typescript
// Usa slug do marketplace
marketplace: 'mercadolivre'
```

**Deveria ser**:
```typescript
// Usar ID do marketplace
marketplace_id: 'uuid-do-marketplace'
// Manter marketplace (TEXT) para compatibilidade
marketplace: 'mercadolivre'
```

### 3. Lógica de Salvamento

#### handleSaveProduct()
**Status**: ❌ NÃO ENVIA marketplace_id e supplier_id

**Código Atual** (DropshippingCalculator.tsx):
```typescript
const payload = {
  organizationId,
  name: productName,
  supplierName,        // ✅ Envia nome (legado)
  marketplace,         // ✅ Envia slug (legado)
  // ❌ NÃO envia supplier_id
  // ❌ NÃO envia marketplace_id
  // ...
};
```

**Deveria ser**:
```typescript
const payload = {
  organizationId,
  name: productName,
  supplierName,        // ✅ Manter para compatibilidade
  supplier_id,         // ❌ ADICIONAR
  marketplace,         // ✅ Manter para compatibilidade
  marketplace_id,      // ❌ ADICIONAR
  // ...
};
```

### 4. Lógica de Busca de IDs

**Status**: ❌ NÃO EXISTE

**O que falta**:
```typescript
// Buscar marketplace_id pelo slug
const findMarketplaceId = (slug: string): string | undefined => {
  return marketplacesList.find(m => m.name.toLowerCase() === slug.toLowerCase())?.id;
};

// Buscar supplier_id pelo nome
const findSupplierId = (name: string): string | undefined => {
  return suppliersList.find(s => s.name.toLowerCase() === name.toLowerCase())?.id;
};
```

### 5. productSelectColumnList

**Status**: ❌ NÃO INCLUI novos campos

**Código Atual** (productService.ts):
```typescript
const productSelectColumnList = [
  'id',
  'organization_id',
  // ... muitos campos
  'marketplace',        // ✅ Existe
  'supplier_name',      // ✅ Existe
  // ❌ FALTA 'marketplace_id'
  // ❌ FALTA 'supplier_id'
  // ...
];
```

---

## 🔧 Mudanças Necessárias

### Fase 1: Atualizar Types e Service

1. **src/types/calculator.ts**
   - Adicionar `marketplace_id?: string` em `ProductItem`
   - Adicionar `supplier_id?: string` em `ProductItem`

2. **src/services/productService.ts**
   - Adicionar `marketplace_id` em `ProductRow`
   - Adicionar `supplier_id` em `ProductRow`
   - Adicionar `marketplace_id` em `ProductPayload`
   - Adicionar `supplier_id` em `ProductPayload`
   - Adicionar campos em `productSelectColumnList`
   - Atualizar `mapProductRow()` para mapear novos campos

### Fase 2: Atualizar Hook

3. **src/hooks/useDropshippingCalculator.ts**
   - Adicionar estado `marketplace_id`
   - Adicionar estado `supplier_id`
   - Adicionar setters `setMarketplace_id` e `setSupplier_id`

### Fase 3: Atualizar Componentes

4. **src/components/calculator/ProductInfo.tsx**
   - Substituir Input de supplier por Select com IDs
   - Adicionar lógica para buscar supplier_id

5. **src/components/calculator/MarketplaceConfig.tsx** (ou similar)
   - Adicionar lógica para buscar marketplace_id ao selecionar marketplace

6. **src/components/DropshippingCalculator.tsx**
   - Atualizar `handleSaveProduct()` para enviar IDs
   - Adicionar lógica de busca de IDs antes de salvar
   - Manter campos legados para compatibilidade

### Fase 4: Migração Gradual

7. **Estratégia de Transição**
   - Enviar AMBOS os campos (nome/slug + ID) ao salvar
   - Backend aceita ambos (já implementado)
   - Após 3-6 meses, remover campos legados

---

## 📊 Impacto da Implementação

### Benefícios
- ✅ Integridade referencial garantida por FKs
- ✅ Queries mais rápidas com índices em UUIDs
- ✅ Facilita relatórios e análises
- ✅ Evita inconsistências de nomes duplicados
- ✅ Suporta renomeação de marketplaces/suppliers sem quebrar dados

### Compatibilidade
- ✅ Campos legados mantidos (sem breaking changes)
- ✅ Produtos antigos continuam funcionando
- ✅ Migração gradual sem downtime

---

## 🎯 Prioridade de Implementação

### Alta Prioridade
1. ✅ Adicionar campos nos types
2. ✅ Adicionar campos no service
3. ✅ Atualizar lógica de salvamento

### Média Prioridade
4. ⚠️ Atualizar componentes para usar IDs
5. ⚠️ Adicionar lógica de busca de IDs

### Baixa Prioridade
6. 📝 Remover campos legados (após 3-6 meses)

---

## 📝 Notas Importantes

1. **Não quebrar compatibilidade**: Manter campos legados funcionando
2. **Migração gradual**: Enviar ambos os campos durante transição
3. **Validação**: Backend já valida FKs automaticamente
4. **Performance**: Índices já criados nas FKs
5. **RLS**: Policies já aplicadas nas tabelas de referência

---

## ✅ Checklist de Implementação

- [ ] Atualizar `src/types/calculator.ts`
- [ ] Atualizar `src/services/productService.ts` (ProductRow)
- [ ] Atualizar `src/services/productService.ts` (ProductPayload)
- [ ] Atualizar `src/services/productService.ts` (productSelectColumnList)
- [ ] Atualizar `src/services/productService.ts` (mapProductRow)
- [ ] Atualizar `src/hooks/useDropshippingCalculator.ts`
- [ ] Atualizar `src/components/calculator/ProductInfo.tsx`
- [ ] Atualizar `src/components/DropshippingCalculator.tsx` (handleSaveProduct)
- [ ] Testar criação de produto com IDs
- [ ] Testar edição de produto com IDs
- [ ] Testar compatibilidade com produtos antigos
- [ ] Validar queries no banco de dados

---

**Conclusão**: O frontend precisa ser atualizado para utilizar os novos campos de normalização (`marketplace_id` e `supplier_id`), mas a implementação pode ser feita de forma gradual sem quebrar a compatibilidade com dados existentes.
