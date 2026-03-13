# Como Aplicar a Migração do Banco de Dados

## ⚠️ Importante
A migração precisa ser aplicada manualmente no Supabase Dashboard, pois:
- O Supabase CLI não está instalado localmente
- Você não tem permissões para executar SQL via MCP

## 📋 Passo a Passo

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `ybpkjqxzqhfxqxqnqvxr`

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query" para criar uma nova consulta

3. **Cole o SQL da Migração**
   ```sql
   -- Add influencers and affiliates JSONB columns to products table
   ALTER TABLE products
   ADD COLUMN IF NOT EXISTS influencers JSONB DEFAULT '[]'::jsonb,
   ADD COLUMN IF NOT EXISTS affiliates JSONB DEFAULT '[]'::jsonb;

   -- Add comments for documentation
   COMMENT ON COLUMN products.influencers IS 'Array of influencer marketing data with name, social media accounts, and commission percentage';
   COMMENT ON COLUMN products.affiliates IS 'Array of affiliate marketing data with name and commission percentage';
   ```

4. **Execute a Query**
   - Clique no botão "Run" (ou pressione Ctrl+Enter)
   - Aguarde a confirmação de sucesso

5. **Verifique a Migração**
   - Vá para "Table Editor" no menu lateral
   - Selecione a tabela "products"
   - Verifique se as colunas `influencers` e `affiliates` foram criadas

### Opção 2: Instalar Supabase CLI (Para Futuro)

Se você quiser usar o CLI no futuro:

1. **Instalar via npm:**
   ```bash
   npm install -g supabase
   ```

2. **Ou via Chocolatey (Windows):**
   ```bash
   choco install supabase
   ```

3. **Depois de instalado:**
   ```bash
   # Login
   supabase login

   # Aplicar migração
   supabase db push
   ```

## ✅ Verificação

Após aplicar a migração, você pode verificar se funcionou:

1. **Via SQL Editor:**
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'products'
   AND column_name IN ('influencers', 'affiliates');
   ```

2. **Resultado esperado:**
   ```
   column_name  | data_type | column_default
   -------------|-----------|----------------
   influencers  | jsonb     | '[]'::jsonb
   affiliates   | jsonb     | '[]'::jsonb
   ```

## 🎯 Próximos Passos

Após aplicar a migração com sucesso:

1. ✅ O sistema já está pronto para usar
2. ✅ Você pode adicionar influenciadores em "Tráfego Orgânico"
3. ✅ Você pode adicionar afiliados em "Tráfego Orgânico"
4. ✅ Os dados serão salvos automaticamente no banco
5. ✅ Ao editar um produto, verá os influenciadores/afiliados na aba "Tráfego Orgânico"

## 🐛 Troubleshooting

### Erro: "column already exists"
Se você receber este erro, significa que a coluna já foi criada. Isso é normal e pode ignorar.

### Erro: "permission denied"
Verifique se você tem permissões de admin no projeto Supabase.

### Erro: "relation products does not exist"
Verifique se você está conectado ao projeto correto.

## 📝 Notas

- A migração usa `IF NOT EXISTS` para evitar erros se já foi aplicada
- Os valores padrão são arrays vazios `[]`
- As colunas são do tipo JSONB para flexibilidade
- Os comentários ajudam na documentação do schema

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Documentação Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
