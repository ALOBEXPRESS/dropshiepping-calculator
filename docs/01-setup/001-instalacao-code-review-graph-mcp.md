# 001) Instalando o MCP `code-review-graph` (passo a passo, para leigos)

Este guia te ajuda a instalar e ativar o **code-review-graph** no seu projeto. Ele cria um “mapa” do seu código (um grafo) para que ferramentas de IA não precisem reler o repositório inteiro a cada tarefa. Na prática, isso reduz leitura desnecessária e melhora a precisão do contexto.

## O que você vai conseguir no final

- Ter o servidor MCP do `code-review-graph` disponível para sua ferramenta de IA
- Gerar o primeiro “grafo” do projeto (indexação inicial)
- Saber como validar se está funcionando e como resolver problemas comuns

## Pré-requisitos (o básico)

- Windows 10/11
- **Python 3.10+** instalado
- Acesso ao terminal (PowerShell, Windows Terminal ou Git Bash)

Para conferir se seu Python está ok, rode um destes comandos:

```bash
python --version
```

Se der erro, tente:

```bash
py -V
```

Se aparecer algo como `Python 3.10.x` (ou maior), está tudo certo.

## Como este projeto já está preparado

Este repositório já contém o arquivo de configuração MCP em:

- `.mcp.json`

Ele já está configurado para executar o servidor via `uvx`:

```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "uvx",
      "args": ["code-review-graph", "serve"],
      "type": "stdio"
    }
  }
}
```

Ou seja: o que falta mesmo é garantir que o **`uvx`** exista no seu computador e gerar o grafo pela primeira vez.

## Instalação (recomendada): instalar `uv` (para ter o `uvx`)

No Windows, a forma mais simples (e comum) é instalar pelo próprio `pip`.

1) Atualize o `pip` (opcional, mas recomendado):

```bash
py -m pip install --upgrade pip
```

2) Instale o `uv` para o seu usuário (não precisa admin):

```bash
py -m pip install --user uv
```

3) Feche e abra o terminal de novo.

4) Verifique se o `uvx` está disponível:

```bash
uvx --version
```

Se esse comando funcionar, você já tem o necessário para o MCP.

## Gerar o grafo do projeto (primeira vez)

Com o terminal aberto na pasta do projeto (a mesma onde existe o `package.json`), rode:

```bash
uvx code-review-graph build
```

Na primeira execução ele vai ler o projeto e montar o grafo inicial. Depois disso, ele tende a atualizar incrementalmente conforme alterações.

Se você receber um erro “bizarro” nessa etapa, pule para a seção “4) Deu erro sinistro ao montar o grafo”.

## Como validar se funcionou

Depois do build, rode:

```bash
uvx code-review-graph status
```

Se aparecer algo como `Nodes`, `Edges` e `Files`, o grafo foi criado com sucesso.

## Ativar no seu editor/ferramenta de IA

1) Certifique-se que o arquivo `.mcp.json` está na raiz do projeto.
2) Reinicie seu editor/ferramenta de IA para ela “enxergar” o MCP.
3) Faça um teste pedindo algo como:

> “Construa o code review graph para este projeto”

ou

> “Use o code-review-graph para encontrar onde é calculada a margem de lucro”

## Problemas comuns (e como resolver)

### 1) “uvx não é reconhecido como um comando…”

Isso normalmente é PATH.

- Feche e reabra o terminal (isso resolve em muitos casos)
- Se ainda não funcionar, descubra onde o Python instala os scripts do usuário:

```bash
py -m site --user-base
```

Geralmente você precisa adicionar ao PATH uma pasta parecida com:

- `C:\Users\SEU_USUARIO\AppData\Roaming\Python\Python3xx\Scripts`

Depois de ajustar o PATH, abra um terminal novo e rode:

```bash
uvx --version
```

### 2) O MCP não aparece na ferramenta de IA

- Confirme que o `.mcp.json` está na raiz do projeto
- Reinicie o editor
- Se a ferramenta tiver uma área de “MCP / Tools / Servers”, confirme se o servidor `code-review-graph` está listado

### 3) Quero usar sem `uvx` (alternativa)

Se você preferir instalar o `code-review-graph` como comando fixo no Windows, use `pipx` (quando disponível) ou `pip`.

Instalando via `pipx`:

```bash
py -m pip install --user pipx
py -m pipx ensurepath
pipx install code-review-graph
```

Depois, você poderia ajustar o `.mcp.json` para usar:

- `command`: `code-review-graph`
- `args`: `["serve"]`

E reiniciar o editor.

### 4) Deu erro sinistro ao montar o grafo

Quando o erro parece “assustador”, na prática quase sempre é uma destas coisas:

- Alguma etapa de pós-processamento (fluxos/comunidades/FTS) travou
- O terminal ficou “parado” por alguns minutos sem imprimir nada (parece travado, mas não está)

Faça assim, em ordem:

1) Rode um build mais “simples” (mais tolerante a problemas):

```bash
uvx code-review-graph build --skip-postprocess
```

2) Confirme se gerou o grafo:

```bash
uvx code-review-graph status
```

3) Se isso funcionar, você já pode usar o MCP normalmente. Depois, quando quiser tentar o build completo, rode:

```bash
uvx code-review-graph build
```

4) Se ainda der erro, rode este comando e copie/cole a saída completa do terminal:

```bash
uvx code-review-graph build --repo .
```

## Checklist rápido (para você saber se está tudo certo)

- `uvx --version` funciona
- `uvx code-review-graph build` roda sem erro na pasta do projeto
- Você reiniciou o editor depois da instalação
- O arquivo `.mcp.json` está na raiz do projeto

