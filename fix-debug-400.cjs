const fs = require('fs');
const w = JSON.parse(fs.readFileSync('src/hooks/n8n/workflows/Bling Atualizar Produto.json', 'utf8'));

const putNode = w.nodes.find(function(n) { return n.name === 'PUT Produto Bling2'; });

putNode.parameters.jsCode = `const sku = $('Webhook2').item.json.body.sku;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const token = $('Get Valid Token2').item.json.access_token;
const det = $('GET Detalhes Produto2').item.json.data;

const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

// Check if GET Variacoes2 was executed (only for formato=V)
let variacoesData = [];
let hasVariacoes = false;
try {
  variacoesData = $('GET Variacoes2').item.json.variacoes || [];
  hasVariacoes = variacoesData.length > 0;
} catch(e) {
  console.log('GET Variacoes2 nao executado - produto sem variacoes');
}

// For formato=V with variations, include variacoes[] in PUT body
if (det.formato === 'V' && hasVariacoes) {
  if (salePrice) {
    variacoesData.forEach(function(v) { v.preco = salePrice; });
    console.log('Atualizando preco de', variacoesData.length, 'variacoes para', salePrice);
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
      body.midia = { imagens: { internas: paiInternas, externas: paiExternas } };
    }
  }

  // Log body completo para debug
  console.log('PUT body (formato=V):', JSON.stringify(body).substring(0, 2000));

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
    console.log('Bling PUT success:', JSON.stringify(result).substring(0, 500));
    return [{ json: { success: true, sku: sku, variacoesAtualizadas: variacoesData.length } }];
  } catch (err) {
    const errMsg = err.message || String(err);
    // Capturar resposta completa do erro
    let errData = '';
    if (err.response) {
      errData = JSON.stringify(err.response.data || err.response.body || {});
    } else if (err.cause) {
      errData = JSON.stringify(err.cause);
    }
    console.log('Bling PUT 400 error body:', errData);
    console.log('Bling PUT error msg:', errMsg);
    return [{ json: { error: errMsg, detail: errData, sku: sku } }];
  }
}

// For formato=S (simple product)
if (!salePrice) {
  console.log('Sem sellingPrice no webhook, pulando PUT produto');
  return [{ json: { skipped: true, reason: 'no_sale_price', sku: sku } }];
}

const formato = det.formato || 'S';
const body = {
  nome: det.nome,
  codigo: det.codigo || sku,
  preco: salePrice,
  tipo: det.tipo || 'P',
  situacao: det.situacao || 'A',
  formato: formato,
  unidade: det.unidade || 'UN'
};

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
    body.midia = { imagens: { internas: paiInternas, externas: paiExternas } };
  }
}

console.log('PUT body (formato=S):', JSON.stringify(body).substring(0, 1000));

try {
  await this.helpers.httpRequest({
    method: 'PUT',
    url: 'https://api.bling.com.br/Api/v3/produtos/' + produtoId,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: body
  });
  console.log('Bling PUT produto simples success');
} catch (err) {
  const errMsg = err.message || String(err);
  let errData = '';
  if (err.response) {
    errData = JSON.stringify(err.response.data || err.response.body || {});
  }
  console.log('Bling PUT simples error:', errMsg, errData);
  return [{ json: { error: errMsg, detail: errData, sku: sku } }];
}

return [{ json: { success: true, sku: sku, salePrice: salePrice, formato: formato } }];`;

fs.writeFileSync('src/hooks/n8n/workflows/Bling Atualizar Produto.json', JSON.stringify(w, null, 2), 'utf8');
console.log('✅ Logs de debug adicionados ao PUT Produto Bling2');
console.log('Reimporte, teste e me mande o output do nó PUT Produto Bling2 (aba JSON)');
