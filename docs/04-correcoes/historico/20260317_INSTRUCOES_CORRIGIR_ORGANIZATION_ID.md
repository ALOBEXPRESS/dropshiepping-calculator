# Instruções: Corrigir Organization ID na Importação do Bling

## Problema

Dados importados do Bling estão sendo associados ao `organization_id` errado, causando:
- Dashboard não mostra dados
- Queries retornam vazias
- Usuários não veem seus próprios pedidos

## Onde Procurar

### 1. Webhooks do Bling

Procure por endpoints que recebem dados do Bling:

```bash
# Procurar por rotas de webhook
grep -r "webhook" --include="*.ts" --include="*.js"
grep -r "/bling" --include="*.ts" --include="*.js"
grep -r "bling.*webhook" --include="*.ts" --include="*.js"
```

**Locais comuns:**
- `src/api/webhooks/bling.ts`
- `src/routes/webhooks.ts`
- `backend/webhooks/bling.js`

### 2. Funções Supabase

Procure por funções que inserem dados do Bling:

```sql
-- Listar funções relacionadas ao Bling
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%bling%'
AND routine_type = 'FUNCTION';
```

**Funções suspeitas:**
- `import_bling_order`
- `sync_bling_data`
- `process_bling_webhook`

### 3. N8N Workflows

Se usar N8N, procure por workflows que:
- Importam pedidos do Bling
- Sincronizam produtos
- Processam webhooks

**Verificar:**
- Nodes que inserem em `bling_orders`
- Nodes que inserem em `products`
- Nodes que inserem em `customers`

## Como Corrigir

### Opção 1: Webhook com Token

Se o webhook recebe um token de autenticação:

```typescript
// Exemplo de webhook handler
app.post('/api/webhooks/bling', async (req, res) => {
  const token = req.headers['authorization'];
  
  // Buscar organization_id baseado no token
  const { data: org } = await supabase
    .from('bling_integrations')
    .select('organization_id')
    .eq('api_token', token)
    .single();
  
  if (!org) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Usar org.organization_id ao inserir dados
  const { data: order } = await supabase
    .from('bling_orders')
    .insert({
      ...req.body,
      organization_id: org.organization_id // ✅ Correto
    });
});
```

### Opção 2: Webhook com Query Parameter

Se o webhook recebe `organization_id` como parâmetro:

```typescript
app.post('/api/webhooks/bling/:organizationId', async (req, res) => {
  const organizationId = req.params.organizationId;
  
  // Validar se organization existe
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single();
  
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  // Usar organizationId ao inserir dados
  const { data: order } = await supabase
    .from('bling_orders')
    .insert({
      ...req.body,
      organization_id: organizationId // ✅ Correto
    });
});
```

### Opção 3: Função Supabase

Se usar função Supabase para importar:

```sql
CREATE OR REPLACE FUNCTION import_bling_order(
  p_organization_id UUID,
  p_order_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Validar organization
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  
  -- Inserir pedido com organization_id correto
  INSERT INTO bling_orders (
    organization_id,
    order_number,
    total_amount,
    -- outros campos...
  )
  VALUES (
    p_organization_id, -- ✅ Correto
    (p_order_data->>'order_number')::INTEGER,
    (p_order_data->>'total_amount')::DECIMAL,
    -- outros valores...
  )
  RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$;
```

### Opção 4: N8N Workflow

Se usar N8N, adicione node para buscar `organization_id`:

```json
{
  "nodes": [
    {
      "name": "Get Organization ID",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "getAll",
        "table": "bling_integrations",
        "filters": {
          "conditions": [
            {
              "field": "api_token",
              "operator": "equals",
              "value": "={{ $json.token }}"
            }
          ]
        }
      }
    },
    {
      "name": "Insert Order",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "bling_orders",
        "data": {
          "organization_id": "={{ $node['Get Organization ID'].json.organization_id }}",
          "order_number": "={{ $json.order_number }}",
          "total_amount": "={{ $json.total_amount }}"
        }
      }
    }
  ]
}
```

## Migração de Dados Existentes

Após corrigir a importação, migre dados existentes:

```sql
-- 1. Identificar organization_id correto
-- Assumindo que há uma tabela bling_integrations que mapeia tokens para organizations

-- 2. Atualizar bling_orders
UPDATE bling_orders bo
SET organization_id = bi.organization_id
FROM bling_integrations bi
WHERE bo.organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace' -- ID errado
AND bi.id = (SELECT id FROM bling_integrations LIMIT 1); -- Ajustar conforme necessário

-- 3. Atualizar orders
UPDATE orders o
SET organization_id = bo.organization_id
FROM bling_orders bo
WHERE o.bling_order_id = bo.id
AND o.organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- 4. Atualizar products
-- Mais complexo, pois produtos podem pertencer a múltiplas organizations
-- Requer análise caso a caso

-- 5. Atualizar customers
-- Similar aos products, requer análise
```

## Validação

Após corrigir, valide:

```sql
-- 1. Verificar se novos pedidos têm organization_id correto
SELECT 
  order_number,
  organization_id,
  created_at
FROM bling_orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar se orders herdam organization_id correto
SELECT 
  o.order_number,
  o.organization_id as order_org_id,
  bo.organization_id as bling_org_id
FROM orders o
JOIN bling_orders bo ON bo.id = o.bling_order_id
WHERE o.organization_id != bo.organization_id;

-- 3. Verificar se dashboard mostra dados
-- Fazer login e verificar se pedidos aparecem
```

## Testes

Criar teste automatizado:

```typescript
describe('Bling Import', () => {
  it('should import order with correct organization_id', async () => {
    const organizationId = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
    
    // Simular webhook
    const response = await request(app)
      .post(`/api/webhooks/bling/${organizationId}`)
      .send({
        order_number: 123,
        total_amount: 100.00,
        // outros dados...
      });
    
    expect(response.status).toBe(200);
    
    // Verificar se pedido foi inserido com organization_id correto
    const { data: order } = await supabase
      .from('bling_orders')
      .select('organization_id')
      .eq('order_number', 123)
      .single();
    
    expect(order.organization_id).toBe(organizationId);
  });
});
```

## Checklist

- [ ] Identificar onde dados do Bling são importados
- [ ] Corrigir código para usar `organization_id` correto
- [ ] Testar importação com pedido de teste
- [ ] Migrar dados existentes
- [ ] Validar que dashboard mostra dados
- [ ] Criar testes automatizados
- [ ] Documentar mudanças
- [ ] Deploy para produção

## Suporte

Se precisar de ajuda:
1. Verificar logs de importação
2. Verificar tabela `bling_integrations`
3. Verificar se há múltiplas organizations usando o mesmo token
4. Consultar documentação do Bling sobre webhooks

---

**Importante**: Após corrigir, todos os novos pedidos devem ser importados com o `organization_id` correto automaticamente!
