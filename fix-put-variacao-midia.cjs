/**
 * Fix: In the individual variation PUT, the midia block needs to be explicit.
 * Also adds detailed logging to debug what's being sent.
 * Key insight from GET Variacoes2 output:
 * - Variations have externas: [{ link: "..." }] 
 * - No internas
 * - produtoPai.id is the Bling parent ID (not the webhook product ID)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const putNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (!putNode) { console.error('❌ PUT Produto Bling2 not found'); process.exit(1); }

putNode.parameters.jsCode = `const sku = $('Webhook2').item.json.body.sku;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const token = $('Get Valid Token2').item.json.access_token;
const det = $('GET Detalhes Produto2').item.json.data;

const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// Check if GET Variacoes2 was executed
let variacoesData = [];
let hasVariacoes = false;
try {
  variacoesData = $('GET Variacoes2').item.json.variacoes || [];
  hasVariacoes = variacoesData.length > 0;
} catch(e) {
  console.log('GET Variacoes2 nao executado - produto sem variacoes');
}

// ─── formato=V ────────────────────────────────────────────────────────────────
if (det.formato === 'V' && hasVariacoes) {
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

    // Add midia only if variation has images - never send empty arrays
    if (v.midia && v.midia.imagens) {
      var imgBlock = {};
      var hasImg = false;
      if (v.midia.imagens.internas && v.midia.imagens.internas.length > 0) {
        imgBlock.internas = v.midia.imagens.internas.map(function(img) { return { id: img.id }; });
        hasImg = true;
      }
      if (v.midia.imagens.externas && v.midia.imagens.externas.length > 0) {
        imgBlock.externas = v.midia.imagens.externas.map(function(img) { return { link: img.link }; });
        hasImg = true;
      }
      if (hasImg) {
        varBody.midia = { imagens: imgBlock };
        console.log('Variacao', v.codigo, '- midia:', JSON.stringify(imgBlock).substring(0, 200));
      }
    }

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

  return [{ json: { success: true, sku: sku, variacoesAtualizadas: ok } }];
}

// ─── formato=S ────────────────────────────────────────────────────────────────
if (!salePrice) {
  return [{ json: { skipped: true, reason: 'no_sale_price', sku: sku } }];
}

const simpleBody = {
  nome: det.nome,
  codigo: det.codigo || sku,
  preco: salePrice,
  tipo: det.tipo || 'P',
  situacao: det.situacao || 'A',
  formato: det.formato || 'S',
  unidade: det.unidade || 'UN'
};

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
  if (paiHas) { simpleBody.midia = { imagens: paiBlock }; }
}

try {
  await this.helpers.httpRequest({
    method: 'PUT',
    url: 'https://api.bling.com.br/Api/v3/produtos/' + produtoId,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: simpleBody
  });
  console.log('PUT simples OK');
} catch (err) {
  const errData = err.response ? JSON.stringify(err.response.data || {}) : err.message;
  console.log('PUT simples ERRO:', errData);
  return [{ json: { error: err.message, detail: errData, sku: sku } }];
}

return [{ json: { success: true, sku: sku, salePrice: salePrice } }];`;

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('✅ PUT Produto Bling2 atualizado com logs detalhados e PUT individual por variação');
