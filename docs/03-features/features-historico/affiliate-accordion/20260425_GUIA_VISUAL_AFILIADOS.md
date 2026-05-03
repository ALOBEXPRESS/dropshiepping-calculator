# Guia Visual - Accordion de Afiliados

## Como Usar o Novo Accordion de Afiliados

### Passo 1: Abrir Detalhes do Pedido

1. Vá para o **Dashboard de Vendas**
2. Localize o **Gráfico de Relatório de Receitas**
3. **Clique em qualquer barra** do gráfico

```
┌────────────────────────────────────────┐
│  Relatório de Receitas                 │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                  │
│  │  │ │  │ │  │ │  │  ← Clique aqui  │
│  │  │ │  │ │  │ │  │                  │
│  └──┘ └──┘ └──┘ └──┘                  │
│  Jan  Fev  Mar  Abr                    │
└────────────────────────────────────────┘
```

### Passo 2: Localizar o Accordion de Afiliados

O dialog de detalhes será aberto. Role até encontrar o accordion **"AFILIADOS"**:

```
┌─────────────────────────────────────────────┐
│ 📦 Detalhes do Pedido #12345                │
├─────────────────────────────────────────────┤
│ Cliente: João Silva                         │
│ Marketplace: Shopee                         │
│ Valor: R$ 150,00                            │
├─────────────────────────────────────────────┤
│                                             │
│ 💰 Preço de venda          R$ 150,00       │
│                                             │
│ 📦 Custo do Produto       -R$ 80,00        │
│                                             │
│ 🛒 Custo Marketplace      -R$ 30,00        │
│                                             │
│ 👥 AFILIADOS ▼            ← NOVO!          │
│                                             │
│ 💵 Lucro Real: R$ 40,00                    │
└─────────────────────────────────────────────┘
```

### Passo 3: Expandir o Accordion

Clique no header **"AFILIADOS"** para expandir:

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▼                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Selecionar Influenciador      [+ Novo]  │ │
│ │                                          │ │
│ │ ┌────────────────────────────────────┐  │ │
│ │ │ Sem influenciador              ▼  │  │ │
│ │ └────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Opção A: Selecionar Influenciador Existente

1. Clique no **dropdown**
2. Selecione um influenciador da lista
3. A associação é salva **automaticamente**

```
┌─────────────────────────────────────────────┐
│ Selecionar Influenciador      [+ Novo]      │
│ ┌────────────────────────────────────────┐  │
│ │ Sem influenciador                  ▼  │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ Clique aqui ↓                               │
│ ┌────────────────────────────────────────┐  │
│ │ ○ Sem influenciador                    │  │
│ │ ● Maria Silva @maria_silva             │  │
│ │ ○ João Santos @joao_santos             │  │
│ │ ○ Ana Costa @ana_costa                 │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Resultado**: Toast de sucesso aparece e o nome do afiliado é exibido no header:

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS (Maria Silva) ▼                │
│                                             │
│ ✅ Afiliado associado com sucesso!         │
└─────────────────────────────────────────────┘
```

### Opção B: Criar Novo Influenciador

1. Clique no botão **"+ Novo"**
2. Preencha o formulário inline
3. Clique em **"Salvar e Associar"**

```
┌─────────────────────────────────────────────┐
│ Selecionar Influenciador      [+ Novo] ←   │
│                                             │
│ Clique aqui para criar novo                 │
└─────────────────────────────────────────────┘

↓ Formulário aparece ↓

┌─────────────────────────────────────────────┐
│ Novo Influenciador                      [×] │
│                                             │
│ Nome *                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Maria Silva                             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 📷 Instagram    📱 TikTok      🐦 X        │
│ ┌─────────┐    ┌─────────┐   ┌─────────┐  │
│ │@maria   │    │@maria   │   │@maria   │  │
│ └─────────┘    └─────────┘   └─────────┘  │
│                                             │
│ Comissão (%) *                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 10.5                                  % │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  + Salvar e Associar                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Campos**:
- **Nome** (obrigatório): Nome do influenciador
- **Instagram** (opcional): Usuário sem @
- **TikTok** (opcional): Usuário sem @
- **X/Twitter** (opcional): Usuário sem @
- **Comissão %** (obrigatório): Percentual de comissão (0-100)

**Resultado**: Novo influenciador é criado e automaticamente associado ao pedido:

```
✅ Influenciador "Maria Silva" criado com sucesso!
✅ Afiliado associado com sucesso!
```

### Remover Associação

Para remover a associação com um afiliado:

1. Abra o dropdown
2. Selecione **"Sem influenciador"**

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS (Maria Silva) ▼                │
│ ┌─────────────────────────────────────────┐ │
│ │ ● Sem influenciador                    │ │ ← Selecione
│ │ ○ Maria Silva @maria_silva             │ │
│ │ ○ João Santos @joao_santos             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

↓

✅ Afiliado removido
```

## Validações

### ❌ Nome vazio
```
┌─────────────────────────────────────────────┐
│ Nome *                                      │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │ ← Vazio
│ └─────────────────────────────────────────┘ │
│                                             │
│ ❌ O nome é obrigatório.                   │
└─────────────────────────────────────────────┘
```

### ❌ Comissão inválida
```
┌─────────────────────────────────────────────┐
│ Comissão (%) *                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 150                                   % │ │ ← > 100
│ └─────────────────────────────────────────┘ │
│                                             │
│ ❌ A comissão deve ser um número entre     │
│    0 e 100.                                 │
└─────────────────────────────────────────────┘
```

## Estados do Accordion

### 🔒 Fechado (sem afiliado)
```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▼                              │
└─────────────────────────────────────────────┘
```

### 🔒 Fechado (com afiliado)
```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS (Maria Silva) ▼                │
└─────────────────────────────────────────────┘
```

### 🔓 Aberto (carregando)
```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▲                              │
│ ┌─────────────────────────────────────────┐ │
│ │         ⏳ Carregando...                │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 🔓 Aberto (seletor)
```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▲                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Selecionar Influenciador      [+ Novo]  │ │
│ │ ┌────────────────────────────────────┐  │ │
│ │ │ Maria Silva @maria_silva       ▼  │  │ │
│ │ └────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 🔓 Aberto (formulário)
```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▲                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Novo Influenciador                  [×] │ │
│ │ [Formulário completo aqui]              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Dicas

💡 **Lazy Loading**: Os influenciadores só são carregados quando você abre o accordion pela primeira vez

💡 **Auto-save**: Não precisa clicar em "Salvar" ao selecionar um influenciador existente

💡 **Marketplace Link**: Novos influenciadores são automaticamente vinculados ao marketplace do pedido

💡 **Redes Sociais**: O @ é adicionado automaticamente, você só precisa digitar o usuário

💡 **Comissão**: Use ponto ou vírgula para decimais (10.5 ou 10,5)

## Troubleshooting

### ❌ "Coluna affiliate_id não existe na tabela orders"

**Causa**: A migração do banco de dados não foi executada

**Solução**: Execute o script SQL:
```bash
psql -h <host> -U <user> -d <database> -f docs/migrations/add_affiliate_id_to_orders.sql
```

### ❌ Lista de influenciadores vazia

**Causa**: Nenhum influenciador cadastrado na organização

**Solução**: Crie um novo influenciador usando o botão "+ Novo"

### ❌ Erro ao salvar

**Causa**: Problema de conexão ou permissões

**Solução**: 
1. Verifique sua conexão com a internet
2. Verifique se você tem permissão para editar pedidos
3. Tente novamente

## Benefícios

✅ **Rastreamento**: Saiba qual afiliado trouxe cada venda  
✅ **Comissões**: Calcule comissões automaticamente  
✅ **Amostras Grátis**: Identifique influenciadores que receberam amostras  
✅ **Análise**: Futuramente, relatórios de performance por afiliado  
✅ **Produtividade**: Crie influenciadores sem sair do fluxo de trabalho
