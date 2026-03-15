const fs = require('fs');

const workflowPath = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Find PUT Produto Bling2 node
const putProdutoNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (!putProdutoNode) {
  console.error('Node PUT Produto Bling2 not found');
  process.exit(1);
}

// CRITICAL FIX: Do NOT update parent product if variacoes array is empty
// This prevents Bling from unlinking variations
putProdutoNode.parameters.jsCode = `const sku = $('Webhook2').item.json.body.sku;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const token = $('Get Valid Token2').item.json.access_token;
const det = $('GET Detalhes Produto2').item.json.data;

console.log('=== DEBUG PUT PRODUTO BLING2 ===');
console.log('SKU:', sku);
console.log('Produto ID:', produtoId);
console.log('Formato:', det.formato);

const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

console.log('Sale Price:', salePrice);

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// Check if GET Variacoes2 was executed
let variacoesData = [];
let hasVariacoes = false;
try {
  variacoesData = $('GET Variacoes2').item.json.variacoes || [];
  hasVariacoes = variacoesData.length > 0;
  console.log('Variacoes data length:', variacoesData.length);
  console.log('Has variacoes:', hasVariacoes);
} catch(e) {
  console.log('GET Variacoes2 nao executado - produto sem variacoes');
}

// ─── formato=V ────────────────────────────────────────────────────────────────
if (det.formato === 'V') {
  // CRITICAL: If formato=V but no variations found, DO NOT update parent
  // This prevents Bling from unlinking existing variations
  if (!hasVariacoes) {
    console.log('ERRO CRITICO: Produto formato=V mas variacoes array vazio!');
    console.log('NAO vou atualizar o produto pai para evitar desvincular variacoes');
    return [{ json: { error: 'Produto com variacoes mas array vazio - update cancelado para proteger variacoes', sku: sku } }];
  }

  console.log('BRANCH: Produto com variacoes');
  if (salePrice) {
    variacoesData.forEach(function(v) { v.preco = salePrice; });
    console.log('Preco atualizado para', salePrice, 'em', variacoesData.length, 'variacoes');
  }

  // Step 1: PUT parent - variacoes array with NO midia (Bling ignores midia inside variacoes[])
  const variacoesSemMidia = variacoesData.map(function(v) {
    return {
      id: v.id,
      nome: v.nome,
      codigo: v.codigo,
      preco: v.preco,
      tipo: v.tipo || 'P',
      situacao: v.situacao || 'A',
      formato: 'S',
      unidade: v.unidade || 'UN',
      variacao: v.variacao
    };
  });

  const parentBody = {
    nome: det.nome,
    codigo: det.codigo || sku,
    tipo: det.tipo || 'P',
    situacao: det.situacao || 'A',
    formato: 'V',
    unidade: det.unidade || 'UN',
    variacoes: variacoesSemMidia
  };

  // Parent midia
  if (det.midia && det.midia.imagens) {
    var paiBlock = {};
    var paiHas = false;
    if (det.midia.imagens.internas && det.midia.imagens.internas.length > 0) {
      paiBlock.internas = det.midia.imagens.internas.map(function(img) { return { id: img.id }; });
      paiHas = true;
    }
    if (det.midia.imagens.externas && det.midia.imagens.externas.length > 0) {
      paiBlock.externas = det.midia.imagens.externas.map(function(img) { return { link: img.link }; });
      paiHas = true;
    }
    if (paiHas) { parentBody.midia = { imagens: paiBlock }; }
  }

  console.log('Parent body:', JSON.stringify(parentBody).substring(0, 300));

  try {
    await this.helpers.httpRequest({
      method: 'PUT',
      url: 'https://api.bling.com.br/Api/v3/produtos/' + produtoId,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: parentBody
    });
    console.log('PUT parent OK');
  } catch (err) {
    const errData = err.response ? JSON.stringify(err.response.data || {}) : err.message;
    console.log('PUT parent ERRO:', errData);
    console.log('PUT parent ERRO stack:', err.stack);
    return [{ json: { error: err.message, detail: errData, sku: sku } }];
  }

  // Step 2: PUT each variation individually WITH midia
  var ok = 0;
  for (var i = 0; i < variacoesData.length; i++) {
    var v = variacoesData[i];
    if (i > 0) { await sleep(400); }

    var varBody = {
      nome: v.nome,
      codigo: v.codigo,
      preco: v.preco,
      tipo: v.tipo || 'P',
      situacao: v.situacao || 'A',
      formato: 'S',
      unidade: v.unidade || 'UN',
      variacao: v.variacao
    };

    if (v.midia) { varBody.midia = v.midia; }

    try {
      await this.helpers.httpRequest({
        method: 'PUT',
        url: 'https://api.bling.com.br/Api/v3/produtos/' + v.id,
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: varBody
      });
      ok++;
      console.log('PUT variacao OK:', v.codigo, '- preco:', v.preco);
    } catch (err) {
      const errData = err.response ? JSON.stringify(err.response.data || {}) : err.message;
      console.log('PUT variacao ERRO:', v.codigo, errData);
    }
  }

  console.log('Total variacoes atualizadas:', ok, '/', variacoesData.length);
  return [{ json: { success: true, updated: ok, total: variacoesData.length, sku: sku } }];
}

// ─── formato=S (produto simples) ──────────────────────────────────────────────
console.log('BRANCH: Produto simples (formato=S)');
const simpleBody = {
  nome: det.nome,
  codigo: det.codigo || sku,
  tipo: det.tipo || 'P',
  situacao: det.situacao || 'A',
  formato: 'S',
  unidade: det.unidade || 'UN'
};

if (salePrice) { simpleBody.preco = salePrice; }

// Preserve midia for simple products
if (det.midia && det.midia.imagens) {
  var simpleBlock = {};
  var simpleHas = false;
  if (det.midia.imagens.internas && det.midia.imagens.internas.length > 0) {
    simpleBlock.internas = det.midia.imagens.internas.map(function(img) { return { id: img.id }; });
    simpleHas = true;
  }
  if (det.midia.imagens.externas && det.midia.imagens.externas.length > 0) {
    simpleBlock.externas = det.midia.imagens.externas.map(function(img) { return { link: img.link }; });
    simpleHas = true;
  }
  if (simpleHas) { simpleBody.midia = { imagens: simpleBlock }; }
}

console.log('Simple body:', JSON.stringify(simpleBody).substring(0, 300));

try {
  await this.helpers.httpRequest({
    method: 'PUT',
    url: 'https://api.bling.com.br/Api/v3/produtos/' + produtoId,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: simpleBody
  });
  console.log('PUT produto simples OK');
  return [{ json: { success: true, sku: sku } }];
} catch (err) {
  const errData = err.response ? JSON.stringify(err.response.data || {}) : err.message;
  console.log('PUT produto simples ERRO:', errData);
  console.log('PUT produto simples ERRO stack:', err.stack);
  return [{ json: { error: err.message, detail: errData, sku: sku } }];
}`;

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('✅ PUT Produto Bling2 corrigido - agora protege contra desvinculacao');
console.log('\nMudança crítica:');
console.log('- Se formato=V mas variacoes array vazio → CANCELA update do produto pai');
console.log('- Isso evita que o Bling desvincule as variações existentes');
console.log('\nPróximos passos:');
console.log('1. Reimporte o workflow no n8n');
console.log('2. As variações não serão mais desvinculadas!');
