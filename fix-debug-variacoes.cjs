const fs = require('fs');

const workflowPath = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Find GET Variacoes2 node
const getVariacoesNode = workflow.nodes.find(n => n.name === 'GET Variacoes2');
if (!getVariacoesNode) {
  console.error('Node GET Variacoes2 not found');
  process.exit(1);
}

// Add more detailed logging
getVariacoesNode.parameters.jsCode = `const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;
const variacoes = det.variacoes || [];

console.log('=== DEBUG GET VARIACOES2 ===');
console.log('Produto formato:', det.formato);
console.log('det.variacoes existe?', det.variacoes ? 'SIM' : 'NAO');
console.log('Total variacoes encontradas:', variacoes.length);
console.log('Variacoes array:', JSON.stringify(variacoes).substring(0, 200));

if (variacoes.length === 0) {
  console.log('AVISO: Array de variacoes vazio - produto pode nao ter variacoes ou GET Detalhes falhou');
  return [{ json: { variacoes: [] } }];
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg';
const baseUrl = 'https://oensqhjnxwpcuanozske.supabase.co/rest/v1';

// Fetch all variation images from Supabase in one query
const variacoesBlingIds = variacoes.map(function(v) { return v.id; }).join(',');
console.log('Buscando imagens para bling_ids:', variacoesBlingIds);

let supabaseImages = {};
try {
  const sbResp = await this.helpers.httpRequest({
    method: 'GET',
    url: baseUrl + '/product_variations?bling_id=in.(' + variacoesBlingIds + ')&select=bling_id,image_url',
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey
    }
  });
  // Build map: bling_id -> image_url
  if (sbResp && Array.isArray(sbResp)) {
    sbResp.forEach(function(row) {
      if (row.bling_id && row.image_url) {
        supabaseImages[row.bling_id] = row.image_url;
      }
    });
  }
  console.log('Imagens do Supabase carregadas:', Object.keys(supabaseImages).length);
  console.log('Mapa de imagens:', JSON.stringify(supabaseImages));
} catch(e) {
  console.log('Erro ao buscar imagens do Supabase (continuando):', e.message);
}

// Build variation array with images from Supabase
const variacoesCompletas = [];
for (var i = 0; i < variacoes.length; i++) {
  var v = variacoes[i];

  // Rate limit: 400ms between Bling requests
  if (i > 0) {
    await sleep(400);
  }

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

    const varForPut = {
      id: varFull.id,
      nome: varFull.nome,
      codigo: varFull.codigo,
      preco: varFull.preco,
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

    // CRITICAL: Use image from Supabase, not from Bling
    const imageUrl = supabaseImages[varFull.id];
    if (imageUrl) {
      varForPut.midia = {
        imagens: {
          externas: [{ link: imageUrl }]
        }
      };
      console.log('Variacao', varFull.codigo, '- imagem do Supabase:', imageUrl.substring(0, 60));
    } else {
      console.log('Variacao', varFull.codigo, '- SEM imagem no Supabase');
    }

    variacoesCompletas.push(varForPut);
    console.log('Variacao', i + 1, '/', variacoes.length, 'processada:', varFull.codigo);
  } catch(e) {
    console.log('Error fetching variacao', v.id, ':', e.message);
  }
}

console.log('Array de variacoes construido:', variacoesCompletas.length, 'itens');
return [{ json: { variacoes: variacoesCompletas } }];`;

// Find PUT Produto Bling2 node and add better error logging
const putProdutoNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (putProdutoNode) {
  // Add detailed error logging at the beginning
  const originalCode = putProdutoNode.parameters.jsCode;
  
  // Insert debug logging at the start
  const debugPrefix = `const sku = $('Webhook2').item.json.body.sku;
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
if (det.formato === 'V' && hasVariacoes) {
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

  putProdutoNode.parameters.jsCode = debugPrefix;
  console.log('✅ PUT Produto Bling2 atualizado com debug detalhado');
}

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('✅ Workflow atualizado com debug completo');
