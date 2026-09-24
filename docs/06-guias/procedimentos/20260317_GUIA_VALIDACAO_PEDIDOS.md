# 🔍 Guia de Validação de Pedidos - Dados Faltantes para NF

## 🎯 Objetivo

Detectar pedidos com dados incompletos que impedem a emissão de Nota Fiscal e permitir correção manual.

---

## 📋 Campos Obrigatórios para Emitir NF

### Cliente
- ✅ CPF ou CNPJ
- ✅ Nome completo
- ✅ Tipo de pessoa (F ou J)

### Endereço de Entrega
- ✅ Logradouro (rua/avenida)
- ✅ Número
- ✅ Bairro
- ✅ Cidade
- ✅ Estado (UF)
- ✅ CEP

### Pedido
- ✅ Pelo menos 1 item
- ✅ Valor total > 0
- ✅ Data do pedido válida

---

## 🔧 Implementação no n8n

### 1. Adicionar Nó "Validar Dados para NF"

**Posição:** Entre "Buscar Detalhes do Pedido" e "Mapear Canal de Venda"

**Tipo:** Code (JavaScript)

**Código:**

```javascript
// Validar dados obrigatórios para NF
const orderData = $input.item.json.data;

// Lista de campos obrigatórios
const requiredFields = {
  // Cliente
  'CPF/CNPJ': orderData.contato?.numeroDocumento,
  'Nome do Cliente': orderData.contato?.nome,
  
  // Endereço
  'Endereço': orderData.transporte?.etiqueta?.endereco,
  'Número': orderData.transporte?.etiqueta?.numero,
  'Cidade': orderData.transporte?.etiqueta?.municipio,
  'Estado': orderData.transporte?.etiqueta?.uf,
  'CEP': orderData.transporte?.etiqueta?.cep,
  'Bairro': orderData.transporte?.etiqueta?.bairro,
  
  // Produtos
  'Itens do Pedido': orderData.itens?.length > 0,
  
  // Valores
  'Valor Total': orderData.total > 0
};

// Verificar campos faltantes
const missingFields = [];
for (const [field, value] of Object.entries(requiredFields)) {
  if (!value || value === '' || value === '0000-00-00' || value === 0) {
    missingFields.push(field);
  }
}

// Se tiver campos faltantes
if (missingFields.length > 0) {
  return {
    json: {
      ...orderData,
      validation_status: 'incomplete',
      missing_fields: missingFields,
      requires_manual_review: true,
      validation_message: `⚠️ Campos faltantes: ${missingFields.join(', ')}`
    }
  };
}

// Se tudo OK
return {
  json: {
    ...orderData,
    validation_status: 'complete',
    missing_fields: [],
    requires_manual_review: false,
    validation_message: '✅ Pedido completo'
  }
};
```

---

### 2. Atualizar Nó "Inserir Pedido"

Adicione estes campos no nó "Inserir Pedido":

| Campo | Valor |
|-------|-------|
| `validation_status` | `{{ $('Validar Dados para NF').item.json.validation_status }}` |
| `missing_fields` | `{{ JSON.stringify($('Validar Dados para NF').item.json.missing_fields) }}` |
| `requires_manual_review` | `{{ $('Validar Dados para NF').item.json.requires_manual_review }}` |
| `validation_message` | `{{ $('Validar Dados para NF').item.json.validation_message }}` |

---

### 3. Adicionar Nó "Notificar Pedido Incompleto" (Opcional)

**Tipo:** IF (Condicional)

**Condição:**
- Campo: `{{ $('Validar Dados para NF').item.json.requires_manual_review }}`
- Operador: `equals`
- Valor: `true`

**Se TRUE → Enviar Notificação:**

Você pode escolher:

#### Opção A: Email (HTTP Request)
```json
{
  "to": "empresaalob@gmail.com",
  "subject": "⚠️ Pedido #{{ $json.numero }} precisa de revisão",
  "body": "Pedido do Bling precisa de dados adicionais:\n\nPedido: #{{ $json.numero }}\nCliente: {{ $json.contato.nome }}\nCampos faltantes: {{ $json.missing_fields.join(', ') }}\n\nAcesse o Supabase para corrigir."
}
```

#### Opção B: Webhook/Slack/Discord
```json
{
  "text": "⚠️ Pedido #{{ $json.numero }} precisa de revisão",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Pedido:* #{{ $json.numero }}\n*Cliente:* {{ $json.contato.nome }}\n*Campos faltantes:* {{ $json.missing_fields.join(', ') }}"
      }
    }
  ]
}
```

#### Opção C: Criar Task no Supabase
Criar registro em uma tabela `pending_reviews`:

```sql
INSERT INTO pending_reviews (
  order_id,
  bling_order_id,
  missing_fields,
  status,
  created_at
) VALUES (
  '{{ $json.id }}',
  {{ $json.numero }},
  ARRAY[{{ $json.missing_fields.join(',') }}],
  'pending',
  NOW()
);
```

---

## 📊 Consultar Pedidos que Precisam Revisão

### Query SQL:

```sql
-- Pedidos incompletos
SELECT 
  bling_order_id,
  order_number,
  marketplace_order_number,
  contact_name,
  validation_status,
  missing_fields,
  validation_message,
  created_at
FROM bling_orders
WHERE requires_manual_review = true
  AND validation_status = 'incomplete'
ORDER BY created_at DESC;
```

### Criar View no Supabase:

```sql
CREATE OR REPLACE VIEW pending_order_reviews AS
SELECT 
  bo.id,
  bo.bling_order_id,
  bo.order_number,
  bo.marketplace_order_number,
  bo.contact_name,
  bo.contact_document,
  bo.total_amount,
  bo.validation_status,
  bo.missing_fields,
  bo.validation_message,
  bo.label_address,
  bo.label_city,
  bo.label_state,
  bo.label_zip,
  sc.marketplace,
  sc.account_holder,
  bo.created_at
FROM bling_orders bo
JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.requires_manual_review = true
  AND bo.validation_status = 'incomplete'
ORDER BY bo.created_at DESC;
```

---

## 🔄 Fluxo Completo com Validação

```
1. Webhook Bling
2. Buscar Token
3. Buscar Detalhes do Pedido
4. [NOVO] Validar Dados para NF
5. Mapear Canal de Venda
6. Registrar Log de Sucesso
7. Preparar Dados do Pedido
8. Buscar Canal
9. Inserir Pedido (com campos de validação)
10. [NOVO] IF: Precisa Revisão?
    ├─ SIM → Notificar (Email/Slack/Task)
    └─ NÃO → Continuar normal
```

---

## ✏️ Como Corrigir Pedidos Incompletos

### Opção 1: Editar no Supabase (Recomendado)

1. Acesse o Supabase
2. Vá na tabela `bling_orders`
3. Filtre por `requires_manual_review = true`
4. Edite os campos faltantes:
   - `contact_document` (CPF/CNPJ)
   - `label_address`, `label_number`, `label_city`, etc
5. Atualize:
   - `validation_status` → `reviewed`
   - `requires_manual_review` → `false`
   - `reviewed_at` → `NOW()`
   - `reviewed_by` → seu user_id

### Opção 2: Editar no Bling

1. Acesse o Bling
2. Vá em Pedidos de Venda
3. Busque pelo número do pedido
4. Edite os dados faltantes
5. O webhook `order.updated` vai sincronizar automaticamente

### Opção 3: Interface Personalizada

Crie uma página na sua aplicação para:
- Listar pedidos incompletos
- Formulário para preencher dados faltantes
- Botão "Salvar e Marcar como Revisado"

---

## 📱 Dashboard de Pedidos Pendentes

### Criar Componente React:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PendingOrder {
  id: string;
  order_number: number;
  contact_name: string;
  missing_fields: string[];
  validation_message: string;
  created_at: string;
}

export function PendingOrdersWidget() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  async function loadPendingOrders() {
    const { data } = await supabase
      .from('pending_order_reviews')
      .select('*')
      .limit(10);
    
    setOrders(data || []);
  }

  return (
    <div className="pending-orders-widget">
      <h3>⚠️ Pedidos Pendentes de Revisão ({orders.length})</h3>
      
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h4>Pedido #{order.order_number}</h4>
          <p>Cliente: {order.contact_name}</p>
          <p>Campos faltantes: {order.missing_fields.join(', ')}</p>
          <button onClick={() => editOrder(order.id)}>
            Editar
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔔 Notificações Automáticas

### Email Diário com Resumo:

Crie um workflow no n8n que roda 1x por dia:

```
1. Schedule (9h da manhã)
2. Buscar pedidos pendentes (Supabase)
3. IF: Tem pedidos pendentes?
   ├─ SIM → Enviar email com lista
   └─ NÃO → Não fazer nada
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar campos de validação na tabela `bling_orders`
- [ ] Adicionar nó "Validar Dados para NF" no workflow
- [ ] Atualizar nó "Inserir Pedido" com campos de validação
- [ ] Adicionar nó de notificação (email/slack/task)
- [ ] Criar view `pending_order_reviews` no Supabase
- [ ] Criar interface para edição de pedidos incompletos
- [ ] Configurar notificações automáticas
- [ ] Testar com pedido incompleto

---

## 🚨 Exemplos de Pedidos Incompletos

### Caso 1: Sem CPF
```json
{
  "contato": {
    "nome": "João Silva",
    "numeroDocumento": "" // ← FALTANDO
  }
}
```

### Caso 2: Endereço Incompleto
```json
{
  "transporte": {
    "etiqueta": {
      "endereco": "Rua ABC",
      "numero": "", // ← FALTANDO
      "bairro": "", // ← FALTANDO
      "cep": "12345-678"
    }
  }
}
```

### Caso 3: Sem Itens
```json
{
  "itens": [] // ← VAZIO
}
```

---

**Desenvolvido por:** Jonatan Renan  
**Data:** 21 de Fevereiro de 2026  
**Versão:** 3.0 (Com Validação)

**Alob Express © 2026**
