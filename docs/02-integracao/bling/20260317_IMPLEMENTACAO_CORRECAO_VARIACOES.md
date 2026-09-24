# Implementação da Correção de Variações - Bling Atualizar Produto

## Status: ✅ IMPLEMENTADO

Data: 15/03/2026

## Problema Resolvido

Variações se desvinculavam do produto pai e perdiam imagens após atualização via workflow n8n.

## Causa Raiz

A abordagem anterior fazia PUT individual em cada variação (`PUT /produtos/{idVariacao}`), o que causava:
1. Bling interpretava como "converter variação em produto simples"
2. Perda do vínculo `variacao.produtoPai`
3. Deleção de imagens quando `midia.imagens.internas: []` era enviado vazio

## Solução Implementada

### Abordagem Correta (Baseada na Documentação Oficial Bling API v3)

Para produtos com `formato=V`, fazer **um único PUT no produto pai** incluindo o array completo de `variacoes[]` no body.

### Mudanças Aplicadas

#### 1. GET Variacoes2 (Modificado)
- **Antes**: Retornava cada variação como item separado para loop
- **Agora**: Constrói array completo `variacoes[]` pronto para PUT
- **Estrutura de cada variação**:
  ```javascript
  {
    id: varFull.id,
    nome: varFull.nome,
    codigo: varFull.codigo,
    preco: varFull.preco,
    tipo: 'P',
    situacao: 'A',
    formato: 'S',
    unidade: 'UN',
    variacao: {
      nome: 'Cor:Vermelho',
      ordem: 0,
      produtoPai: { id: det.id }  // CRÍTICO: mantém vínculo
    },
    midia: {
      imagens: {
        internas: [{ id: 111 }, { id: 222 }],  // Preserva imagens
        externas: []
      }
    }
  }
  ```

#### 2. PUT Produto Bling2 (Modificado)
- **Antes**: Pulava PUT para `formato=V` (causava erro 400)
- **Agora**: Faz PUT no produto pai incluindo array `variacoes[]`
- **Lógica**:
  - Se `formato=V`: inclui `variacoes[]` no body
  - Se `salePrice` fornecido: atualiza preço de todas as variações
  - Preserva imagens do produto pai e de cada variação
  - Se `formato=S`: PUT normal sem array de variações

#### 3. Nós Removidos (Obsoletos)
- ❌ `Loop Variacoes2` - não é mais necessário loop individual
- ❌ `GET Estoque Variacao2` - estoque atualizado via GET inicial
- ❌ `Upsert Variacao Supabase2` - substituído por novo nó

#### 4. Novo Nó Criado
- ✅ `Upsert Variacoes Supabase` - atualiza todas as variações no Supabase após PUT bem-sucedido
- Executa loop para fazer PATCH em cada variação na tabela `products_variations_bling`
- Atualiza `sale_price` e `updated_at`

### Fluxo Atualizado

```
Webhook2
  ↓
... (token, GET produto, fornecedor) ...
  ↓
IF Tem Variacoes2 (formato === 'V')
  ↓ (true)
  GET Variacoes2 (constrói array completo)
    ↓
  Wait Apos PUT Produto2
    ↓
  PUT Produto Bling2 (com array variacoes[])  ← MUDANÇA PRINCIPAL
    ↓
  Wait Apos PUT Produto2
    ↓
  Upsert Variacoes Supabase (atualiza Supabase)  ← NOVO NÓ
    ↓
  GET Lojas2
    ↓
  ... (loop lojas, upsert produto, respond) ...
```

## Exemplo de Request Body (PUT Produto Pai)

```json
{
  "nome": "Camiseta Básica",
  "codigo": "CAM001",
  "tipo": "P",
  "situacao": "A",
  "formato": "V",
  "unidade": "UN",
  "variacoes": [
    {
      "id": 123456,
      "nome": "Camiseta Básica - Cor:Vermelho",
      "codigo": "CAM001-VERM",
      "preco": 49.90,
      "tipo": "P",
      "situacao": "A",
      "formato": "S",
      "unidade": "UN",
      "variacao": {
        "nome": "Cor:Vermelho",
        "ordem": 1,
        "produtoPai": { "id": 789012 }
      },
      "midia": {
        "imagens": {
          "internas": [{ "id": 111 }, { "id": 222 }],
          "externas": []
        }
      }
    },
    {
      "id": 123457,
      "nome": "Camiseta Básica - Cor:Azul",
      "codigo": "CAM001-AZUL",
      "preco": 49.90,
      "tipo": "P",
      "situacao": "A",
      "formato": "S",
      "unidade": "UN",
      "variacao": {
        "nome": "Cor:Azul",
        "ordem": 2,
        "produtoPai": { "id": 789012 }
      },
      "midia": {
        "imagens": {
          "internas": [{ "id": 333 }],
          "externas": []
        }
      }
    }
  ]
}
```

## Validação Esperada

Após importar o workflow no n8n e testar com produto que tem variações:

### ✅ Checklist de Sucesso
- [ ] Variações mantêm vínculo com produto pai (não se tornam produtos simples)
- [ ] Imagens das variações são preservadas
- [ ] Preço de venda é atualizado em todas as variações
- [ ] Tabela `products_variations_bling` reflete as mudanças
- [ ] Logs do n8n mostram "PUT produto pai success - variacoes atualizadas: X"

### 🔍 Como Validar no Bling
1. Acesse o produto pai no Bling
2. Verifique que todas as variações ainda aparecem na aba "Variações"
3. Confirme que cada variação tem suas imagens intactas
4. Verifique que os preços foram atualizados

### 🔍 Como Validar no Supabase
```sql
-- Verificar variações atualizadas
SELECT bling_id, sale_price, updated_at 
FROM products_variations_bling 
WHERE product_bling_id = (
  SELECT id FROM products_bling WHERE sku = 'SEU_SKU'
)
ORDER BY updated_at DESC;
```

## Próximos Passos

1. **Importar JSON no n8n**
   - Abrir n8n editor
   - Importar `src/hooks/n8n/workflows/Bling Atualizar Produto.json`
   - Ativar workflow

2. **Testar com produto real**
   - Usar produto SKU `1313aad` (4 variações com imagens)
   - Clicar em "Atualizar" no dashboard
   - Validar resultado no Bling e Supabase

3. **Monitorar logs**
   - Verificar logs do n8n para mensagens:
     - "Array de variacoes construido: X itens"
     - "PUT produto pai formato=V com X variacoes"
     - "Bling PUT produto pai success - variacoes atualizadas: X"
     - "Variacao Supabase atualizada: CODIGO - preco: VALOR"

## Referências

- Estratégia completa: `docs/bling/ESTRATEGIA_CORRECAO_VARIACOES_FINAL.md`
- Bling API v3 Docs: https://developer.bling.com.br/
- Context7 Library: `/websites/developer_bling_br_build_assets_openapi-3cwcog4t_json`
- Script de correção: `fix-variacoes-correto.cjs`

## Histórico de Tentativas

- ❌ fix2.cjs: Adicionou `variacao.produtoPai` mas fazia PUT individual
- ❌ fix3.cjs: Tentou preservar imagens com `internas` e `externas`
- ❌ fix4.cjs: GET individual de cada variação para obter `midia`
- ❌ fix5.cjs: Pulou PUT para `formato=V` (causou erro 400)
- ❌ fix-final.cjs: Condicional `midia` mas ainda PUT individual
- ❌ fix-variacoes-merge.cjs: Preservou `produtoPai` do GET pai
- ✅ **fix-variacoes-correto.cjs**: PUT único no pai com array completo

## Conclusão

A solução correta é fazer **um único PUT no produto pai** incluindo o array completo de variações. Esta é a única forma de preservar o vínculo pai-filho e as imagens das variações na API Bling v3.
