# Solução para label_state null no n8n

## Problema

O webhook do n8n estava enviando `label_state` como `null` para o Supabase, mesmo tendo o valor correto "RJ" disponível no JSON do Bling.

### Causa
O n8n estava mapeando incorretamente:
```javascript
label_state: {{ $('Buscar Detalhes do Pedido').item.json.data.transporte.etiqueta.uf }}
```

Mas retornava `null` porque o caminho estava incorreto ou o valor não estava sendo acessado corretamente.

## Solução Implementada

### 1. Trigger Automático no Banco de Dados
Criamos um trigger que extrai automaticamente a UF do campo `raw_data` quando `label_state` está null, vazio ou inválido.

**Função SQL**:
```sql
CREATE OR REPLACE FUNCTION extract_uf_from_raw_data()
RETURNS TRIGGER AS $$
DECLARE
  extracted_uf TEXT;
BEGIN
  IF (NEW.label_state IS NULL OR NEW.label_state = '' OR LENGTH(NEW.label_state) > 2) 
     AND NEW.raw_data IS NOT NULL THEN
    
    BEGIN
      -- raw_data é JSONB mas contém string JSON, precisa fazer double parsing
      extracted_uf := (NEW.raw_data->>0)::jsonb->'transporte'->'etiqueta'->>'uf';
      
      IF extracted_uf IS NOT NULL AND LENGTH(extracted_uf) = 2 THEN
        NEW.label_state := extracted_uf;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**:
```sql
CREATE TRIGGER trigger_extract_uf_from_raw_data
  BEFORE INSERT OR UPDATE
  ON bling_orders
  FOR EACH ROW
  EXECUTE FUNCTION extract_uf_from_raw_data();
```

### 2. Como Funciona

1. **n8n envia dados** → `label_state: null`
2. **Trigger detecta** → `label_state` está null
3. **Extrai do raw_data** → `(raw_data->>0)::jsonb->'transporte'->'etiqueta'->>'uf'`
4. **Atualiza automaticamente** → `label_state: "RJ"`

### 3. Benefícios

- ✅ Não precisa corrigir o n8n
- ✅ Funciona automaticamente para todos os pedidos
- ✅ Retroativo (corrige registros antigos)
- ✅ Robusto (trata erros de parsing)

## Correção Opcional no n8n

Se quiser corrigir o mapeamento no n8n para evitar o processamento extra:

### Estrutura do raw_data
O `raw_data` no Supabase é um JSONB que contém uma string JSON:
```json
{
  "transporte": {
    "etiqueta": {
      "uf": "RJ",
      "cep": "23570080",
      "municipio": "Rio de Janeiro",
      "bairro": "Santa Cruz"
    }
  }
}
```

### Mapeamento Correto no n8n

**Opção 1: Usar o mesmo caminho que funciona para label_city**
```javascript
// Se label_city funciona assim:
label_city: {{ $('Buscar Detalhes do Pedido').item.json.data.transporte.etiqueta.municipio }}

// Então label_state deve ser:
label_state: {{ $('Buscar Detalhes do Pedido').item.json.data.transporte.etiqueta.uf }}
```

**Opção 2: Verificar se o nó está retornando os dados corretamente**
- Adicionar um nó "Edit Fields" antes do Supabase
- Mapear explicitamente: `uf` → `label_state`
- Verificar no preview se o valor aparece

**Opção 3: Deixar como está**
- O trigger já resolve automaticamente
- Não precisa mudar nada no n8n
- Funciona perfeitamente

## Teste

### Antes
```sql
label_state: null
label_city: "Rio de Janeiro"
```

### Depois (com trigger)
```sql
label_state: "RJ"
label_city: "Rio de Janeiro"
```

### Resultado no Frontend
- ✅ Distribuição por Estado mostra "RJ - Rio de Janeiro"
- ✅ Percentual calculado corretamente
- ✅ Badge com sigla do estado
- ✅ Barra de progresso visual

## Observações

1. **Formato do raw_data**: É um JSONB que contém uma string JSON, por isso precisa de double parsing: `(raw_data->>0)::jsonb`

2. **Validação**: O trigger só atualiza se o UF tiver exatamente 2 caracteres (sigla válida)

3. **Performance**: O trigger executa antes do INSERT/UPDATE, não afeta performance

4. **Manutenção**: Se a estrutura do JSON do Bling mudar, basta atualizar a função

## Recomendação

**Deixar como está!** O trigger resolve o problema de forma elegante e automática, sem precisar mexer no n8n. Qualquer pedido novo ou atualizado terá o `label_state` extraído automaticamente do `raw_data`.
