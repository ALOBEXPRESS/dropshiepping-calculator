# 🚀 LEIA-ME PRIMEIRO: Resolver Problemas Bling

## ⚡ Ação Rápida (3 Passos - 10 minutos)

### 📍 PASSO 1: Resetar Filtro (2 min)

1. **Edite o arquivo** `resetar-filtro.html`
   - Abra com qualquer editor de texto
   - Vá na **linha 95**
   - Altere a URL para sua aplicação:
   ```javascript
   const appUrl = 'http://localhost:5173'; // ← ALTERE AQUI
   ```
   - Salve o arquivo

2. **Abra o arquivo** no navegador
   - Clique duas vezes em `resetar-filtro.html`
   - OU arraste para o navegador

3. **Clique em "Limpar Filtros Agora"**
   - Aguarde 3 segundos
   - Você será redirecionado automaticamente

✅ **Resultado**: Todos os produtos devem aparecer na aplicação!

---

### 📍 PASSO 2: Modificar n8n (5 min)

#### 2.1. Nó "Parsear Requisição"

1. Abra o **n8n** no navegador
2. Abra o workflow **"Bling Cadastrar Produto"**
3. Clique no nó **"Parsear Requisição"** (ícone `{ }`)
4. Selecione TODO o código (Ctrl+A)
5. Delete tudo
6. Abra o arquivo **`src/hooks/n8n/code-snippets/parsear-requisicao-codigo-final.js`**
7. Copie TODO o conteúdo
8. Cole no nó "Parsear Requisição"
9. Clique em **"Save"**

#### 2.2. Nó "Create a row"

1. Clique no nó **"Create a row"** (ícone Supabase)
2. Clique no **ícone de engrenagem** ⚙️ (canto superior direito)
3. Procure **"On Error"**
4. Selecione **"Continue"**
5. Clique em **"Save"**

✅ **Resultado**: Workflow configurado corretamente!

---

### 📍 PASSO 3: Testar (3 min)

1. No n8n, clique em **"Execute workflow"**
2. Aguarde terminar
3. Verifique os logs do nó "Parsear Requisição":
   ```
   PROCESSAMENTO COMPLETO
   Produtos pai (processando primeiro): XX
   Variações (processando depois): YY
   ```

✅ **Resultado**: Workflow funcionando sem erros!

---

## 📚 Documentação Completa

Se precisar de mais detalhes, consulte:

### Instruções Detalhadas
- **`src/hooks/n8n/INSTRUCOES_N8N_BLING.md`** - Instruções completas para n8n
- **`docs/RESUMO_FINAL_SOLUCOES_BLING.md`** - Resumo de tudo que foi feito

### Guias Visuais
- **`docs/GUIA_VISUAL_PASSO_A_PASSO.md`** - Guia visual com emojis
- **`docs/DIAGRAMA_FLUXO_BLING.md`** - Diagramas do workflow

### Referências Rápidas
- **`docs/QUICK_REFERENCE_BLING.md`** - Códigos e comandos prontos
- **`docs/INDEX_PROBLEMAS_BLING.md`** - Índice de toda documentação

---

## 🎯 O Que Foi Resolvido

### Problema 1: Filtro Travado ✅
- **Antes**: Só aparecia 1 produto
- **Depois**: Todos os produtos aparecem
- **Solução**: Arquivo `resetar-filtro.html`

### Problema 2: FK Constraint Error ✅
- **Antes**: Erro ao inserir variações sem produto pai
- **Depois**: Produtos pai inseridos primeiro, variações depois
- **Solução**: Código otimizado no nó "Parsear Requisição"

### Problema 3: Duplicate SKU Error ✅
- **Antes**: Workflow parava ao encontrar SKU duplicado
- **Depois**: Workflow continua e ignora SKUs duplicados
- **Solução**: Configuração "On Error: Continue"

---

## ✅ Checklist Rápido

- [ ] Editar `resetar-filtro.html` (linha 95)
- [ ] Abrir `resetar-filtro.html` no navegador
- [ ] Clicar em "Limpar Filtros Agora"
- [ ] Modificar nó "Parsear Requisição" no n8n
- [ ] Configurar nó "Create a row" no n8n
- [ ] Executar workflow
- [ ] Verificar logs

**Tempo total**: ~10 minutos

---

## 🆘 Precisa de Ajuda?

Leia a documentação completa em:
- **`docs/RESUMO_FINAL_SOLUCOES_BLING.md`**
- **`src/hooks/n8n/INSTRUCOES_N8N_BLING.md`**

Ou consulte o índice:
- **`docs/INDEX_PROBLEMAS_BLING.md`**

---

**Última atualização**: 2026-03-01
