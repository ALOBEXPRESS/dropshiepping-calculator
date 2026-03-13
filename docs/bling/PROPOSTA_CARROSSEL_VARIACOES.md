# Proposta: Carrossel de Variações no Card de Produto

## Objetivo

Modificar o card de produto para mostrar um único card por produto PAI, com um carrossel interno que permite navegar entre as variações usando setas.

## Comportamento Atual

- ❌ Cada variação aparece como um card separado
- ❌ Produtos duplicados visualmente
- ❌ Difícil de gerenciar produtos com muitas variações

## Comportamento Proposto

- ✅ Um único card por produto PAI
- ✅ Setas laterais para navegar entre variações
- ✅ Informações dinâmicas que mudam conforme a variação selecionada:
  - Nome da variação (ex: "Cor: Amarelo")
  - Preço de venda
  - Preço de custo
  - Estoque
  - SKU
  - Imagem da variação

## Estrutura de Dados

### Produto PAI (products_bling)
```typescript
{
  id: "uuid",
  bling_id: 16613337870,
  name: "Copo térmico 260ml com tampa",
  sku: "YEIZ_COPO-TÉRMICO-260ML-C",
  sale_price: 39.90,
  cost_price: 18.50,
  stock_quantity: 100,
  image_url1: "https://..."
}
```

### Variações (products_variations_bling)
```typescript
[
  {
    id: "uuid",
    product_id: "uuid-do-pai",
    product_bling_id: 16613337870,
    bling_id: 16613337899,
    name: "Copo térmico 260ml com tampa Cor: Amarelo",
    variacao_nome: "Cor:Amarelo",
    sku: "YEIZ_COPO-TÉRMICO-260ML-C_001",
    sale_price: 39.90,
    cost_price: 18.50,
    stock_quantity: 15,
    image_url1: "https://..."
  },
  {
    id: "uuid",
    product_id: "uuid-do-pai",
    product_bling_id: 16613337870,
    bling_id: 16613337902,
    name: "Copo térmico 260ml com tampa Cor: Azul",
    variacao_nome: "Cor:Azul",
    sku: "YEIZ_COPO-TÉRMICO-260ML-C_002",
    sale_price: 39.90,
    cost_price: 18.50,
    stock_quantity: 20,
    image_url1: "https://..."
  }
  // ... mais variações
]
```

## Implementação

### 1. Modificar Hook `useProductsBling`

Adicionar busca de variações para cada produto:

```typescript
// Após buscar produtos PAI
const productsWithVariations = await Promise.all(
  products.map(async (product) => {
    const { data: variations } = await supabase
      .from('products_variations_bling')
      .select('*')
      .eq('product_id', product.id)
      .order('variacao_nome');
    
    return {
      ...product,
      variations: variations || []
    };
  })
);
```

### 2. Criar Componente `ProductCardWithVariations`

```typescript
interface ProductCardWithVariationsProps {
  product: BlingProductItem;
  variations: ProductVariation[];
}

const ProductCardWithVariations = ({ product, variations }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Se não tem variações, mostra dados do produto PAI
  const currentItem = variations.length > 0 
    ? variations[currentIndex] 
    : product;
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? variations.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev === variations.length - 1 ? 0 : prev + 1
    );
  };
  
  return (
    <div className="product-card">
      {/* Imagem com setas de navegação */}
      <div className="relative">
        <img src={currentItem.image_url1} alt={currentItem.name} />
        
        {variations.length > 0 && (
          <>
            <button 
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              ←
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              →
            </button>
            
            {/* Indicador de variação */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              {currentIndex + 1} / {variations.length}
            </div>
          </>
        )}
      </div>
      
      {/* Nome do produto PAI */}
      <h3>{product.name}</h3>
      
      {/* Nome da variação (se houver) */}
      {variations.length > 0 && (
        <p className="text-sm text-gray-500">
          {currentItem.variacao_nome}
        </p>
      )}
      
      {/* Informações dinâmicas */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span>Preço</span>
          <span>R$ {currentItem.sale_price}</span>
        </div>
        <div>
          <span>Custo</span>
          <span>R$ {currentItem.cost_price}</span>
        </div>
        <div>
          <span>Estoque</span>
          <span>{currentItem.stock_quantity}</span>
        </div>
        <div>
          <span>SKU</span>
          <span>{currentItem.sku}</span>
        </div>
      </div>
    </div>
  );
};
```

### 3. Modificar Página de Produtos

Substituir o card atual pelo novo componente:

```typescript
// Antes
{products.map((product) => (
  <ProductCard key={product.id} product={product} />
))}

// Depois
{products.map((product) => (
  <ProductCardWithVariations 
    key={product.id} 
    product={product}
    variations={product.variations || []}
  />
))}
```

## Benefícios

1. ✅ Interface mais limpa e organizada
2. ✅ Fácil navegação entre variações
3. ✅ Informações específicas de cada variação visíveis
4. ✅ Reduz poluição visual
5. ✅ Melhor UX para produtos com muitas variações

## Alternativas

### Opção 1: Dropdown de Variações
Ao invés de setas, usar um dropdown para selecionar a variação.

### Opção 2: Tabs de Variações
Mostrar tabs na parte superior do card com as variações.

### Opção 3: Modal de Variações
Clicar no card abre um modal com todas as variações.

## Próximos Passos

1. ✅ Limpar dados incorretos do banco (CONCLUÍDO)
2. ⏳ Implementar busca de variações no hook
3. ⏳ Criar componente de card com carrossel
4. ⏳ Testar com produtos que têm variações
5. ⏳ Ajustar estilos e animações

## Arquivos a Modificar

- `src/hooks/useProductsBling.ts` - Adicionar busca de variações
- `src/components/ProductCardWithVariations.tsx` - Novo componente
- `src/pages/Produtos.tsx` - Usar novo componente
- `src/types/product.ts` - Adicionar tipo ProductVariation
