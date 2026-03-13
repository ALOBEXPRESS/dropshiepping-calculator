# 🗺️ Instruções Finais: Corrigir Mapa de Distribuição por Estado

## ✅ O Que Foi Feito

1. **Componente corrigido** - Agora usa `bling_orders` ao invés de view inexistente
2. **Workflow N8N corrigido** - 18 ocorrências do organization_id errado foram substituídas
3. **Scripts criados** - Para validação e testes

## ❌ Problema Atual

**O banco está vazio!** Não há pedidos para o mapa exibir.

## 🚀 O Que Você Precisa Fazer AGORA

### 1. Inserir Pedidos de Teste no Supabase

**Opção A: Via SQL Editor (Recomendado)**

1. Abrir https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/sql/new
2. Copiar TODO o conteúdo do arquivo `insert_test_orders.sql`
3. Colar no editor
4. Clicar em "Run"
5. Verificar se aparece "Success. 8 rows affected"

**Opção B: Copiar SQL Aqui**

```sql
INSERT INTO bling_orders (
  bling_order_id, organization_id, order_number, bling_store_id, order_date,
  total_products, total_amount, status_id, status_value, contact_name,
  label_state, label_city, label_zip, label_neighborhood, sync_status, last_sync_at
) VALUES
(999001, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1001, 205833031, CURRENT_DATE, 100.00, 150.00, 1, 150.00, 'Cliente SP', 'SP', 'São Paulo', '01000-000', 'Centro', 'synced', NOW()),
(999002, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1002, 205833031, CURRENT_DATE, 150.00, 200.00, 1, 200.00, 'Cliente RJ', 'RJ', 'Rio de Janeiro', '20000-000', 'Centro', 'synced', NOW()),
(999003, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1003, 205833031, CURRENT_DATE, 130.00, 180.00, 1, 180.00, 'Cliente MG', 'MG', 'Belo Horizonte', '30000-000', 'Centro', 'synced', NOW()),
(999004, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1004, 205833031, CURRENT_DATE, 170.00, 220.00, 1, 220.00, 'Cliente SP2', 'SP', 'Campinas', '13000-000', 'Centro', 'synced', NOW()),
(999005, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1005, 205833031, CURRENT_DATE, 140.00, 190.00, 1, 190.00, 'Cliente RS', 'RS', 'Porto Alegre', '90000-000', 'Centro', 'synced', NOW()),
(999006, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1006, 205833031, CURRENT_DATE, 120.00, 170.00, 1, 170.00, 'Cliente PR', 'PR', 'Curitiba', '80000-000', 'Centro', 'synced', NOW()),
(999007, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1007, 205833031, CURRENT_DATE, 110.00, 160.00, 1, 160.00, 'Cliente BA', 'BA', 'Salvador', '40000-000', 'Centro', 'synced', NOW()),
(999008, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1008, 205833031, CURRENT_DATE, 125.00, 175.00, 1, 175.00, 'Cliente SC', 'SC', 'Florianópolis', '88000-000', 'Centro', 'synced', NOW());
```

### 2. Validar no Navegador

1. Abrir http://localhost:5173/sales
2. Rolar até "Distribuição por Estado"
3. **Você DEVE ver:**
   - ✅ Mapa do Brasil
   - ✅ Estados coloridos (SP, RJ, MG, RS, PR, BA, SC)
   - ✅ Lista com percentuais
   - ✅ Ao clicar em um estado, mostra detalhes

### 3. Testar com Playwright (Opcional)

```bash
python test_dashboard_map.py
```

### 4. Build, Lint, Check, Commit

```bash
# Build
npm run build

# Lint (corrigir erros se houver)
npm run lint --fix

# Type check
npm run type-check

# Commit
git add .
git commit -m "fix: corrigir mapa de distribuição por estado

- Corrigir query do BrazilStatesDistribution para usar bling_orders
- Corrigir organization_id no workflow N8N (18 ocorrências)
- Adicionar pedidos de teste para validação"

git push
```

## 🎯 Resultado Esperado

Após seguir os passos acima, o mapa deve:

1. **Aparecer** na página de vendas
2. **Mostrar** o mapa do Brasil
3. **Colorir** os estados com pedidos
4. **Listar** os top 10 estados com percentuais
5. **Permitir** clicar em um estado para ver detalhes

## ❓ Se Ainda Não Funcionar

1. **Verificar se os pedidos foram inseridos:**
   ```bash
   python check_orders_simple.py
   ```
   Deve mostrar: "Total de registros em bling_orders: 8"

2. **Verificar console do navegador (F12):**
   - Não deve haver erros
   - Verificar Network tab para ver se a query retorna dados

3. **Verificar organization_id:**
   - Deve ser: `28b4b443-03fd-4a2d-b596-9dcaf142b389`
   - Verificar em Settings do app

## 📝 Notas

- Os pedidos de teste têm IDs 999001-999008
- Podem ser deletados depois se quiser
- O workflow N8N está corrigido para novos pedidos
- Reimporte o workflow no N8N para aplicar as correções

## 🆘 Precisa de Ajuda?

Leia os documentos criados:
- `docs/correcoes/RESUMO_CORRECOES_MAPA_ESTADOS.md` - Resumo completo
- `docs/correcoes/PROBLEMA_MAPA_NAO_CARREGA.md` - Diagnóstico detalhado
- `docs/correcoes/CORRECAO_ORGANIZATION_ID_N8N_WORKFLOW.md` - Correção do workflow
