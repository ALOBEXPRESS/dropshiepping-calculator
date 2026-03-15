#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Corrigindo fluxo completo do workflow...');

// O problema é que o fluxo tem dois caminhos:
// 1. Produto COM variações: IF Tem Variacoes2 (true) → GET Variacoes2 → Wait Apos PUT Produto2 → PUT Produto Bling2 → ...
// 2. Produto SEM variações: IF Tem Variacoes2 (false) → Upsert Produto Supabase2

// Mas ambos os caminhos precisam convergir para GET Lojas2

// Vamos reorganizar o fluxo:
// IF Tem Variacoes2
//   ├─ (true) → GET Variacoes2 → (passa dados para PUT Produto Bling2)
//   └─ (false) → (pula GET Variacoes2)
// 
// Ambos convergem em → Wait Apos PUT Produto2 → PUT Produto Bling2 → Wait Apos PUT Produto2 → Upsert Variacoes Supabase → GET Lojas2

console.log('\n1. Atualizando conexões do IF Tem Variacoes2...');

// IF Tem Variacoes2 deve ter dois caminhos:
// - true: GET Variacoes2
// - false: Wait Apos PUT Produto2 (pula GET Variacoes2)
workflow.connections['IF Tem Variacoes2'] = {
  main: [
    [{ node: 'GET Variacoes2', type: 'main', index: 0 }],  // true
    [{ node: 'Wait Apos PUT Produto2', type: 'main', index: 0 }]  // false
  ]
};
console.log('✓ IF Tem Variacoes2 → true: GET Variacoes2, false: Wait Apos PUT Produto2');

// GET Variacoes2 → Wait Apos PUT Produto2
workflow.connections['GET Variacoes2'] = {
  main: [[{ node: 'Wait Apos PUT Produto2', type: 'main', index: 0 }]]
};
console.log('✓ GET Variacoes2 → Wait Apos PUT Produto2');

// Wait Apos PUT Produto2 → PUT Produto Bling2
workflow.connections['Wait Apos PUT Produto2'] = {
  main: [[{ node: 'PUT Produto Bling2', type: 'main', index: 0 }]]
};
console.log('✓ Wait Apos PUT Produto2 → PUT Produto Bling2');

// PUT Produto Bling2 → Wait Apos PUT Produto2 (segundo wait)
// Precisamos renomear o segundo Wait para evitar confusão
const waitAposPutProduto2 = workflow.nodes.find(n => 
  n.name === 'Wait Apos PUT Produto2' && 
  n.id === '9f5864c7-7d94-4b36-8573-bf831fc4ff11'
);
if (waitAposPutProduto2) {
  waitAposPutProduto2.name = 'Wait Apos PUT Produto Bling2';
  console.log('✓ Renomeado segundo Wait para: Wait Apos PUT Produto Bling2');
}

workflow.connections['PUT Produto Bling2'] = {
  main: [[{ node: 'Wait Apos PUT Produto Bling2', type: 'main', index: 0 }]]
};
console.log('✓ PUT Produto Bling2 → Wait Apos PUT Produto Bling2');

// Wait Apos PUT Produto Bling2 → Upsert Variacoes Supabase
workflow.connections['Wait Apos PUT Produto Bling2'] = {
  main: [[{ node: 'Upsert Variacoes Supabase', type: 'main', index: 0 }]]
};
console.log('✓ Wait Apos PUT Produto Bling2 → Upsert Variacoes Supabase');

// Upsert Variacoes Supabase → GET Lojas2
workflow.connections['Upsert Variacoes Supabase'] = {
  main: [[{ node: 'GET Lojas2', type: 'main', index: 0 }]]
};
console.log('✓ Upsert Variacoes Supabase → GET Lojas2');

console.log('\n2. Modificando PUT Produto Bling2 para lidar com ambos os caminhos...');

// PUT Produto Bling2 precisa verificar se GET Variacoes2 foi executado
const putProdutoNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (putProdutoNode) {
  putProdutoNode.parameters.jsCode = `const sku = $('Webhook2').item.json.body.sku;
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
  // Update price for all variations if webhook provided sellingPrice
  if (salePrice) {
    variacoesData.forEach(function(v) {
      v.preco = salePrice;
    });
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
      console.log('Imagens pai - internas:', paiInternas.length, '- externas:', paiExternas.length);
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
    console.log('Bling PUT produto pai success - variacoes atualizadas:', variacoesData.length);
    return [{ json: { success: true, sku: sku, variacoesAtualizadas: variacoesData.length, blingResponse: result.data } }];
  } catch (err) {
    const errMsg = err.message || String(err);
    const errData = err.response ? JSON.stringify(err.response.data || {}) : '';
    console.log('Bling PUT produto pai error:', errMsg, errData);
    return [{ json: { error: errMsg, detail: errData, sku: sku } }];
  }
}

// For formato=S (simple product) or formato=V without variations data
if (!salePrice) {
  console.log('Sem sellingPrice no webhook, pulando PUT produto');
  return [{ json: { skipped: true, reason: 'no_sale_price', sku: sku } }];
}

const formato = det.formato || 'S';
console.log('formato:', formato, '| salePrice:', salePrice);

const body = {
  nome: det.nome,
  codigo: det.codigo || sku,
  preco: salePrice,
  tipo: det.tipo || 'P',
  situacao: det.situacao || 'A',
  formato: formato,
  unidade: det.unidade || 'UN'
};

// Preserve images on simple product
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
    console.log('Imagens produto simples - internas:', paiInternas.length, '- externas:', paiExternas.length);
  }
}

console.log('PUT produto simples preco:', salePrice, 'formato:', formato);

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
  const errData = err.response ? JSON.stringify(err.response.data || {}) : '';
  console.log('Bling PUT produto simples error:', errMsg, errData);
  return [{ json: { error: errMsg, detail: errData, sku: sku } }];
}

return [{ json: { success: true, sku: sku, salePrice: salePrice, formato: formato } }];`;
  
  console.log('✓ PUT Produto Bling2 atualizado para lidar com ambos os caminhos');
}

// Salvar workflow modificado
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('\n✅ Fluxo corrigido com sucesso!');
console.log('\nFluxo atualizado:');
console.log('IF Tem Variacoes2');
console.log('  ├─ (true) → GET Variacoes2 → Wait Apos PUT Produto2');
console.log('  └─ (false) → Wait Apos PUT Produto2');
console.log('Wait Apos PUT Produto2 → PUT Produto Bling2');
console.log('PUT Produto Bling2 → Wait Apos PUT Produto Bling2');
console.log('Wait Apos PUT Produto Bling2 → Upsert Variacoes Supabase');
console.log('Upsert Variacoes Supabase → GET Lojas2');
console.log('GET Lojas2 → ... (resto do fluxo)');
