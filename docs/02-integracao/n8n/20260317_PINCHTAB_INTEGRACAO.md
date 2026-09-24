# PinchTab - Integração com o Projeto

## Data: 2026-03-11

## O que é PinchTab?

PinchTab é um binário Go de 12MB que fornece controle total do navegador para agentes de IA através de uma API HTTP simples. Ele gerencia instâncias do Chrome, contorna detecção de bots e reduz o uso de tokens em até 13x ao analisar a árvore de acessibilidade ao invés de tirar screenshots caros.

## Características Principais

### 1. Token-Efficient (Eficiência de Tokens)
- **~800 tokens/página** com extração de texto (5-13x mais barato que screenshots)
- Usa árvore de acessibilidade ao invés de screenshots
- Modo de leitura remove navegação e anúncios
- Modo raw mantém texto completo para workflows de parser

### 2. Arquitetura Simples
- **Binário único de 12MB** (sem dependências externas)
- API HTTP REST simples (JSON in/out)
- CLI ou curl para controle
- Suporta ARM64 (Raspberry Pi)

### 3. Multi-instância
- Executa múltiplos processos Chrome em paralelo
- Perfis isolados por instância
- Sessões persistentes (cookies, auth, tabs sobrevivem a reinicializações)

### 4. Stealth Mode
- Patches `navigator.webdriver`
- Spoofs User-Agent
- Esconde flags de automação
- Passa verificações de bot principais

### 5. Controle Completo
- Navegação, cliques, digitação, preenchimento de formulários
- Extração de texto e screenshots
- Execução de JavaScript
- Export para PDF
- Gerenciamento de múltiplas abas

## Instalação

### macOS / Linux
```bash
curl -fsSL https://pinchtab.com/install.sh | bash
```

### npm
```bash
npm install -g pinchtab
```

### Docker
```bash
docker run -d \
  --name pinchtab \
  -p 127.0.0.1:9867:9867 \
  -v pinchtab-data:/data \
  --shm-size=2g \
  pinchtab/pinchtab
```


## Uso Básico

### Iniciar o Servidor
```bash
pinchtab
# Servidor rodando em http://localhost:9867
```

### Comandos CLI

#### Navegação
```bash
# Navegar para URL
pinchtab nav https://example.com
```

#### Snapshot (Árvore de Acessibilidade)
```bash
# Obter estrutura da página com elementos clicáveis
pinchtab snap -i -c
# Retorna refs como e0, e1, e2... para cada elemento interativo
```

#### Ações
```bash
# Clicar em elemento
pinchtab click e5

# Digitar em campo
pinchtab type e12 "texto aqui"

# Preencher campo (mais rápido)
pinchtab fill e3 "user@example.com"

# Pressionar tecla
pinchtab press Enter

# Hover sobre elemento
pinchtab hover e5

# Scroll
pinchtab scroll down
```

#### Extração de Dados
```bash
# Extrair texto legível (~800 tokens)
pinchtab text

# Screenshot
pinchtab ss -o page.jpg

# Export PDF
pinchtab pdf -o page.pdf

# Executar JavaScript
pinchtab eval "document.title"
```


## API HTTP

### Endpoints Principais

#### 1. Health Check
```bash
GET /health
# Verifica status da conexão
```

#### 2. Criar Instância
```bash
POST /instances/launch
Content-Type: application/json

{
  "name": "work",
  "mode": "headless"  # ou "headed"
}

# Retorna: {"id": "inst_abc123"}
```

#### 3. Abrir Tab
```bash
POST /instances/{instanceId}/tabs/open
Content-Type: application/json

{
  "url": "https://example.com"
}

# Retorna: {"tabId": "tab_xyz789"}
```

#### 4. Snapshot (Árvore de Acessibilidade)
```bash
GET /tabs/{tabId}/snapshot?filter=interactive&format=json

# Retorna:
{
  "refs": [
    {"id": "e0", "role": "link", "text": "Sign In", "selector": "a[href='/login']"},
    {"id": "e1", "role": "textbox", "label": "Email", "selector": "input[name='email']"},
    {"id": "e2", "role": "button", "text": "Submit", "selector": "button[type='submit']"}
  ],
  "text": "... texto legível da página ...",
  "title": "Login Page"
}
```

#### 5. Ações
```bash
POST /tabs/{tabId}/action
Content-Type: application/json

# Clicar
{"kind": "click", "ref": "e5"}

# Digitar
{"kind": "type", "ref": "e12", "text": "hello world"}

# Preencher
{"kind": "fill", "ref": "e12", "text": "john@example.com"}

# Pressionar tecla
{"kind": "press", "key": "Enter"}

# Hover
{"kind": "hover", "ref": "e5"}

# Scroll
{"kind": "scroll", "direction": "down"}

# Selecionar opção
{"kind": "select", "ref": "e3", "value": "option2"}
```

#### 6. Extrair Texto
```bash
GET /tabs/{tabId}/text

# Retorna:
{
  "text": "Texto legível da página...",
  "title": "Page Title"
}
```

#### 7. Screenshot
```bash
GET /tabs/{tabId}/screenshot

# Retorna: imagem JPEG
```

#### 8. Export PDF
```bash
GET /tabs/{tabId}/pdf

# Retorna: arquivo PDF
```


## Exemplo Completo: Workflow de Automação

```bash
# 1. Criar instância
INST=$(curl -s -X POST http://localhost:9867/instances/launch \
  -H "Content-Type: application/json" \
  -d '{"name":"work","mode":"headless"}' | jq -r '.id')

# 2. Abrir tab
TAB=$(curl -s -X POST http://localhost:9867/instances/$INST/tabs/open \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/login"}' | jq -r '.tabId')

# 3. Obter snapshot
curl "http://localhost:9867/tabs/$TAB/snapshot?filter=interactive" | jq .

# 4. Preencher formulário de login
curl -X POST "http://localhost:9867/tabs/$TAB/action" \
  -H "Content-Type: application/json" \
  -d '{"kind":"fill","ref":"e1","text":"user@example.com"}'

curl -X POST "http://localhost:9867/tabs/$TAB/action" \
  -H "Content-Type: application/json" \
  -d '{"kind":"fill","ref":"e2","text":"password123"}'

# 5. Clicar no botão de login
curl -X POST "http://localhost:9867/tabs/$TAB/action" \
  -H "Content-Type: application/json" \
  -d '{"kind":"click","ref":"e3"}'

# 6. Aguardar e extrair texto
sleep 2
curl "http://localhost:9867/tabs/$TAB/text" | jq .text

# 7. Screenshot para verificação
curl "http://localhost:9867/tabs/$TAB/screenshot" > result.jpg
```


## Comparação: PinchTab vs MCP Playwright

| Aspecto | PinchTab | MCP Playwright |
|---------|----------|----------------|
| **Tamanho** | 12MB (binário Go) | ~200MB+ (Node.js + Playwright) |
| **Instalação** | 1 comando | npm install + dependências |
| **Uso de Tokens** | ~800 tokens/página | ~10.000+ tokens/página (screenshots) |
| **API** | HTTP REST simples | MCP Protocol (mais complexo) |
| **Multi-instância** | ✅ Nativo | ⚠️ Requer configuração |
| **Sessões Persistentes** | ✅ Cookies/auth sobrevivem | ❌ Sessões efêmeras |
| **Stealth Mode** | ✅ Bypass bot detection | ⚠️ Limitado |
| **Headless/Headed** | ✅ Ambos | ✅ Ambos |
| **Árvore de Acessibilidade** | ✅ Primeira classe | ✅ Disponível |
| **Screenshots** | ✅ JPEG otimizado | ✅ PNG/JPEG |
| **Export PDF** | ✅ Nativo | ✅ Nativo |
| **Execução JS** | ✅ Direto | ✅ Via evaluate |
| **ARM64 Support** | ✅ Otimizado | ⚠️ Limitado |
| **Custo de Tokens** | 💰 Muito baixo | 💰💰💰 Alto |
| **Complexidade** | 🟢 Simples | 🟡 Média |
| **Maturidade** | 🟡 Novo (2025) | 🟢 Maduro |


## Benefícios para o Projeto

### 1. Redução Drástica de Custos de Tokens
- **Economia de 13x**: ~800 tokens vs ~10.000+ tokens por página
- Ideal para tarefas repetitivas de automação
- Extração de texto ao invés de screenshots caros
- Impacto direto no custo de uso da API do Claude/GPT

### 2. Performance Superior
- **Binário leve**: 12MB vs 200MB+ do Playwright
- Startup mais rápido
- Menor uso de memória
- Ideal para ambientes com recursos limitados

### 3. Sessões Persistentes
- Login uma vez, mantém sessão ativa
- Cookies e autenticação sobrevivem a reinicializações
- Reduz necessidade de re-autenticação constante
- Ideal para automação de tarefas recorrentes

### 4. Stealth Mode Nativo
- Bypass de detecção de bots
- Patches automáticos de `navigator.webdriver`
- Spoofing de User-Agent
- Essencial para scraping de sites protegidos

### 5. Multi-instância Simplificada
- Executa múltiplos navegadores em paralelo
- Perfis isolados por instância
- Ideal para testes A/B ou múltiplas contas
- Gerenciamento simplificado via API

### 6. API HTTP Simples
- Sem necessidade de MCP Protocol
- Curl ou qualquer cliente HTTP funciona
- Fácil integração com qualquer linguagem
- Debugging mais simples

### 7. Árvore de Acessibilidade First-Class
- Refs estáveis (e0, e1, e2...) ao invés de coordenadas frágeis
- Determinístico e confiável
- Menos falhas por mudanças de layout
- Melhor para agentes de IA


## Casos de Uso no Projeto

### 1. Testes Automatizados do Dashboard
```bash
# Testar login e navegação
pinchtab nav http://localhost:5173/
pinchtab snap -i -c
pinchtab fill e1 "admin@example.com"
pinchtab fill e2 "password"
pinchtab click e3
pinchtab text | grep "Dashboard de Vendas"
```

### 2. Scraping de Dados do Bling/Mercado Livre
```bash
# Login no Bling
pinchtab nav https://bling.com.br/login
pinchtab fill e1 "usuario"
pinchtab fill e2 "senha"
pinchtab click e3

# Navegar para produtos
pinchtab nav https://bling.com.br/produtos
pinchtab text > produtos.txt

# Screenshot para verificação
pinchtab ss -o bling-produtos.jpg
```

### 3. Validação de Integrações
```bash
# Verificar webhook do Mercado Livre
pinchtab nav https://mercadolivre.com.br/vendas
pinchtab snap -i -c
pinchtab click e5  # Abrir pedido
pinchtab text | jq .text | grep "Pedido #111"
```

### 4. Monitoramento de Preços
```bash
# Verificar preços de concorrentes
pinchtab nav https://concorrente.com/produto-x
pinchtab text | grep -oP 'R\$ \d+,\d+'
```

### 5. Geração de Relatórios
```bash
# Exportar dashboard como PDF
pinchtab nav http://localhost:5173/vendas
pinchtab pdf -o relatorio-vendas.pdf
```


## Integração com o Projeto

### 1. Substituir MCP Playwright

#### Antes (MCP Playwright)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

#### Depois (PinchTab)
```bash
# Instalar PinchTab
curl -fsSL https://pinchtab.com/install.sh | bash

# Iniciar servidor (em background)
pinchtab &

# Usar via HTTP API (sem MCP)
curl http://localhost:9867/health
```

### 2. Criar Scripts de Automação

#### Script: `scripts/test-dashboard.sh`
```bash
#!/bin/bash

# Testar dashboard de vendas
echo "🧪 Testando Dashboard de Vendas..."

# Navegar
pinchtab nav http://localhost:5173/vendas

# Aguardar carregamento
sleep 2

# Verificar elementos
SNAPSHOT=$(pinchtab snap -i -c)
echo "$SNAPSHOT" | grep "Dashboard de Vendas" && echo "✅ Dashboard carregado"

# Extrair texto
TEXT=$(pinchtab text)
echo "$TEXT" | grep "R\$ 224,40" && echo "✅ Receita exibida"
echo "$TEXT" | grep "São Paulo" && echo "✅ Distribuição por estado funcionando"

# Screenshot
pinchtab ss -o dashboard-test.jpg
echo "✅ Screenshot salvo: dashboard-test.jpg"
```

#### Script: `scripts/sync-bling.sh`
```bash
#!/bin/bash

# Sincronizar produtos do Bling
echo "🔄 Sincronizando produtos do Bling..."

# Login
pinchtab nav https://bling.com.br/login
pinchtab fill e1 "$BLING_USER"
pinchtab fill e2 "$BLING_PASS"
pinchtab click e3

# Aguardar
sleep 3

# Navegar para produtos
pinchtab nav https://bling.com.br/produtos

# Extrair dados
pinchtab text > /tmp/bling-produtos.txt

# Processar dados
cat /tmp/bling-produtos.txt | grep "SKU" | while read line; do
  echo "Produto: $line"
done

echo "✅ Sincronização concluída"
```


### 3. Integração com N8N

#### Workflow: Monitorar Pedidos do Mercado Livre

```json
{
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 15}]
        }
      }
    },
    {
      "name": "PinchTab - Login ML",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:9867/instances/launch",
        "jsonParameters": true,
        "options": {
          "bodyContentType": "json"
        },
        "bodyParametersJson": "{\"name\":\"ml\",\"mode\":\"headless\"}"
      }
    },
    {
      "name": "PinchTab - Abrir Tab",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "=http://localhost:9867/instances/{{$json.id}}/tabs/open",
        "jsonParameters": true,
        "bodyParametersJson": "{\"url\":\"https://mercadolivre.com.br/vendas\"}"
      }
    },
    {
      "name": "PinchTab - Extrair Pedidos",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "=http://localhost:9867/tabs/{{$json.tabId}}/text"
      }
    },
    {
      "name": "Processar Pedidos",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const text = $input.item.json.text;\nconst pedidos = text.match(/Pedido #\\d+/g);\nreturn pedidos.map(p => ({json: {pedido: p}}));"
      }
    },
    {
      "name": "Supabase - Inserir",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "table": "bling_orders"
      }
    }
  ]
}
```


## Segurança

### Configuração Recomendada

#### 1. Token de Autenticação
```bash
# Definir token de acesso
export PINCHTAB_TOKEN="seu-token-secreto-aqui"

# Iniciar com token
pinchtab
```

#### 2. Bind Local (Padrão)
```bash
# PinchTab já usa 127.0.0.1 por padrão
# Apenas localhost pode acessar
```

#### 3. Configuração Avançada
```json
{
  "server": {
    "bind": "127.0.0.1",
    "port": 9867,
    "token": "seu-token-secreto"
  },
  "security": {
    "idpi": true,
    "allowedDomains": [
      "localhost",
      "127.0.0.1",
      "bling.com.br",
      "mercadolivre.com.br"
    ]
  }
}
```

### Boas Práticas

1. **Nunca exponha PinchTab publicamente** - Use apenas em localhost
2. **Use token de autenticação** - Proteja contra acesso não autorizado
3. **Limite domínios permitidos** - Configure IDPI com whitelist
4. **Monitore sessões** - Revise cookies e dados armazenados
5. **Use contas de teste** - Não use contas de produção inicialmente
6. **Backup de perfis** - Faça backup de `~/.config/pinchtab/`


## Migração do MCP Playwright para PinchTab

### Passo 1: Instalar PinchTab
```bash
# macOS/Linux
curl -fsSL https://pinchtab.com/install.sh | bash

# Verificar instalação
pinchtab --version
```

### Passo 2: Iniciar Servidor
```bash
# Iniciar em background
pinchtab &

# Ou usar Docker
docker run -d \
  --name pinchtab \
  -p 127.0.0.1:9867:9867 \
  -v pinchtab-data:/data \
  --shm-size=2g \
  pinchtab/pinchtab
```

### Passo 3: Testar Conexão
```bash
# Health check
curl http://localhost:9867/health

# Criar instância de teste
curl -X POST http://localhost:9867/instances/launch \
  -H "Content-Type: application/json" \
  -d '{"name":"test","mode":"headless"}'
```

### Passo 4: Atualizar Scripts de Teste

#### Antes (Playwright MCP)
```typescript
// Usar MCP do Playwright
await mcp_playwright_browser_navigate({ url: "http://localhost:5173/vendas" });
await mcp_playwright_browser_snapshot();
await mcp_playwright_browser_click({ ref: "e5" });
```

#### Depois (PinchTab HTTP)
```bash
# Usar HTTP API diretamente
curl -X POST http://localhost:9867/instances/launch \
  -d '{"name":"test","mode":"headless"}' | jq -r '.id'

curl -X POST http://localhost:9867/instances/INST_ID/tabs/open \
  -d '{"url":"http://localhost:5173/vendas"}' | jq -r '.tabId'

curl http://localhost:9867/tabs/TAB_ID/snapshot?filter=interactive

curl -X POST http://localhost:9867/tabs/TAB_ID/action \
  -d '{"kind":"click","ref":"e5"}'
```

### Passo 5: Remover MCP Playwright (Opcional)
```bash
# Remover do mcp.json
# Antes:
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}

# Depois:
{
  "mcpServers": {}
}
```


## Limitações e Considerações

### Limitações do PinchTab

1. **Projeto Novo (2025)** - Menos maduro que Playwright
2. **Comunidade Menor** - Menos exemplos e recursos disponíveis
3. **Documentação em Evolução** - Ainda sendo expandida
4. **Menos Features** - Algumas funcionalidades avançadas do Playwright podem não estar disponíveis

### Quando Usar Playwright

- Testes E2E complexos com múltiplos navegadores (Firefox, Safari)
- Necessidade de features avançadas (network interception, service workers)
- Projeto já estabelecido com Playwright
- Equipe familiarizada com Playwright

### Quando Usar PinchTab

- ✅ Automação de tarefas repetitivas
- ✅ Scraping de dados
- ✅ Redução de custos de tokens
- ✅ Sessões persistentes necessárias
- ✅ Bypass de detecção de bots
- ✅ Ambientes com recursos limitados
- ✅ Integração simples via HTTP

## Recomendação

### Abordagem Híbrida

**Use PinchTab para:**
- Testes de dashboard (redução de custos)
- Scraping de Bling/Mercado Livre
- Monitoramento de preços
- Automação de tarefas recorrentes

**Mantenha Playwright para:**
- Testes E2E críticos
- Casos que exigem features avançadas
- Debugging complexo

### Implementação Gradual

1. **Fase 1**: Instalar e testar PinchTab em paralelo
2. **Fase 2**: Migrar testes simples (navegação, cliques)
3. **Fase 3**: Migrar scraping e automações
4. **Fase 4**: Avaliar resultados e decidir sobre migração completa


## Estimativa de Economia

### Cenário: Testes Diários do Dashboard

#### Com Playwright (Screenshots)
- **Tokens por teste**: ~10.000 tokens
- **Testes por dia**: 10
- **Total diário**: 100.000 tokens
- **Custo mensal** (Claude Sonnet): ~$15.00

#### Com PinchTab (Árvore de Acessibilidade)
- **Tokens por teste**: ~800 tokens
- **Testes por dia**: 10
- **Total diário**: 8.000 tokens
- **Custo mensal** (Claude Sonnet): ~$1.20

**Economia: $13.80/mês (92% de redução)**

### Cenário: Scraping de Produtos

#### Com Playwright
- **Tokens por página**: ~10.000 tokens
- **Páginas por dia**: 50
- **Total diário**: 500.000 tokens
- **Custo mensal**: ~$75.00

#### Com PinchTab
- **Tokens por página**: ~800 tokens
- **Páginas por dia**: 50
- **Total diário**: 40.000 tokens
- **Custo mensal**: ~$6.00

**Economia: $69.00/mês (92% de redução)**

### ROI (Return on Investment)

- **Investimento**: $0 (open source)
- **Economia mensal**: ~$82.80
- **Economia anual**: ~$993.60
- **ROI**: ∞ (investimento zero)


## Recursos Adicionais

### Documentação Oficial
- **Site**: https://pinchtab.com/
- **GitHub**: https://github.com/pinchtab/pinchtab
- **Docs**: https://pinchtab.com/docs

### Exemplos de Código
- **Python**: https://github.com/pinchtab/pinchtab/tree/main/examples/python
- **TypeScript**: https://github.com/pinchtab/pinchtab/tree/main/examples/typescript
- **Go**: https://github.com/pinchtab/pinchtab/tree/main/examples/go

### Comunidade
- **Discord**: https://discord.gg/pinchtab
- **GitHub Issues**: https://github.com/pinchtab/pinchtab/issues
- **Discussions**: https://github.com/pinchtab/pinchtab/discussions

### Comparações
- **vs Playwright**: https://pinchtab.com/docs/comparisons/playwright
- **vs Puppeteer**: https://pinchtab.com/docs/comparisons/puppeteer
- **vs Selenium**: https://pinchtab.com/docs/comparisons/selenium

## Conclusão

PinchTab oferece uma alternativa leve, eficiente e econômica ao MCP Playwright para automação de navegador. Com redução de até 13x no uso de tokens, sessões persistentes e stealth mode nativo, é ideal para:

- ✅ Testes automatizados do dashboard
- ✅ Scraping de dados do Bling/Mercado Livre
- ✅ Monitoramento de preços
- ✅ Automação de tarefas recorrentes
- ✅ Redução de custos de API

A migração pode ser feita gradualmente, mantendo Playwright para casos críticos enquanto PinchTab assume tarefas mais simples e repetitivas.

**Próximos Passos:**
1. Instalar PinchTab: `curl -fsSL https://pinchtab.com/install.sh | bash`
2. Testar com dashboard local: `pinchtab nav http://localhost:5173/vendas`
3. Criar scripts de automação em `scripts/`
4. Integrar com N8N workflows
5. Monitorar economia de tokens

---

**Data**: 2026-03-11  
**Status**: ✅ Documentação Completa  
**Autor**: Kiro AI Assistant  
**Referências**: [PinchTab GitHub](https://github.com/pinchtab/pinchtab), [Context7 Docs](https://context7.com/pinchtab/pinchtab)
