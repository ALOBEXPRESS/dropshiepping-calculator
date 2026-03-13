# Contagem de Vendas nos Cards de Produtos

## Objetivo
Exibir a contagem de vendas de cada produto nos cards, tanto na seção "Produtos Integrados" quanto na seção "Produtos Cadastrados", mostrando quantas vezes cada produto foi vendido através dos pedidos do Bling.

## Implementação

### 1. Produtos Integrados (Bling)

#### Atualização do Tipo `BlingProductItem`
Adicionado o campo `salesCount` ao tipo:

```typescript
export type BlingProductItem = {
  // ... outros campos
  salesCount: number;
};
```

#### Busca da Contagem de Vendas
No hook `useProductsBling.ts`, após buscar os produtos, fazemos uma query adicional para contar as vendas:

```typescript
// Buscar contagem de vendas para cada produto
const productIds = (data ?? []).map((row) => row.id);
const salesCountMap = new Map<string, number>();

if (productIds.length > 0) {
  const { data: salesData } = await supabase
    .from('bling_order_items')
    .select('product_bling_id')
    .in('product_bling_id', productIds);

  if (salesData) {
    salesData.forEach((item) => {
      if (item.product_bling_id) {
        const currentCount = salesCountMap.get(item.product_bling_id) || 0;
        salesCountMap.set(item.product_bling_id, currentCount + 1);
      }
    });
  }
}
```

#### Mapeamento dos Dados
Ao mapear os produtos, incluímos a contagem de vendas:

```typescript
const mapped: BlingProductItem[] = (data ?? []).map((row) => ({
  // ... outros campos
  salesCount: salesCountMap.get(String(row.id)) || 0
}));
```

#### Exibição no Card
No componente `ProductCard.tsx` (products-loaded), atualizamos o campo de vendas para exibir o valor real:

```tsx
<div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2">
  <p className="text-[10px] uppercase text-gray-500">Vendas</p>
  <p className="truncate text-xs font-semibold text-emerald-600" title={String(currentProduct.salesCount)}>
    {currentProduct.salesCount}
  </p>
</div>
```

### 2. Produtos Cadastrados (Calculadora)

#### Campo Existente no Tipo `ProductItem`
O tipo `ProductItem` já possui o campo `shopeeSalesQuantity` que será reutilizado para armazenar a contagem de vendas:

```typescript
export interface ProductItem {
  // ... outros campos
  shopeeSalesQuantity?: string | number;
}
```

#### Busca da Contagem de Vendas
No `ProductService.getAll()`, após buscar os produtos, fazemos uma query adicional para contar as vendas:

```typescript
// Buscar contagem de vendas para cada produto
const productIds = withMeliPlus.map(p => p.id);
const salesCountMap = new Map<string, number>();

if (productIds.length > 0) {
  const { data: salesData } = await supabase
    .from('bling_order_items')
    .select('product_id')
    .in('product_id', productIds);
  
  if (salesData) {
    salesData.forEach((item: { product_id: string }) => {
      if (item.product_id) {
        const currentCount = salesCountMap.get(item.product_id) || 0;
        salesCountMap.set(item.product_id, currentCount + 1);
      }
    });
  }
}

// Adicionar contagem de vendas aos produtos
return withMeliPlus.map(product => ({
  ...product,
  shopeeSalesQuantity: salesCountMap.get(product.id) || 0
}));
```

#### Exibição no Card
No componente `ProductCard.tsx` (calculator), o campo já está configurado para exibir a contagem:

```tsx
<p className="text-[10px] text-muted-foreground font-semibold leading-none">
  Vendas: {product.shopeeSalesQuantity ?? 0}
</p>
```

## Como Funciona

1. Quando a página carrega, os serviços buscam todos os produtos das respectivas tabelas (`products_bling` ou `products`)
2. Para cada produto encontrado, fazemos uma query na tabela `bling_order_items` para contar quantas vezes o `product_bling_id` ou `product_id` aparece
3. Criamos um mapa (`salesCountMap`) que associa cada produto com sua contagem de vendas
4. Ao mapear os produtos, incluímos a contagem de vendas
5. Os cards exibem a contagem, destacando o número de vendas

## Relacionamento entre Tabelas

### Produtos Integrados (Bling)
```
products_bling (id) ← bling_order_items (product_bling_id)
```

### Produtos Cadastrados
```
products (id) ← bling_order_items (product_id)
```

- Cada item em `bling_order_items` representa um produto vendido em um pedido
- Os campos `product_bling_id` e `product_id` referenciam os produtos nas respectivas tabelas
- Contamos quantas vezes cada ID aparece para obter o total de vendas

## Atualização em Tempo Real

A contagem é atualizada sempre que:
1. O usuário clica no botão "Atualizar" (Produtos Integrados)
2. Os produtos são recarregados após criar/editar/deletar (Produtos Cadastrados)
3. A página é recarregada

Quando um novo pedido é criado no Bling e sincronizado via webhook:
1. O workflow n8n insere os itens na tabela `bling_order_items`
2. O usuário pode atualizar a lista para ver a nova contagem
3. A contagem será automaticamente atualizada na próxima vez que os produtos forem carregados

## Benefícios

- Visibilidade imediata de quais produtos estão vendendo mais
- Ajuda na tomada de decisão sobre quais produtos promover
- Facilita a identificação de produtos populares vs. produtos parados
- Unificação da métrica de vendas em ambas as seções (Integrados e Cadastrados)

## Arquivos Modificados

- `src/hooks/useProductsBling.ts` - Adicionado busca de contagem de vendas para produtos Bling
- `src/components/products-loaded/ProductCard.tsx` - Atualizado para exibir contagem real (Produtos Integrados)
- `src/services/productService.ts` - Adicionado busca de contagem de vendas para produtos cadastrados
- `src/components/calculator/ProductCard.tsx` - Já exibe o campo `shopeeSalesQuantity` (Produtos Cadastrados)
- `docs/CONTAGEM_VENDAS_PRODUTOS.md` - Documentação da feature

## Data
2025-02-22
