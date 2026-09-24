# Integração do Accordion de Afiliados no Relatório de Receitas

**Data**: 2026-04-25  
**Status**: ✅ Implementado

## Objetivo

Permitir que o usuário associe pedidos a influenciadores/afiliados diretamente no dialog de detalhes do relatório de receitas, facilitando o rastreamento de comissões e amostras grátis.

## Implementação

### 1. Componente AffiliateAccordion

**Arquivo**: `src/components/sales/AffiliateAccordion.tsx`

Componente accordion que permite:
- Selecionar um influenciador existente da lista
- Criar um novo influenciador inline sem sair do dialog
- Associar/desassociar o pedido ao influenciador selecionado
- Salvar novos influenciadores na tabela `influencers`
- Vincular influenciadores ao marketplace na tabela `influencer_marketplaces`

**Props**:
```typescript
interface AffiliateAccordionProps {
  orderId: string;                    // ID do pedido
  marketplaceId: string;              // ID do marketplace
  organizationId: string;             // ID da organização
  currentAffiliateId?: string | null; // ID do afiliado atual (se houver)
  onAffiliateChange?: (affiliateId: string | null) => void; // Callback quando muda
}
```

**Funcionalidades**:
- ✅ Accordion expansível/retrátil
- ✅ Carregamento lazy dos influenciadores (só carrega quando abre)
- ✅ Seletor dropdown com todos os influenciadores da organização
- ✅ Formulário inline para criar novo influenciador
- ✅ Validação de campos obrigatórios (nome e comissão)
- ✅ Campos de redes sociais (Instagram, TikTok, X/Twitter)
- ✅ Salvamento automático na tabela `influencers`
- ✅ Vinculação automática ao marketplace
- ✅ Feedback visual com toasts
- ✅ Estilo dark theme consistente com o dialog

### 2. Integração no RevenueReportChart

**Arquivo**: `src/components/sales/RevenueReportChart.tsx`

**Mudanças**:
1. Importação do componente `AffiliateAccordion`
2. Adição do campo `affiliate_id` na interface `OrderDetail`
3. Renderização do accordion no dialog de detalhes, após o accordion de "Custo Marketplace" e antes da seção "Lucro Real"

**Posicionamento**:
```
Dialog de Detalhes do Pedido
├── Header (Pedido #, Cliente, Marketplace)
├── Preço de venda (accordion)
├── Custo do Produto (accordion)
├── Custo Marketplace (accordion)
├── 🆕 AFILIADOS (accordion) ← NOVO
└── Lucro Real (seção final)
```

**Código de integração**:
```tsx
{/* Accordion de Afiliados */}
{selectedOrder?.order_id && selectedOrder?.marketplace && (
  <AffiliateAccordion
    orderId={selectedOrder.order_id}
    marketplaceId={resolvedMarketplaceConfig?.id || ''}
    organizationId={organizationId}
    currentAffiliateId={selectedOrder.affiliate_id}
    onAffiliateChange={(affiliateId) => {
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          affiliate_id: affiliateId,
        });
      }
    }}
  />
)}
```

### 3. Migração do Banco de Dados

**Arquivo**: `docs/migrations/add_affiliate_id_to_orders.sql`

**Mudanças no schema**:
```sql
-- Adiciona coluna affiliate_id na tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES influencers(id) ON DELETE SET NULL;

-- Cria índice para performance
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
```

**Migração de dados existentes**:
- Atualiza pedidos de amostras grátis existentes para vincular com seus influenciadores da tabela `influencer_free_samples`

## Como Usar

### Para o Usuário Final

1. **Abrir detalhes do pedido**:
   - Clicar em qualquer barra do gráfico de receitas
   - Dialog de detalhes será exibido

2. **Associar a um influenciador existente**:
   - Expandir o accordion "AFILIADOS"
   - Selecionar o influenciador no dropdown
   - Associação é salva automaticamente

3. **Criar novo influenciador**:
   - Expandir o accordion "AFILIADOS"
   - Clicar em "Novo"
   - Preencher os campos:
     - Nome (obrigatório)
     - Instagram, TikTok, X/Twitter (opcionais)
     - Comissão % (obrigatório)
   - Clicar em "Salvar e Associar"
   - Novo influenciador é criado e automaticamente associado ao pedido

4. **Remover associação**:
   - Selecionar "Sem influenciador" no dropdown

### Para Desenvolvedores

**Executar a migração**:
```bash
# No Supabase SQL Editor ou via CLI
psql -h <host> -U <user> -d <database> -f docs/migrations/add_affiliate_id_to_orders.sql
```

**Verificar a coluna**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'affiliate_id';
```

## Estrutura de Dados

### Tabela `orders`
```sql
orders
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── order_number (TEXT)
├── ...
└── affiliate_id (UUID, FK → influencers.id) ← NOVO
```

### Tabela `influencers`
```sql
influencers
├── id (UUID, PK)
├── organization_id (UUID, FK)
├── name (TEXT)
├── instagram (TEXT, nullable)
├── tiktok (TEXT, nullable)
├── twitter (TEXT, nullable)
├── percentage (NUMERIC)
└── is_active (BOOLEAN)
```

### Tabela `influencer_marketplaces`
```sql
influencer_marketplaces
├── influencer_id (UUID, FK → influencers.id)
└── marketplace_id (UUID, FK → marketplaces.id)
```

## Fluxo de Dados

```
1. Usuário abre dialog de detalhes
   ↓
2. AffiliateAccordion carrega influenciadores da organização
   ↓
3. Usuário seleciona ou cria influenciador
   ↓
4. Componente atualiza orders.affiliate_id
   ↓
5. Callback onAffiliateChange atualiza estado local
   ↓
6. UI reflete a mudança (nome do afiliado no header do accordion)
```

## Tratamento de Erros

### Coluna não existe
Se a migração não foi executada, o componente detecta o erro e exibe:
```
❌ Coluna affiliate_id não existe na tabela orders
Execute a migração do banco de dados para adicionar esta coluna.
```

### Validação de formulário
- Nome vazio: "O nome é obrigatório."
- Comissão inválida: "A comissão deve ser um número entre 0 e 100."

### Erros de rede
- Falha ao carregar influenciadores: "Erro ao carregar influenciadores"
- Falha ao criar: "Erro ao criar influenciador"
- Falha ao associar: "Erro ao associar afiliado"

## Referências

**Componentes relacionados**:
- `src/components/ConfirmFreeSampleDialog.tsx` - Referência de design e estrutura
- `src/components/FreeSampleLane.tsx` - Fluxo de amostras grátis
- `src/hooks/useFreeSampleLane.ts` - Lógica de processamento de amostras

**Tabelas do banco**:
- `orders` - Pedidos processados
- `influencers` - Influenciadores/afiliados
- `influencer_marketplaces` - Vínculo influenciador-marketplace
- `influencer_free_samples` - Histórico de amostras grátis

## Próximos Passos

- [ ] Executar migração no banco de dados de produção
- [ ] Testar a funcionalidade completa:
  - [ ] Abrir dialog de detalhes
  - [ ] Expandir accordion de afiliados
  - [ ] Selecionar afiliado existente
  - [ ] Criar novo afiliado
  - [ ] Verificar salvamento no banco
- [ ] Adicionar filtro por afiliado no relatório de receitas (opcional)
- [ ] Adicionar relatório de comissões por afiliado (opcional)

## Notas Técnicas

- O accordion só é renderizado se `selectedOrder.order_id` e `selectedOrder.marketplace` existirem
- A lista de influenciadores é carregada apenas quando o accordion é expandido (lazy loading)
- Novos influenciadores são automaticamente vinculados ao marketplace do pedido
- A associação é feita via UPDATE na tabela `orders`, não cria registros duplicados
- O componente é totalmente controlado e notifica mudanças via callback
- Estilo dark theme com cores violet/purple para consistência visual
