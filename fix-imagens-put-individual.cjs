/**
 * Fix: Images are lost because Bling ignores midia block inside variacoes[] array
 * in the parent PUT. The correct approach is:
 * 1. PUT parent product WITHOUT midia in variacoes (just price/basic fields)
 * 2. After PUT parent succeeds, PUT each variation individually to restore images
 * 
 * This updates PUT Produto Bling2 to do both steps.
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

// Check if GET Variacoes2 was executed (only for formato=V)
let variacoesData = [];
let hasVariacoes = false;
try {
  variacoesData = $('GET Variacoes2').item.json.variacoes || [];
  hasVariacoes = variacoesData.length > 0;
} catch(e) {
  console.log('GET Variacoes2 nao executado - produto sem variacoes');
}

// ─── formato=V: PUT parent with variacoes (price only, no midia in variacoes) ──
if (det.formato === 'V' && hasVariacoes) {
  if (salePrice) {
    variacoesData.forEach(function(v) { v.preco = salePrice; });
    console.log('Atualizando preco de', variacoesData.length, 'variacoes para', salePrice);
  }

  // Build variacoes array WITHOUT midia (Bling ignores midia inside variacoes[] in parent PUT)
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

  // Build parent body - include parent midia if exists
  const body = {
    nome: det.nome,
    codigo: det.codigo || sku,
    tipo: det.tipo || 'P',
    situacao: det.situacao || 'A',
    formato: 'V',
    unidade: det.unidade || 'UN',
    variacoes: variacoesSemMidia
  };

  // Parent product midia
  if (det.midia && det.midia.imagens) {
    var paiImagensBlock = {};
    var paiHasImages = false;
    if (det.midia.imagens.internas && det.midia.imagens.internas.length > 0) {
      paiImagensBlock.internas = det.midia.imagens.internas.map(function(img) { return { id: img.id }; });
      paiHasImages = true;
    }
    if (det.midia.imagens.externas && det.midia.imagens.externas.length > 0) {
      paiImagensBlock.externas = det.midia.imagens.externas.map(function(img) { return { link: img.link }; });
      paiHasImages = true;
    }
    if (paiHasImages) {
      body.midia = { imagens: paiImagensBlock };
    }
  }

  console.log('PUT body (formato=V):', JSON.stringify(body).substring(0, 1000));

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
    console.log('Bling PUT parent success');
  } catch (err) {
    const errMsg = err.message || String(err);
    let errData = err.response ? JSON.stringify(err.response.data || {}) : '';
    console.log('Bling PUT parent error:', errMsg, errData);
    return [{ json: { error: errMsg, detail: errData, sku: sku } }];
  }

  // ─── Step 2: PUT each variation individually to restore images ──────────────
  console.log('Atualizando imagens de', variacoesData.length, 'variacoes individualmente...');
  var variacoesAtualizadas = 0;

  for (var i = 0; i < variacoesData.length; i++) {
    var v = variacoesData[i];

    // Rate limit: 400ms between requests
    if (i > 0) {
      await sleep(400);
    }

    // Build individual variation PUT body
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

    // Include midia only if variation has images
    if (v.midia && v.midia.imagens) {
      var varImagensBlock = {};
      var varHasImages = false;
      if (v.midia.imagens.internas && v.midia.imagens.internas.length > 0) {
        varImagensBlock.internas = v.midia.imagens.internas;
        varHasImages = true;
      }
      if (v.midia.imagens.externas && v.midia.imagens.externas.length > 0) {
        varImagensBlock.externas = v.midia.imagens.externas;
        varHasImages = true;
      }
      if (varHasImages) {
        varBody.midia = { imagens: varImagensBlock };
        console.log('Variacao', v.codigo, '- enviando midia com', 
          (varImagensBlock.externas ? varImagensBlock.externas.length : 0), 'externas');
      }
    } else {
      console.log('Variacao', v.codigo, '- sem midia, pulando midia block');
    }

    try {
      await this.helpers.httpRequest({
        method: 'PUT',
        url: 'https://api.bling.com.br/Api/v3/produtos/' + v.id,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: varBody
      });
      variacoesAtualizadas++;
      console.log('PUT variacao individual success:', v.codigo);
    } catch (err) {
      const errMsg = err.message || String(err);
      let errData = err.response ? JSON.stringify(err.response.data || {}) : '';
      console.log('PUT variacao individual error:', v.codigo, errMsg, errData);
    }
  }

  return [{ json: { success: true, sku: sku, variacoesAtualizadas: variacoesAtualizadas } }];
}

// ─── formato=S: simple product ────────────────────────────────────────────────
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
  var paiImagensBlock = {};
  var paiHasImages = false;
  if (det.midia.imagens.internas && det.midia.imagens.internas.length > 0) {
    paiImagensBlock.internas = det.midia.imagens.internas.map(function(img) { return { id: img.id }; });
    paiHasImages = true;
  }
  if (det.midia.imagens.externas && det.midia.imagens.externas.length > 0) {
    paiImagensBlock.externas = det.midia.imagens.externas.map(function(img) { return { link: img.link }; });
    paiHasImages = true;
  }
  if (paiHasImages) {
    body.midia = { imagens: paiImagensBlock };
  }
}

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
  let errData = err.response ? JSON.stringify(err.response.data || {}) : '';
  console.log('Bling PUT simples error:', errMsg, errData);
  return [{ json: { error: errMsg, detail: errData, sku: sku } }];
}

return [{ json: { success: true, sku: sku, salePrice: salePrice, formato: formato } }];`;

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('✅ PUT Produto Bling2 updated:');
console.log('   Step 1: PUT parent with variacoes (no midia in variacoes array)');
console.log('   Step 2: PUT each variation individually WITH midia to restore images');
