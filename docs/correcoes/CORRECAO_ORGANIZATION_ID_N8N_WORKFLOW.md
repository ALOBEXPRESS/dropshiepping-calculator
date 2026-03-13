# Correção: Organization ID no Workflow N8N

## Problema Identificado

O workflow N8N "Bling Pedido de Venda Automatization" estava usando o `organization_id` ERRADO em 18 lugares diferentes, causando:

- Pedidos importados com organization_id incorreto
- Dashboard não mostra dados (queries retornam vazio)
- Mapa de distribuição por estado não carrega

## Organization IDs

- **ERRADO** (usado no workflow): `e3274f4d-2627-4121-895d-b0e3a70b0ace`
- **CORRETO** (usado no frontend): `28b4b443-03fd-4a2d-b596-9dcaf142b389`

## Correção Aplicada

Criado script Python para substituir todas as ocorrências:

```bash
python fix_organization_id.py
```

### Resultado
```
✅ Arquivo corrigido! 18 substituições realizadas
```

## Locais Corrigidos no Workflow

1. **Inserir Pedido** - Campo `organization_id`
2. **Registrar Log de Sucesso** - Campo `organization_id`
3. **Registrar Log de Erro** (múltiplos nós) - Campo `organization_id`
4. **Mapear Canal de Venda** - Código JavaScript
5. **Criar Lead** - Campo `organization_id`
6. **Processar Dados do Lead** - Código JavaScript
7. **Atualizar Estatísticas do Lead** - Código JavaScript

## Próximos Passos

### 1. Migrar Dados Existentes

Os pedidos já importados com o organization_id errado precisam ser migrados:

```sql
-- Verificar quantos pedidos estão com ID errado
SELECT COUNT(*) 
FROM bling_orders 
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar bling_orders
UPDATE bling_orders
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar bling_order_items (se necessário)
UPDATE bling_order_items
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar orders processados
UPDATE orders
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar leads
UPDATE leads
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar sales_channels
UPDATE sales_channels
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';
```

### 2. Reimportar Workflow no N8N

1. Abrir N8N
2. Ir no workflow "Bling Pedido de Venda Automatization"
3. Importar o arquivo corrigido: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
4. Ativar o workflow

### 3. Testar Importação

1. Criar um pedido de teste no Bling
2. Verificar se o webhook é disparado
3. Confirmar que o pedido é inserido com organization_id correto
4. Verificar se o dashboard mostra os dados

## Validação

Após aplicar as correções, validar:

```sql
-- Verificar se novos pedidos têm organization_id correto
SELECT 
  bling_order_id,
  organization_id,
  order_number,
  created_at
FROM bling_orders
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se o mapa tem dados
SELECT 
  label_state,
  COUNT(*) as total_pedidos
FROM bling_orders
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND label_state IS NOT NULL
GROUP BY label_state
ORDER BY total_pedidos DESC;
```

## Teste Playwright

Executar teste automatizado:

```bash
python test_dashboard_map.py
```

Deve mostrar:
- ✅ Título 'Distribuição por Estado' encontrado
- ✅ Elementos SVG do mapa encontrados
- ✅ Dados de estados carregados

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json` - Workflow corrigido
- `fix_organization_id.py` - Script de correção
- `test_dashboard_map.py` - Teste automatizado

## Impacto

Após a correção:
- ✅ Novos pedidos serão importados com organization_id correto
- ✅ Dashboard mostrará dados corretamente
- ✅ Mapa de distribuição por estado funcionará
- ⚠️ Dados antigos precisam ser migrados manualmente (SQL acima)

## Referências

- `docs/correcoes/INSTRUCOES_CORRIGIR_ORGANIZATION_ID.md` - Instruções originais
- `docs/correcoes/CORRECAO_MAPA_ESTADOS_ORGANIZATION_ID.md` - Correção do componente frontend
