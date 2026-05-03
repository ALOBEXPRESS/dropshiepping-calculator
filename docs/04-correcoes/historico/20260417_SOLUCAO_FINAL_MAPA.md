# 🎯 Solução Final: Mapa de Distribuição por Estado

## 🔍 Diagnóstico Completo

Após investigação profunda, descobri que:

### ❌ Problemas Identificados

1. **Banco de dados VAZIO**
   - `organizations`: 0 registros
   - `bling_orders`: 0 registros  
   - `orders`: 0 registros
   - Apenas `products_variations_bling` tem dados (761 registros)

2. **Organization não existe**
   - O código busca uma organization chamada "Empresa Alob"
   - Como não existe, `organizationId` fica `null`
   - Sem `organizationId`, nenhuma query retorna dados

3. **Componente estava consultando view inexistente**
   - ✅ JÁ CORRIGIDO - Agora usa `bling_orders`

4. **Workflow N8N tinha organization_id errado**
   - ✅ JÁ CORRIGIDO - 18 ocorrências substituídas

## 🚀 Solução Definitiva

### Passo 1: Criar Organization e Pedidos de Teste

**Execute este SQL no Supabase SQL Editor:**

1. Abrir https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/sql/new

2. Copiar e colar o conteúdo do arquivo `setup_organization.sql`

3. Clicar em "Run"

Isso vai:
- ✅ Criar organization "Empresa Alob" com ID `28b4b443-03fd-4a2d-b596-9dcaf142b389`
- ✅ Inserir 8 pedidos de teste em diferentes estados
- ✅ Permitir que o mapa funcione imediatamente

### Passo 2: Recarregar a Aplicação

1. Fazer logout (se estiver logado)
2. Fazer login novamente com `empresaalob@gmail.com`
3. O sistema vai buscar a organization "Empresa Alob"
4. Abrir http://localhost:5173/sales
5. **O MAPA DEVE APARECER!** 🎉

### Passo 3: Validar

```bash
# Verificar se os dados foram inseridos
python check_orders_simple.py

# Deve mostrar:
# Total de registros em bling_orders: 8
# Total de pedidos com org_id correto: 8
```

### Passo 4: Testar com Playwright

```bash
python test_dashboard_map.py
```

Deve mostrar:
- ✅ Título 'Distribuição por Estado' encontrado
- ✅ Elementos SVG do mapa encontrados
- ✅ Dados de estados carregados

## 📊 Como Funciona

### Fluxo de Organization ID

```
1. Usuário faz login
   ↓
2. SettingsContext busca organization:
   a) Tenta buscar em organization_members (por user_id)
   b) Se não encontrar, busca organization "Empresa Alob"
   c) Se não encontrar, pega a primeira organization
   ↓
3. organizationId é setado no contexto
   ↓
4. Componentes usam organizationId para filtrar dados
   ↓
5. Mapa consulta: bling_orders WHERE organization_id = organizationId
```

### Por Que Estava Vazio?

- Você nunca criou a organization no banco
- O workflow N8N não conseguia inserir pedidos (sem organization)
- O frontend não conseguia buscar dados (organizationId = null)

## 🎨 Resultado Esperado

Após executar o SQL, você verá:

### No Mapa
- 🗺️ Mapa do Brasil renderizado
- 🎨 Estados coloridos: SP (2 pedidos), RJ, MG, RS, PR, BA, SC
- 📊 Lista com percentuais (SP: 25%, outros: 12.5% cada)
- 👆 Clique em um estado para ver detalhes

### Distribuição
```
SP: 2 pedidos (25%)
RJ: 1 pedido (12.5%)
MG: 1 pedido (12.5%)
RS: 1 pedido (12.5%)
PR: 1 pedido (12.5%)
BA: 1 pedido (12.5%)
SC: 1 pedido (12.5%)
```

## 🔧 Para Produção

### 1. Criar Organization Real

```sql
INSERT INTO organizations (
  id,
  name,
  slug,
  working_capital,
  emergency_reserve,
  capital_marketing,
  gross_investment
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  'Sua Empresa',
  'sua-empresa',
  10000.00,
  5000.00,
  3000.00,
  18000.00
);
```

### 2. Associar Usuário à Organization

Você precisa do `user_id` do Supabase Auth. Para pegar:

1. Fazer login na aplicação
2. Abrir console do navegador (F12)
3. Executar:
```javascript
supabase.auth.getUser().then(({data}) => console.log(data.user.id))
```

4. Copiar o ID e executar:
```sql
INSERT INTO organization_members (
  organization_id,
  user_id,
  role
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  'SEU_USER_ID_AQUI',
  'owner'
);
```

### 3. Ativar Workflow N8N

1. Abrir N8N
2. Importar o workflow corrigido: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
3. Ativar o workflow
4. Configurar webhook no Bling
5. Pedidos reais serão importados automaticamente

## 📝 Resumo dos IDs

### Organization IDs

- **CORRETO (usar este)**: `28b4b443-03fd-4a2d-b596-9dcaf142b389`
- **ERRADO (não usar)**: `e3274f4d-2627-4121-895d-b0e3a70b0ace`

### Usuário

- **Email**: empresaalob@gmail.com
- **Senha**: n2qyvsj7sw47zbqy
- **Organization**: Empresa Alob (será criada pelo SQL)

## ✅ Checklist Final

- [ ] Executar `setup_organization.sql` no Supabase
- [ ] Verificar que organization foi criada
- [ ] Verificar que 8 pedidos foram inseridos
- [ ] Fazer logout/login na aplicação
- [ ] Abrir página de vendas
- [ ] Verificar que o mapa aparece
- [ ] Clicar em um estado e ver detalhes
- [ ] Executar `python test_dashboard_map.py`
- [ ] Build: `npm run build`
- [ ] Lint: `npm run lint --fix`
- [ ] Commit: `git add . && git commit -m "fix: corrigir mapa de distribuição por estado"`

## 🆘 Se Ainda Não Funcionar

1. **Verificar console do navegador (F12)**
   - Procurar por erros
   - Verificar se `organizationId` não é null

2. **Verificar Network tab**
   - Ver se a query para `bling_orders` está sendo feita
   - Ver se retorna os 8 pedidos

3. **Verificar no código**
   ```javascript
   // No console do navegador
   console.log(localStorage.getItem('supabase.auth.token'))
   ```

4. **Verificar RLS**
   - As políticas de Row Level Security podem estar bloqueando
   - Temporariamente desabilitar: `ALTER TABLE bling_orders DISABLE ROW LEVEL SECURITY;`

## 📞 Suporte

Todos os arquivos necessários foram criados:
- `setup_organization.sql` - **EXECUTE ESTE PRIMEIRO!**
- `check_orders_simple.py` - Verificar dados
- `test_dashboard_map.py` - Testar com Playwright
- `list_tables.py` - Listar tabelas do banco
- `check_user_organization.py` - Verificar usuário e organization

---

**IMPORTANTE**: Execute o `setup_organization.sql` AGORA para criar a organization e os pedidos de teste. Sem isso, o mapa não vai funcionar!
