# Auto-Preenchimento do Campo label_country

## Resumo
Implementado sistema automático para preencher o campo `label_country` na tabela `bling_orders` com "Brasil" por padrão, validando se há valores diferentes no `raw_data`.

## Problema Identificado

### Situação Anterior
- Campo `label_country` estava vazio em todos os pedidos
- Não havia validação ou preenchimento automático
- Dificultava análises geográficas e relatórios

### Requisito
Como operamos apenas no Brasil, todos os pedidos devem ter `label_country = "Brasil"`, exceto se houver um valor diferente no `raw_data` indicando que o pedido é de outro país.

## Solução Implementada

### 1. Função auto_fill_label_country()

**Lógica**:
```sql
1. Se label_country está vazio ou null:
   a. Tentar extrair do raw_data
   b. Se encontrou valor:
      - Se for variação de Brasil → "Brasil"
      - Se for outro país → usar valor do raw_data
   c. Se não encontrou → "Brasil" (padrão)

2. Se label_country já tem valor:
   - Normalizar variações de Brasil para "Brasil"
```

**Variações de Brasil Reconhecidas**:
- "brasil" → "Brasil"
- "Brazil" → "Brasil"
- "BR" → "Brasil"
- "br" → "Brasil"
- Qualquer combinação de maiúsculas/minúsculas

**Código SQL**:
```sql
CREATE OR REPLACE FUNCTION auto_fill_label_country()
RETURNS TRIGGER AS $$
DECLARE
  country_from_raw TEXT;
  normalized_country TEXT;
BEGIN
  IF NEW.label_country IS NULL OR TRIM(NEW.label_country) = '' THEN
    BEGIN
      country_from_raw := (NEW.raw_data->>0)::jsonb->'transporte'->'etiqueta'->>'nomePais';
      
      IF country_from_raw IS NOT NULL AND TRIM(country_from_raw) != '' THEN
        normalized_country := LOWER(TRIM(country_from_raw));
        
        IF normalized_country IN ('brasil', 'brazil', 'br') THEN
          NEW.label_country := 'Brasil';
        ELSE
          NEW.label_country := TRIM(country_from_raw);
        END IF;
      ELSE
        NEW.label_country := 'Brasil';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      NEW.label_country := 'Brasil';
    END;
  ELSE
    normalized_country := LOWER(TRIM(NEW.label_country));
    IF normalized_country IN ('brasil', 'brazil', 'br') THEN
      NEW.label_country := 'Brasil';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Trigger Automático

```sql
CREATE TRIGGER trigger_auto_fill_label_country
  BEFORE INSERT OR UPDATE
  ON bling_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_label_country();
```

**Comportamento**:
- Dispara antes de INSERT ou UPDATE
- Garante que `label_country` sempre tenha um valor
- Normaliza variações de Brasil
- Preserva valores de outros países se existirem

### 3. Atualização de Registros Existentes

```sql
UPDATE bling_orders
SET label_country = CASE
  WHEN label_country IS NULL OR TRIM(label_country) = '' THEN 'Brasil'
  WHEN LOWER(TRIM(label_country)) IN ('brasil', 'brazil', 'br') THEN 'Brasil'
  ELSE label_country
END
WHERE label_country IS NULL 
   OR TRIM(label_country) = ''
   OR LOWER(TRIM(label_country)) IN ('brasil', 'brazil', 'br');
```

## Cenários de Uso

### Cenário 1: Pedido sem país no raw_data (mais comum)
```
Input: label_country = ""
raw_data: { nomePais: "" }
Output: label_country = "Brasil"
```

### Cenário 2: Pedido com variação de Brasil
```
Input: label_country = "brazil"
Output: label_country = "Brasil"
```

### Cenário 3: Pedido de outro país (raro)
```
Input: label_country = ""
raw_data: { nomePais: "Argentina" }
Output: label_country = "Argentina"
```

### Cenário 4: n8n envia null
```
Input: label_country = null
Output: label_country = "Brasil"
```

## Resultado

### Antes
```sql
label_country: ""
label_state: "RJ"
label_city: "Rio de Janeiro"
```

### Depois
```sql
label_country: "Brasil"
label_state: "RJ"
label_city: "Rio de Janeiro"
```

### Estatísticas
```sql
Total de pedidos: 1
Com "Brasil": 1 (100%)
Vazios: 0 (0%)
Outros países: 0 (0%)
```

## Benefícios

### 1. Consistência de Dados
- Todos os pedidos têm país definido
- Formato padronizado: "Brasil" (com B maiúsculo)
- Facilita queries e relatórios

### 2. Automação Completa
- Não requer intervenção manual
- Funciona para pedidos novos e antigos
- n8n pode enviar vazio que o trigger resolve

### 3. Flexibilidade
- Suporta pedidos de outros países (se houver)
- Normaliza variações automaticamente
- Robusto contra erros de parsing

### 4. Análises Geográficas
- Facilita filtros por país
- Suporta expansão internacional futura
- Dados consistentes para dashboards

## Integração com Outros Campos

### Campos de Endereço Completos
```sql
label_name: "Alob"
label_address: "Rua Tenente Antônio Batista"
label_number: "15"
label_city: "Rio de Janeiro"
label_state: "RJ"
label_zip: "23570080"
label_neighborhood: "Santa Cruz"
label_country: "Brasil"  ← Agora preenchido!
```

## Observações

1. **Padrão Brasil**: Como operamos apenas no Brasil, o padrão é sempre "Brasil"

2. **Validação do raw_data**: Se houver um país diferente no raw_data, ele será respeitado

3. **Normalização**: Todas as variações de Brasil são convertidas para "Brasil" (padrão)

4. **Performance**: Trigger executa antes do save, não afeta performance

5. **Manutenção**: Se precisar adicionar mais variações, basta atualizar o array IN

## Testes Realizados

### Teste 1: Registro Existente
```sql
-- Antes
label_country: ""

-- Depois do UPDATE
label_country: "Brasil"
```

### Teste 2: Novo Pedido (via trigger)
```sql
-- n8n envia
label_country: null

-- Banco salva
label_country: "Brasil"
```

### Teste 3: Normalização
```sql
-- Input
label_country: "brazil"

-- Output
label_country: "Brasil"
```

## Recomendações

### Para o n8n
Não precisa corrigir! O trigger resolve automaticamente. Mas se quiser enviar o valor correto:

```javascript
label_country: "Brasil"  // Sempre fixo, já que operamos apenas no Brasil
```

### Para Expansão Internacional
Se futuramente operar em outros países:
1. O trigger já está preparado
2. Basta o Bling enviar o país correto no raw_data
3. O sistema respeitará valores diferentes de Brasil

## Migração Aplicada

**Arquivo**: `auto_fill_label_country_brasil.sql`

**Componentes**:
- Função `auto_fill_label_country()`
- Trigger `trigger_auto_fill_label_country`
- UPDATE para registros existentes
- Comentários inline

**Status**: ✅ Aplicada com sucesso via MCP Supabase
