# Guia: Cadastrar Produto "Camisa Mouth" com Variações

## Problema Identificado

O produto "Camisa Mouth" (bling_id: 16617024491) tem:
- ✅ Registro em `products_bling`
- ✅ 24 variações em `products_variations_bling`
- ❌ NÃO existe em `products` (tabela principal)
- ❌ Variações NÃO existem em `product_variations`

Por isso o card não mostra as setas de navegação entre variações.

## Solução: 2 Opções

### Opção 1: Executar workflow completo (RECOMENDADO)

**Mais simples e seguro**

1. Abra o n8n
2. Localize o workflow "Bling Cadastrar Produto"
3. Clique em "Execute Workflow" (botão de play)
4. Aguarde a execução (pode demorar alguns minutos)
5. O workflow vai:
   - Buscar todos os produtos do Bling
   - Identificar quais não existem no banco
   - Cadastrar os produtos faltantes (incluindo Camisa Mouth)
   - Cadastrar todas as variações

**Vantagens:**
- Cadastra todos os produtos faltantes de uma vez
- Não precisa modificar o workflow
- Mais seguro

**Desvantagens:**
- Pode demorar mais (processa todos os produtos)

---

### Opção 2: Modificar workflow para produto específico

**Mais rápido, mas requer modificação temporária**

#### Passo 1: Modificar o workflow

```bash
node fix-camisamouth-workflow.cjs
```

Isso vai modificar o workflow para buscar APENAS o produto "Camisa Mouth" (ID 16617024491).

#### Passo 2: Importar no n8n

1. Abra o n8n
2. Vá no workflow "Bling Cadastrar Produto"
3. Clique nos 3 pontinhos → "Import from File"
4. Selecione: `src/hooks/n8n/workflows/Bling Cadastrar Produto (5).json`
5. Confirme a importação

#### Passo 3: Executar o workflow

1. Clique em "Execute Workflow"
2. Aguarde a execução
3. Verifique os logs para confirmar sucesso

#### Passo 4: Restaurar o workflow

```bash
node restore-workflow.cjs
```

Isso restaura o workflow para o comportamento normal (busca paginada).

#### Passo 5: Reimportar no n8n

1. Repita o processo de importação
2. Agora o workflow volta ao normal

**Vantagens:**
- Mais rápido (processa apenas 1 produto)
- Útil para testar

**Desvantagens:**
- Requer modificação e restauração do workflow
- Mais passos manuais

---

## Verificação

Após executar qualquer uma das opções, verifique:

1. **No Supabase:**
   ```sql
   SELECT COUNT(*) FROM products WHERE sku = 'CamisaMouth';
   -- Deve retornar 1
   
   SELECT COUNT(*) FROM product_variations 
   WHERE product_id = (SELECT id FROM products WHERE sku = 'CamisaMouth');
   -- Deve retornar 24
   ```

2. **Na interface:**
   - Recarregue a página de produtos
   - O card "Camisa Mouth" deve mostrar setas de navegação
   - Deve ser possível navegar entre as 24 variações

---

## Recomendação

**Use a Opção 1** (executar workflow completo) porque:
- É mais simples
- Não requer modificações
- Cadastra todos os produtos faltantes de uma vez
- Menos chance de erro

A Opção 2 é útil apenas se você quiser testar rapidamente ou se tiver muitos produtos e quiser processar apenas alguns específicos.
