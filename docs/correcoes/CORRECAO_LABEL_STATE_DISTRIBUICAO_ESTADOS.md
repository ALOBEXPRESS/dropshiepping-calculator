# Correção do Campo label_state e Distribuição por Estado

## Resumo
Corrigido problema onde o campo `label_state` na tabela `bling_orders` estava recebendo o CEP em vez da sigla do estado (UF), impedindo a exibição correta da distribuição geográfica de pedidos.

## Problema Identificado

### Sintoma
- Componente "Distribuição por Estado" mostrava "Nenhum dado de localização disponível"
- Mesmo com pedidos processados e dados de endereço no Bling

### Causa Raiz
O webhook do n8n estava mapeando incorretamente os dados do Bling:
- Campo `label_state` recebia: "23570080" (CEP)
- Deveria receber: "RJ" (sigla do estado)

### Estrutura Correta no raw_data
```json
{
  "transporte": {
    "etiqueta": {
      "uf": "RJ",           // ← Campo correto
      "cep": "23570080",
      "municipio": "Rio de Janeiro",
      "bairro": "Santa Cruz"
    }
  }
}
```

## Solução Implementada

### 1. Migração SQL
**Arquivo**: `supabase/migrations/fix_label_state_from_raw_data.sql`

**Ações**:
1. Atualização de registros existentes
2. Criação de função para extrair UF do raw_data
3. Criação de trigger automático
4. Documentação inline

### 2. Função extract_uf_from_raw_data()
```sql
CREATE OR REPLACE FUNCTION extract_uf_from_raw_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_data IS NOT NULL THEN
    -- Extrair UF do caminho correto
    NEW.label_state := NEW.raw_data::jsonb->'transporte'->'etiqueta'->>'uf';
    
    -- Fallback para caminho alternativo
    IF NEW.label_state IS NULL OR NEW.label_state = '' THEN
      NEW.label_state := NEW.raw_data::jsonb->'etiqueta'->>'uf';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Trigger Automático
```sql
CREATE TRIGGER trigger_extract_uf_from_raw_data
  BEFORE INSERT OR UPDATE OF raw_data
  ON bling_orders
  FOR EACH ROW
  EXECUTE FUNCTION extract_uf_from_raw_data();
```

**Comportamento**:
- Dispara automaticamente quando `raw_data` é inserido ou atualizado
- Extrai a UF do caminho correto no JSON
- Atualiza `label_state` antes de salvar no banco

### 4. Correção Manual do Registro Existente
```sql
UPDATE bling_orders
SET label_state = 'RJ'
WHERE id = '527d3d1a-c450-4222-bec0-d5e2c2ebe023';
```

## Resultado

### Antes
```
label_state: "23570080" (CEP incorreto)
label_city: "Rio de Janeiro"
label_zip: "23570080"
```

### Depois
```
label_state: "RJ" (UF correto)
label_city: "Rio de Janeiro"
label_zip: "23570080"
```

### Distribuição por Estado - Funcionando
- ✅ Exibe "Rio de Janeiro"
- ✅ Mostra "1 pedido"
- ✅ Percentual: 100.0%
- ✅ Badge com "RJ"
- ✅ Barra de progresso visual

## Benefícios

### 1. Automação Completa
- Novos pedidos do Bling terão UF extraída automaticamente
- Não requer intervenção manual
- Webhook do n8n pode continuar enviando raw_data completo

### 2. Robustez
- Fallback para caminhos alternativos no JSON
- Não quebra se estrutura do Bling mudar levemente
- Trigger garante consistência dos dados

### 3. Análise Geográfica
- Dashboard de vendas mostra distribuição real por estado
- Facilita identificação de regiões com mais vendas
- Suporta decisões de marketing regional

## Testes Realizados

### Teste com Playwright
- ✅ Navegação para página de Vendas
- ✅ Componente "Distribuição por Estado" carregado
- ✅ Dados exibidos corretamente: "RJ - Rio de Janeiro - 1 pedido"
- ✅ Console limpo (0 erros)

### Verificação no Banco
```sql
-- Antes
label_state: "23570080"

-- Depois
label_state: "RJ"
```

## Próximos Passos

### Para o Webhook n8n (Opcional)
Se quiser corrigir o mapeamento no webhook:
```javascript
// No nó de processamento do Bling
label_state: $json.transporte.etiqueta.uf  // Em vez de cep
```

Mas não é necessário, pois o trigger já resolve automaticamente.

### Monitoramento
- Verificar se novos pedidos do Bling têm UF correta
- Acompanhar distribuição geográfica no dashboard
- Validar se trigger funciona em todos os casos

## Arquivos Modificados

1. `supabase/migrations/fix_label_state_from_raw_data.sql` (criado)
   - Função extract_uf_from_raw_data()
   - Trigger trigger_extract_uf_from_raw_data
   - UPDATE para corrigir registro existente

## Observações

- Trigger funciona para INSERT e UPDATE
- Não afeta performance (executa antes do save)
- Compatível com estrutura atual do Bling
- Preparado para mudanças futuras na API

## Commit
```bash
git add supabase/migrations/fix_label_state_from_raw_data.sql docs/CORRECAO_LABEL_STATE_DISTRIBUICAO_ESTADOS.md
git commit -m "fix: corrigido mapeamento de label_state para exibir UF corretamente na distribuição por estado"
```
