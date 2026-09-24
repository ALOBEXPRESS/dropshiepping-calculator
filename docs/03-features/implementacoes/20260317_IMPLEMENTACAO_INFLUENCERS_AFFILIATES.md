# Implementação de Influencers e Affiliates

## Resumo
Implementação completa do sistema de marketing de influenciadores e afiliados, permitindo que os usuários adicionem e gerenciem informações de influenciadores e afiliados para cada produto.

## Alterações Realizadas

### 1. Banco de Dados
**Arquivo**: `supabase/migrations/20260223_add_influencers_affiliates_to_products.sql`

- Adicionadas colunas JSONB `influencers` e `affiliates` na tabela `products`
- Valores padrão: arrays vazios `[]`
- Comentários adicionados para documentação

### 2. Tipos TypeScript
**Arquivo**: `src/types/calculator.ts`

- Tipos `Influencer` e `Affiliate` já existiam
- Adicionados campos `influencers` e `affiliates` ao tipo `ProductItem`

### 3. Serviço de Produtos
**Arquivo**: `src/services/productService.ts`

Atualizações em múltiplos locais:
- `ProductRow`: Adicionados campos `influencers` e `affiliates`
- `ProductPayload`: Adicionados campos `influencers` e `affiliates`
- `productSelectColumnList`: Adicionadas colunas 'influencers' e 'affiliates'
- `mapProductRow()`: Mapeamento de `influencers` e `affiliates` do banco para o modelo
- `create()`: Inclusão de `influencers` e `affiliates` no payload de criação
- `update()`: Inclusão de `influencers` e `affiliates` no payload de atualização

### 4. Hook do Calculador
**Arquivo**: `src/hooks/useDropshippingCalculator.ts`

- Estados `influencers` e `affiliates` já existiam
- Persistência no localStorage via `ProductDraft`
- Exportação dos estados e setters

### 5. Componente Principal (Calculadora)
**Arquivo**: `src/components/DropshippingCalculator.tsx`

- Adicionados `influencers` e `affiliates` ao payload de salvamento em `handleSaveProduct()`
- Dados fluem de `TrafficConfig` → `Calculator` → `Database`

### 6. Configuração de Tráfego
**Arquivo**: `src/components/calculator/TrafficConfig.tsx`

- UI completa para adicionar/remover influenciadores já existia
- UI completa para adicionar/remover afiliados já existia
- Campos: nome, redes sociais (Instagram, TikTok, X), porcentagem de comissão
- Validação de entrada com formatação de moeda para porcentagens

### 7. Diálogo de Edição de Produto
**Arquivo**: `src/components/calculator/EditProductDialog.tsx`

Atualizações:
- `EditProductFormData`: Adicionados campos `influencers` e `affiliates`
- `buildFormData()`: Inicialização dos arrays de influenciadores e afiliados
- Payload de salvamento: Inclusão de `influencers` e `affiliates`
- **Nova seção de exibição**: Adicionada visualização de influenciadores e afiliados na aba "Tráfego Orgânico"
  - Mostra nome, redes sociais e porcentagem de comissão dos influenciadores
  - Mostra nome e porcentagem de comissão dos afiliados
  - Exibição condicional (só aparece se houver dados)

## Fluxo de Dados

```
TrafficConfig (UI)
    ↓
useDropshippingCalculator (State Management)
    ↓
DropshippingCalculator (Save Handler)
    ↓
ProductService (Database Layer)
    ↓
Supabase (Database)
    ↓
ProductService (Load Handler)
    ↓
EditProductDialog (Display)
```

## Funcionalidades Implementadas

### Adicionar Influenciador
1. Usuário clica em "Adicionar novo Influencer" em Tráfego Orgânico
2. Preenche: Nome, Instagram, TikTok, X (Twitter), Porcentagem
3. Dados são salvos no estado local
4. Ao salvar produto, dados vão para o banco

### Adicionar Afiliado
1. Usuário clica em "Adicionar novo Afiliado" em Tráfego Orgânico
2. Preenche: Nome, Porcentagem de comissão Alob
3. Dados são salvos no estado local
4. Ao salvar produto, dados vão para o banco

### Visualizar no Diálogo de Edição
1. Usuário abre produto existente para editar
2. Navega até a aba "Tráfego Orgânico" (step 3)
3. Vê seções separadas para:
   - Marketing de Influencer (se houver)
   - Marketing de Afiliado (se houver)
4. Cada card mostra todas as informações relevantes

## Estrutura de Dados

### Influencer
```typescript
{
  id: string;           // UUID gerado automaticamente
  name: string;         // Nome do influenciador
  instagram?: string;   // Conta do Instagram (@usuario ou link)
  tiktok?: string;      // Conta do TikTok (@usuario ou link)
  twitter?: string;     // Conta do X/Twitter (@usuario ou link)
  percentage: string;   // Porcentagem de comissão (formato: "10,50")
}
```

### Affiliate
```typescript
{
  id: string;           // UUID gerado automaticamente
  name: string;         // Nome do afiliado
  percentage: string;   // Porcentagem de comissão Alob (formato: "5,00")
}
```

## Validações

- IDs são gerados automaticamente usando `crypto.randomUUID()`
- Porcentagens são formatadas com vírgula decimal (padrão brasileiro)
- Arrays vazios são o padrão quando não há dados
- Campos opcionais (redes sociais) podem ser deixados em branco

## Próximos Passos Sugeridos

1. **Cálculos de Comissão**: Integrar as porcentagens de influenciadores e afiliados nos cálculos de lucro
2. **Relatórios**: Criar relatórios de desempenho por influenciador/afiliado
3. **Validações Avançadas**: Adicionar validação de formato de links de redes sociais
4. **Edição Inline**: Permitir editar influenciadores/afiliados diretamente no diálogo de edição
5. **Histórico**: Rastrear mudanças em comissões ao longo do tempo

## Notas Técnicas

- A migração do banco de dados precisa ser aplicada manualmente pelo usuário
- Os dados são armazenados como JSONB no PostgreSQL para flexibilidade
- O localStorage persiste os dados durante a edição antes de salvar
- A UI é responsiva e funciona em mobile e desktop
- Suporta tema claro e escuro
