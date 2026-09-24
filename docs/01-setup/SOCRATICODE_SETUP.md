# Guia de Instalação - SocratiCode

## 📋 Pré-requisitos

### 1. Docker Desktop
- **Status**: ✅ Instalado (versão 28.4.0)
- **Ação necessária**: ⚠️ **Iniciar o Docker Desktop**

**Como iniciar:**
1. Abra o Docker Desktop no menu Iniciar
2. Aguarde até ver o ícone do Docker na bandeja do sistema (system tray)
3. Verifique se está rodando: `docker ps` (deve listar containers sem erro)

### 2. Node.js
- **Requisito**: Node.js 18 ou superior
- **Verificar**: Execute `node --version` no terminal

## 🚀 Instalação

### Passo 1: Configuração MCP

✅ **Já configurado!** O SocratiCode foi adicionado ao arquivo `.kiro/settings/mcp.json`

```json
{
  "socraticode": {
    "command": "npx",
    "args": ["-y", "socraticode"],
    "autoApprove": [...],
    "disabled": false
  }
}
```

### Passo 2: Reiniciar Kiro

Após adicionar o servidor MCP, você precisa reiniciar o Kiro para que ele carregue o SocratiCode:

1. Feche e reabra o VS Code/Kiro, OU
2. Use o comando de reiniciar servidores MCP (se disponível)

### Passo 3: Primeira Indexação

Na primeira vez que usar o SocratiCode:

1. **Inicialização automática** (primeira vez, ~5 minutos):
   - Baixa imagens Docker (Qdrant + Ollama)
   - Inicia containers
   - Baixa modelo de embeddings

2. **Indexar o projeto**:
   ```
   Você: "Indexar este código"
   ```

3. **Monitorar progresso**:
   ```
   Você: "Qual o status da indexação?"
   ```
   
   Repita a cada 60 segundos até completar.

## 📊 Após a Indexação

### Ferramentas Disponíveis

#### Busca e Exploração
- `codebase_search` - Busca híbrida semântica + palavras-chave
- `codebase_status` - Status do índice
- `codebase_graph_query` - Consultar imports e dependentes
- `codebase_graph_stats` - Estatísticas do grafo
- `codebase_graph_visualize` - Visualizar grafo de dependências
- `codebase_graph_circular` - Detectar dependências circulares

#### Análise de Impacto
- `codebase_impact` - Raio de explosão (o que quebra se mudar X)
- `codebase_flow` - Rastreamento de fluxo de execução
- `codebase_symbol` - Visão 360° de uma função
- `codebase_symbols` - Listar símbolos em arquivo ou buscar por nome

#### Contexto e Artefatos
- `codebase_context` - Listar artefatos de contexto
- `codebase_context_search` - Buscar em schemas, specs, configs

#### Gerenciamento
- `codebase_health` - Verificar saúde do sistema
- `codebase_list_projects` - Listar projetos indexados
- `codebase_about` - Informações sobre SocratiCode

## 🔧 Configuração Avançada (Opcional)

### Usar OpenAI para Embeddings (Mais Rápido)

Se quiser usar OpenAI em vez de Ollama local:

```json
{
  "socraticode": {
    "command": "npx",
    "args": ["-y", "socraticode"],
    "env": {
      "EMBEDDING_PROVIDER": "openai",
      "OPENAI_API_KEY": "sk-..."
    }
  }
}
```

### Usar Google Gemini (Gratuito)

```json
{
  "socraticode": {
    "command": "npx",
    "args": ["-y", "socraticode"],
    "env": {
      "EMBEDDING_PROVIDER": "google",
      "GOOGLE_API_KEY": "AIza..."
    }
  }
}
```

## 📝 Fluxo de Trabalho Recomendado

### 1. Exploração de Código
```
Você: "Buscar por autenticação"
→ codebase_search { query: "authentication" }
```

### 2. Análise de Dependências
```
Você: "O que depende do arquivo auth.ts?"
→ codebase_graph_query { filePath: "src/auth.ts" }
```

### 3. Análise de Impacto
```
Você: "O que quebra se eu mudar a função validateUser?"
→ codebase_impact { target: "validateUser" }
```

### 4. Visualização
```
Você: "Mostrar grafo de dependências"
→ codebase_graph_visualize {}
```

## 🐛 Solução de Problemas

### Docker não está rodando
**Erro**: `error during connect: Get "http://..."`

**Solução**: Inicie o Docker Desktop e aguarde até estar completamente carregado.

### Indexação falhou
**Solução**: 
1. Remover índice: "Remover o índice deste projeto"
2. Reindexar: "Indexar este projeto"

### Conexão MCP desconecta durante indexação
**Solução**: Pergunte o status a cada 60 segundos para manter a conexão ativa:
```
Você: "Qual o status da indexação?"
```

### Mudanças não aparecem na busca
**Solução**: O file watcher inicia automaticamente. Se necessário:
```
Você: "Iniciar watcher deste projeto"
```

## 📚 Recursos

- **Repositório**: https://github.com/giancarloerra/SocratiCode
- **Discord**: https://discord.gg/5DrMXfNG
- **Documentação**: Ver README no repositório

## 🎯 Próximos Passos

1. ✅ Configuração MCP adicionada
2. ⚠️ **Iniciar Docker Desktop**
3. 🔄 Reiniciar Kiro
4. 📊 Indexar o projeto
5. 🚀 Começar a usar!

---

**Nota**: O SocratiCode funciona com zero configuração. Todas as configurações avançadas são opcionais e só necessárias se você quiser customizar o comportamento padrão.
