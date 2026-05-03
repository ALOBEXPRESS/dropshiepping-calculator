# Estratégia de Correção: Variações Bling - Análise Definitiva

## Problema Identificado

Após múltiplas tentativas de correção e consulta à documentação oficial da API Bling v3, identificamos que o problema fundamental está na **abordagem de atualização**:

### Comportamento Atual (INCORRETO)
1. GET produto pai (formato=V) → retorna lista de variações
2. GET cada variação individualmente → obtém imagens completas
3. **PUT em cada variação individual** → Bling interpreta como "converter variação em produto simples"
4. Resultado: variações se desvinculam do pai e perdem imagens

### Por Que Falha

A API Bling v3 **não suporta atualização individual de variações via PUT /produtos/{idVariacao}**. Quando você faz PUT em um produto que é uma variação:

- Se o body **não contém** `variacao.produtoPai` → Bling desvincula a variação
- Se o body **contém** `midia.imagens.internas: []` vazio → Bling deleta as imagens
- Se o body **omite** o bloco `midia` → Bling **também** pode deletar as imagens (comportamento inconsistente)

## Solução Correta (Baseada na Documentação Oficial)

### Opção 1: Atualizar Apenas o Produto Pai (RECOMENDADO)

Para produtos com `formato=V`, **NÃO faça PUT nas variações individuais**. Em vez disso:

1. **GET** `/produtos/{idProdutoPai}` → obtém produto pai com array `variacoes[]`
2. **PUT** `/produtos/{idProdutoPai}` com body contendo:
   - Campos do produto pai que deseja atualizar
   - Array `variacoes[]` completo com TODAS as variações
   - Cada variação no array deve conter:
     - `id` (obrigatório para atualizar variação existente)
     - `preco` (novo preço da variação)
     - `variacao.nome` (ex: "Cor:Vermelho")
     - `variacao.ordem`
     - `variacao.produtoPai.id` (ID do produto pai)
     - `midia.imagens.internas` (array de `{id}` para preservar imagens)
     - `midia.imagens.externas` (array de URLs)

### Exemplo de Request Body Correto

```json
{
  "nome": "Camiseta Básica",
  "codigo": "CAM001",
  "tipo": "P",
  "situacao": "A",
  "formato": "V",
  "variacoes": [
    {
      "id": 123456,
      "nome": "Camiseta Básica - Cor:Vermelho",
      "codigo": "CAM001-VERM",
      "preco": 49.90,
      "tipo": "P",
      "situacao": "A",
      "formato": "S",
      "variacao": {
        "nome": "Cor:Vermelho",
        "ordem": 1,
        "produtoPai": { "id": 789012 }
      },
      "midia": {
        "imagens": {
          "internas": [
            { "id": 111 },
            { "id": 222 }
          ],
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
      "variacao": {
        "nome": "Cor:Azul",
        "ordem": 2,
        "produtoPai": { "id": 789012 }
      },
      "midia": {
        "imagens": {
          "internas": [
            { "id": 333 }
          ],
          "externas": []
        }
      }
    }
  ]
}
```

### Opção 2: Atualizar Preço por Loja (ALTERNATIVA)

Se o objetivo é apenas atualizar preços de venda por canal:

1. **GET** `/produtos/lojas?idProduto={idVariacao}` para cada variação
2. **PUT** `/produtos/lojas/{idProdutoLoja}` com `{"preco": novoPreco}`

Esta abordagem **não toca** no produto/variação em si, apenas nos preços por loja.

## Implementação no Workflow N8N

### Mudanças Necessárias

#### 1. Remover Nós de PUT Individual de Variações

- **DELETAR**: `Upsert Variacao Supabase2` (node que faz PUT individual)
- **DELETAR**: `Loop Variacoes2` (loop que itera variações para PUT)
- **DELETAR**: `GET Estoque Variacao2` (não é mais necessário)

#### 2. Modificar `GET Variacoes2` para Construir Array Completo

```javascript
const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;
const variacoes = det.variacoes || [];

if (variacoes.length === 0) {
  return [{ json: { variacoes: [] } }];
}

// Fetch each variation individually to get full midia
const variacoesCompletas = [];
for (var i = 0; i < variacoes.length; i++) {
  var v = variacoes[i];
  try {
    const varResp = await this.helpers.httpRequest({
      method: 'GET',
      url: 'https://api.bling.com.br/Api/v3/produtos/' + v.id,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });
    const varFull = varResp.data || v;
    
    // Build variation object for PUT body
    const varForPut = {
      id: varFull.id,
      nome: varFull.nome,
      codigo: varFull.codigo,
      preco: varFull.preco, // Will be updated by webhook price if provided
      tipo: varFull.tipo || 'P',
      situacao: varFull.situacao || 'A',
      formato: 'S',
      unidade: varFull.unidade || 'UN',
      variacao: {
        nome: varFull.variacao ? varFull.variacao.nome : '',
        ordem: varFull.variacao ? varFull.variacao.ordem : i,
        produtoPai: { id: det.id }
      }
    };
    
    // Preserve images
    if (varFull.midia && varFull.midia.imagens) {
      var internas = [];
      var externas = [];
      if (varFull.midia.imagens.internas && varFull.midia.imagens.internas.length > 0) {
        internas = varFull.midia.imagens.internas.map(function(img) { return { id: img.id }; });
      }
      if (varFull.midia.imagens.externas && varFull.midia.imagens.externas.length > 0) {
        externas = varFull.midia.imagens.externas;
      }
      if (internas.length > 0 || externas.length > 0) {
        varForPut.midia = {
          imagens: { internas: internas, externas: externas }
        };
      }
    }
    
    variacoesCompletas.push(varForPut);
  } catch(e) {
    console.log('Error fetching variacao', v.id, ':', e.message);
  }
}

return [{ json: { variacoes: variacoesCompletas } }];
```

#### 3. Modificar `PUT Produto Bling2` para Incluir Array de Variações

```javascript
const sku = $('Webhook2').item.json.body.sku;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const token = $('Get Valid Token2').item.json.access_token;
const det = $('GET Detalhes Produto2').item.json.data;

const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

// For formato=V, we MUST include variacoes[] in the PUT body
if (det.formato === 'V') {
  const variacoesData = $('GET Variacoes2').item.json.variacoes || [];
  
  if (variacoesData.length === 0) {
    console.log('Produto formato=V mas sem variacoes, pulando PUT');
    return [{ json: { skipped: true, reason: 'no_variations', sku: sku } }];
  }
  
  // Update price for all variations if webhook provided sellingPrice
  if (salePrice) {
    variacoesData.forEach(function(v) {
      v.preco = salePrice;
    });
  }
  
  const body = {
    nome: det.nome,
    codigo: det.codigo || sku,
    tipo: det.tipo || 'P',
    situacao: det.situacao || 'A',
    formato: 'V',
    unidade: det.unidade || 'UN',
    variacoes: variacoesData
  };
  
  // Preserve parent product images
  if (det.midia && det.midia.imagens) {
    var paiInternas = [];
    var paiExternas = [];
    if (det.midia.imagens.internas && det.midia.imagens.internas.length > 0) {
      paiInternas = det.midia.imagens.internas.map(function(img) { return { id: img.id }; });
    }
    if (det.midia.imagens.externas && det.midia.imagens.externas.length > 0) {
      paiExternas = det.midia.imagens.externas;
    }
    if (paiInternas.length > 0 || paiExternas.length > 0) {
      body.midia = {
        imagens: { internas: paiInternas, externas: paiExternas }
      };
    }
  }
  
  console.log('PUT produto pai formato=V com', variacoesData.length, 'variacoes');
  
  try {
    const result = await this.helpers.httpRequest({
      method: 'PUT',
      url: 'https://api.bling.com.br/Api/v3/produtos/' + produtoId,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body
    });
    console.log('Bling PUT produto pai success:', JSON.stringify(result.data));
    return [{ json: { success: true, sku: sku, variacoesAtualizadas: variacoesData.length } }];
  } catch (err) {
    const errMsg = err.message || String(err);
    const errData = err.response ? JSON.stringify(err.response.data || {}) : '';
    console.log('Bling PUT produto pai error:', errMsg, errData);
    return [{ json: { error: errMsg, detail: errData, sku: sku } }];
  }
}

// For formato=S (simple product), proceed with normal PUT
// ... (código existente para produtos simples)
```

#### 4. Atualizar Supabase Após PUT Bem-Sucedido

Após o PUT do produto pai com variações, fazer um loop para atualizar cada variação no Supabase:

```javascript
// In a new node after PUT Produto Bling2
const variacoesData = $('GET Variacoes2').item.json.variacoes || [];
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const baseUrl = 'https://oensqhjnxwpcuanozske.supabase.co/rest/v1';

for (var i = 0; i < variacoesData.length; i++) {
  var v = variacoesData[i];
  try {
    await this.helpers.httpRequest({
      method: 'PATCH',
      url: baseUrl + '/products_variations_bling?bling_id=eq.' + v.id,
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: {
        sale_price: v.preco,
        updated_at: new Date().toISOString()
      },
      ignoreHttpStatusErrors: true
    });
  } catch(e) {
    console.log('Supabase variacao PATCH error:', e.message);
  }
}

return [{ json: { success: true, variacoesAtualizadas: variacoesData.length } }];
```

## Fluxo Correto do Workflow

```
Webhook2
  ↓
Pegar Access Token2
  ↓
GET Produto por SKU2
  ↓
IF Produto Encontrado2 (true)
  ↓
GET Detalhes Produto2
  ↓
Wait Apos Detalhes2
  ↓
GET Estoque2
  ↓
GET Fornecedores2
  ↓
Code: Identificar Fornecedor2
  ↓
IF Fornecedor Encontrado2 (true)
  ↓
PUT Fornecedor2
  ↓
Wait Apos PUT Fornecedor2
  ↓
IF Tem Variacoes2 (formato === 'V')
  ↓ (true)
  GET Variacoes2 (constrói array completo)
  ↓
PUT Produto Bling2 (com array variacoes[])
  ↓
Wait Apos PUT Produto2
  ↓
Upsert Variacoes Supabase (loop para atualizar cada variação no Supabase)
  ↓
GET Lojas2
  ↓
Loop Lojas2
  ↓
PUT Loja2
  ↓
Wait Apos PUT Loja2
  ↓
Upsert Produto Supabase2
  ↓
Respond to Webhook2
```

## Próximos Passos

1. **Criar novo arquivo JSON** com a estrutura correta
2. **Testar** com produto que tem 4 variações com imagens
3. **Validar** que:
   - Variações mantêm vínculo com produto pai
   - Imagens das variações são preservadas
   - Preços são atualizados corretamente
   - Supabase reflete as mudanças

## Referências

- Bling API v3 Documentation: https://developer.bling.com.br/
- Context7 Library: `/websites/developer_bling_br_build_assets_openapi-3cwcog4t_json`
- Response structure: `ProdutosResponse_POST_PUT` com `data.variations.updated[]`
