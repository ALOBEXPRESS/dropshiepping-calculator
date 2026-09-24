# Como Resetar Filtro "Produtos Integrados"

## Problema
Após clicar em "Não categorizado", só aparece 1 produto na lista.

## Solução Rápida (30 segundos)

### Opção 1: Limpar LocalStorage (RECOMENDADO)

1. Abra a página "Produtos integrados" na sua aplicação
2. Pressione `F12` para abrir o DevTools
3. Vá na aba "Console"
4. Cole e execute este código:

```javascript
localStorage.clear();
location.reload();
```

5. A página vai recarregar e todos os filtros serão resetados

### Opção 2: Clicar no Botão "Não Categorizado" Novamente

1. Na página "Produtos integrados"
2. Clique no botão "Não categorizado" (deve estar rosa/vermelho)
3. Clique em "Atualizar"
4. Todos os produtos devem aparecer novamente

### Opção 3: Resetar Apenas o Filtro de Fornecedor

Se você quiser manter outros filtros (busca, preço, etc):

1. Pressione `F12` para abrir o DevTools
2. Vá na aba "Console"
3. Cole e execute:

```javascript
// Pegar o estado atual
const state = localStorage.getItem('products-bling-filters');
if (state) {
  const filters = JSON.parse(state);
  filters.supplierSku = 'all'; // Resetar para "Todos"
  localStorage.setItem('products-bling-filters', JSON.stringify(filters));
  location.reload();
}
```

## Verificar se Funcionou

Após executar qualquer uma das opções acima:

1. A página deve recarregar
2. Deve mostrar "X produtos encontrados" (onde X > 1)
3. Deve listar vários produtos na tela
4. O botão "Não categorizado" deve estar branco/cinza (não selecionado)

## O que Aconteceu?

O filtro "Não categorizado" estava configurado para mostrar apenas produtos que:
- NÃO têm `sku_fornecedor` (fornecedor)
- OU não são dos fornecedores específicos (ALOBEXPRESS_01, ALOBFOR_DROP_01)

Isso fazia com que quase todos os produtos fossem filtrados, deixando apenas 1 visível.

## Correção Permanente

O código foi corrigido em `src/hooks/useProductsBling.ts` para que o filtro "Não categorizado" mostre apenas produtos que realmente não têm fornecedor (sku_fornecedor IS NULL).

Após fazer o deploy da correção, o problema não vai mais acontecer.

## Se Ainda Não Funcionar

Se após limpar o localStorage ainda aparecer apenas 1 produto:

1. Verifique no banco de dados quantos produtos existem:

```sql
SELECT COUNT(*) as total
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

2. Verifique quantos produtos têm fornecedor:

```sql
SELECT 
  COUNT(*) FILTER (WHERE sku_fornecedor IS NULL) as sem_fornecedor,
  COUNT(*) FILTER (WHERE sku_fornecedor IS NOT NULL) as com_fornecedor,
  COUNT(*) as total
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

3. Se houver muitos produtos no banco mas poucos aparecem na aplicação, pode ser um problema de permissões RLS (Row Level Security) no Supabase.

## Contato

Se o problema persistir, forneça:
- Quantos produtos aparecem na tela
- Quantos produtos existem no banco (query acima)
- Screenshot da tela "Produtos integrados"
- Console do navegador (F12 → Console) para ver se há erros
