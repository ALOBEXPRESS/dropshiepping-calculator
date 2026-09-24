# Code Review Graph — Guia de Uso

> Reduz o consumo de tokens do Claude/Kiro em até **8x** mapeando toda a base de código com Tree-sitter e entregando apenas o contexto relevante para cada tarefa.

---

## O que é

O **code-review-graph** constrói um grafo de conhecimento estrutural do seu repositório. Em vez de o AI ler todos os arquivos a cada pergunta, ele consulta o grafo e recebe apenas os nós (funções, classes, arquivos) que realmente importam para aquela tarefa.

**Resultados medidos:**
- 8,2x redução média de tokens em 6 repositórios reais
- Análise de "blast radius" — rastreia todos os chamadores e testes afetados por uma mudança
- Atualizações incrementais em menos de 2 segundos
- Funciona com Claude Code, Kiro, Cursor, Windsurf, Zed

---

## Pré-requisitos

- Python 3.9+
- pip
- Git (o repositório precisa ser um repo git)
- Node.js (para o servidor MCP)

---

## Instalação

### 1. Instalar o pacote

```bash
# Instalação básica
pip install code-review-graph

# Com embeddings semânticos (busca por significado, não só nome)
pip install code-review-graph[embeddings]

# Com detecção de comunidades (agrupa módulos relacionados)
pip install code-review-graph[communities]

# Tudo de uma vez (recomendado)
pip install code-review-graph[all]
```

### 2. Configurar o Kiro/Claude automaticamente

Na raiz do seu projeto, rode:

```bash
code-review-graph install
```

Isso detecta automaticamente qual AI você usa e configura o MCP. Para forçar uma plataforma específica:

```bash
code-review-graph install --platform claude-code
code-review-graph install --platform cursor
```

### 3. Construir o grafo

```bash
code-review-graph build
```

Saída esperada:
```
Full build: 500 files, 6285 nodes, 27117 edges (postprocess=full)
```

---

## Uso no dia a dia

### Atualizar após mudanças de código

Após editar arquivos, atualize o grafo incrementalmente (muito rápido):

```bash
# Atualiza apenas os arquivos que mudaram desde o último commit
code-review-graph update

# Comparar com uma branch específica
code-review-graph update --base origin/main
```

### Build sem pós-processamento (mais rápido)

```bash
code-review-graph build --skip-flows          # Pula detecção de fluxos
code-review-graph build --skip-postprocess    # Pula todo pós-processamento

# Rodar pós-processamento depois, separadamente
code-review-graph postprocess
```

---

## Ferramentas MCP disponíveis

Após a instalação, o Kiro/Claude terá acesso a estas ferramentas via MCP:

### `build_or_update_graph_tool`
Constrói ou atualiza o grafo.

```json
{ "full_rebuild": true }
```

---

### `get_impact_radius_tool` ⭐ (mais útil)
Mostra o "blast radius" de uma mudança — quais funções, classes e arquivos são afetados.

```json
{
  "changed_files": ["src/services/productService.ts"],
  "max_depth": 2,
  "detail_level": "standard"
}
```

Resposta inclui:
- `changed_nodes` — o que mudou diretamente
- `impacted_nodes` — o que é chamado/importado por quem mudou
- `impacted_files` — lista de arquivos afetados
- `summary` — resumo em texto

---

### `query_graph_tool`
Consulta o grafo com padrões específicos.

```json
{
  "pattern": "callers_of",
  "target": "productService.update"
}
```

**Padrões disponíveis:**

| Padrão | O que retorna |
|--------|---------------|
| `callers_of` | Quem chama essa função |
| `callees_of` | O que essa função chama |
| `imports_of` | O que esse arquivo importa |
| `importers_of` | Quem importa esse arquivo |
| `children_of` | Métodos/propriedades de uma classe |
| `tests_for` | Testes relacionados a um arquivo |
| `inheritors_of` | Classes que herdam de outra |
| `file_summary` | Resumo estrutural de um arquivo |

---

### `get_review_context_tool`
Busca contexto para revisão de código — ideal antes de fazer uma mudança grande.

```json
{
  "changed_files": ["src/services/productService.ts"],
  "include_source": false,
  "max_lines_per_file": 200
}
```

---

### `semantic_search_nodes_tool`
Busca por significado (requer `[embeddings]`).

```json
{
  "query": "cálculo de lucro com taxa de gateway",
  "kind": "Function",
  "limit": 10
}
```

---

### `find_large_functions_tool`
Encontra funções grandes que podem precisar de refatoração.

```json
{
  "min_lines": 100,
  "file_path_pattern": "src/services/"
}
```

---

### `list_graph_stats_tool`
Estatísticas gerais do grafo.

```json
{}
```

---

## Fluxo de trabalho recomendado

### Antes de implementar uma feature

```bash
# 1. Atualizar o grafo
code-review-graph update

# 2. Perguntar ao Kiro:
# "Use query_graph_tool para ver quem chama productService.update
#  antes de eu modificar essa função"
```

### Antes de fazer um commit

```bash
# Verificar impacto das mudanças
# Perguntar ao Kiro:
# "Use get_impact_radius_tool com os arquivos que modifiquei
#  para ver o que pode quebrar"
```

### Para entender um arquivo desconhecido

```bash
# Perguntar ao Kiro:
# "Use query_graph_tool com pattern=file_summary
#  para me explicar o que src/services/pricingService.ts faz"
```

---

## Configuração manual do MCP (se o auto-install não funcionar)

Adicione ao seu `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "uvx",
      "args": ["code-review-graph", "serve"],
      "env": {
        "CRG_REPO_ROOT": "CAMINHO_ABSOLUTO_DO_SEU_PROJETO"
      },
      "type": "stdio",
      "autoApprove": [
        "build_or_update_graph_tool",
        "get_minimal_context_tool",
        "get_impact_radius_tool",
        "query_graph_tool",
        "get_review_context_tool",
        "detect_changes_tool",
        "semantic_search_nodes_tool",
        "list_graph_stats_tool",
        "find_large_functions_tool",
        "get_architecture_overview_tool",
        "list_communities_tool",
        "get_affected_flows_tool",
        "list_flows_tool",
        "traverse_graph_tool",
        "get_hub_nodes_tool",
        "get_bridge_nodes_tool",
        "refactor_tool"
      ]
    }
  }
}
```

**Exemplo real (Windows):**
```json
"CRG_REPO_ROOT": "D:/workspace/no-code/dropshipping-calculator-app"
```

**Exemplo real (Mac/Linux):**
```json
"CRG_REPO_ROOT": "/home/usuario/projetos/meu-projeto"
```

> **Nota:** Requer `uv` instalado. Se não tiver: `pip install uv`

---

## Resolução de problemas

### ⚠️ MCP conecta mas as ferramentas retornam grafo vazio (0 nós, 0 arestas)

**Sintoma:** `list_graph_stats_tool` retorna `"Total nodes: 0"` mesmo após o build.

**Causa:** Dois problemas distintos que ocorreram na instalação deste projeto:

#### Problema 1 — Grafo nunca foi construído

O `code-review-graph install` configura o MCP mas **não constrói o grafo automaticamente**. O arquivo `.code-review-graph/graph.db` é criado vazio.

**Solução:** Rodar o build manualmente na raiz do projeto:

```bash
# Na raiz do projeto (onde está o .git)
code-review-graph build --skip-postprocess
```

O `--skip-postprocess` acelera o build inicial pulando detecção de fluxos e comunidades. Você pode rodar o pós-processamento depois:

```bash
code-review-graph postprocess
```

Saída esperada após o build:
```
INFO: Progress: 184/184 files parsed
Full build: 184 files, 1028 nodes, 11189 edges (postprocess=none)
```

#### Problema 2 — Servidor MCP sem `repo_root` configurado

**Causa:** O servidor MCP sobe sem saber em qual diretório está o projeto. Ele cria um `graph.db` vazio em um diretório temporário, ignorando o grafo que você construiu.

**Sintoma:** Mesmo com o grafo construído (verificável via `ls .code-review-graph/`), o MCP retorna 0 nós.

**Solução:** Adicionar a variável de ambiente `CRG_REPO_ROOT` com o caminho absoluto do projeto no `.kiro/settings/mcp.json`:

```json
"code-review-graph": {
  "command": "uvx",
  "args": ["code-review-graph", "serve"],
  "env": {
    "CRG_REPO_ROOT": "D:/workspace/no-code/dropshipping-calculator-app"
  },
  "type": "stdio"
}
```

Após editar o arquivo, **reconecte o servidor MCP** no painel do Kiro (ou reinicie o Kiro).

#### Como verificar se está funcionando

Após reconectar, teste com `list_graph_stats_tool`. A resposta correta deve ser:

```json
{
  "Files": 184,
  "Total nodes": 901,
  "Total edges": 11074,
  "Languages": ["javascript", "typescript", "tsx"]
}
```

Se ainda retornar 0, verifique:
1. O caminho em `CRG_REPO_ROOT` está correto e usa `/` (não `\`) mesmo no Windows
2. O build foi rodado na mesma pasta que o `CRG_REPO_ROOT` aponta
3. O servidor MCP foi reconectado após a mudança no `mcp.json`

---

## Linguagens suportadas

TypeScript, JavaScript, Python, Rust, Go, Java, C, C++, C#, Ruby, PHP, Swift, Kotlin, Scala e mais.

Este projeto usa **TypeScript/React** — totalmente suportado.

---

## Dicas para este projeto

1. **Rode `code-review-graph build` uma vez** na raiz do projeto para criar o grafo inicial.

2. **Antes de editar `productService.ts` ou `pricingService.ts`** (arquivos grandes e muito chamados), use `get_impact_radius_tool` para ver o que pode quebrar.

3. **Para encontrar onde uma função é chamada** sem precisar fazer grep manual, use `query_graph_tool` com `callers_of`.

4. **Mantenha o grafo atualizado** rodando `code-review-graph update` após cada sessão de edição.

---

## Referências

- Repositório: https://github.com/tirth8205/code-review-graph
- Documentação oficial: https://github.com/tirth8205/code-review-graph/blob/main/docs/USAGE.md
- Comandos CLI: https://github.com/tirth8205/code-review-graph/blob/main/docs/COMMANDS.md
