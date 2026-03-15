#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Aplicando correção definitiva para variações...');

// 1. Modificar GET Variacoes2 para construir array completo para PUT
const getVariacoesNode = workflow.nodes.find(n => n.name === 'GET Variacoes2');
if (getVariacoesNode) {
  console.log('✓ Modificando GET Variacoes2 para construir array completo');
  getVariacoesNode.parameters.jsCode = `const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;
const variacoes = det.variacoes || [];
console.log('Total variacoes encontradas:', variacoes.length);

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
    
    // Preserve images - CRITICAL: only include midia if images exist
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
        console.log('Variacao', varFull.codigo, '- internas:', internas.length, '- externas:', externas.length);
      }
    }
    
    variacoesCompletas.push(varForPut);
  } catch(e) {
    console.log('Error fetching variacao', v.id, ':', e.message);
  }
}

console.log('Array de variacoes construido:', variacoesCompletas.length, 'itens');
return [{ json: { variacoes: variacoesCompletas } }];`;
}

// 2. Modificar PUT Produto Bling2 para incluir array de variações
const putProdutoNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (putProdutoNode) {
  console.log('✓ Modificando PUT Produto Bling2 para incluir array variacoes[]');
  putProdutoNode.parameters.jsCode = `const sku = $('Webhook2').item.json.body.sku;
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

// For formato=S (simple product), proceed with normal PUT
if (!salePrice) {
  console.log('Sem sellingPrice no webhook, pulando PUT produto simples');
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
}

// 3. Remover nós obsoletos: Loop Variacoes2, GET Estoque Variacao2, Upsert Variacao Supabase2
const nodesToRemove = ['Loop Variacoes2', 'GET Estoque Variacao2', 'Upsert Variacao Supabase2'];
workflow.nodes = workflow.nodes.filter(n => {
  if (nodesToRemove.includes(n.name)) {
    console.log('✓ Removendo nó obsoleto:', n.name);
    return false;
  }
  return true;
});

// 4. Criar novo nó: Upsert Variacoes Supabase (atualiza todas as variações no Supabase após PUT bem-sucedido)
const upsertVariacoesSupabaseNode = {
  parameters: {
    jsCode: `const variacoesData = $('GET Variacoes2').item.json.variacoes || [];
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg';
const baseUrl = 'https://oensqhjnxwpcuanozske.supabase.co/rest/v1';

console.log('Atualizando', variacoesData.length, 'variacoes no Supabase');

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
    console.log('Variacao Supabase atualizada:', v.codigo, '- preco:', v.preco);
  } catch(e) {
    console.log('Supabase variacao PATCH error:', v.codigo, e.message);
  }
}

return [{ json: { success: true, variacoesAtualizadas: variacoesData.length } }];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [88848, 21392],
  id: 'upsert-variacoes-supabase-new',
  name: 'Upsert Variacoes Supabase'
};

// Adicionar o novo nó
workflow.nodes.push(upsertVariacoesSupabaseNode);
console.log('✓ Adicionado novo nó: Upsert Variacoes Supabase');

// 5. Atualizar conexões do workflow
// Remover conexões dos nós deletados
const nodesToRemoveIds = workflow.nodes
  .filter(n => nodesToRemove.includes(n.name))
  .map(n => n.name);

Object.keys(workflow.connections).forEach(nodeName => {
  if (nodesToRemoveIds.includes(nodeName)) {
    delete workflow.connections[nodeName];
  }
});

// Atualizar conexão: IF Tem Variacoes2 (true) → GET Variacoes2
if (workflow.connections['IF Tem Variacoes2']) {
  workflow.connections['IF Tem Variacoes2'].main[0] = [
    { node: 'GET Variacoes2', type: 'main', index: 0 }
  ];
  console.log('✓ Conexão atualizada: IF Tem Variacoes2 → GET Variacoes2');
}

// Atualizar conexão: GET Variacoes2 → Wait Apos PUT Produto2
workflow.connections['GET Variacoes2'] = {
  main: [[{ node: 'Wait Apos PUT Produto2', type: 'main', index: 0 }]]
};
console.log('✓ Conexão atualizada: GET Variacoes2 → Wait Apos PUT Produto2');

// Atualizar conexão: Wait Apos PUT Produto2 → Upsert Variacoes Supabase
workflow.connections['Wait Apos PUT Produto2'] = {
  main: [[{ node: 'Upsert Variacoes Supabase', type: 'main', index: 0 }]]
};
console.log('✓ Conexão atualizada: Wait Apos PUT Produto2 → Upsert Variacoes Supabase');

// Atualizar conexão: Upsert Variacoes Supabase → GET Lojas2
workflow.connections['Upsert Variacoes Supabase'] = {
  main: [[{ node: 'GET Lojas2', type: 'main', index: 0 }]]
};
console.log('✓ Conexão atualizada: Upsert Variacoes Supabase → GET Lojas2');

// Salvar workflow modificado
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('\n✅ Workflow atualizado com sucesso!');
console.log('\nResumo das mudanças:');
console.log('1. GET Variacoes2 agora constrói array completo para PUT');
console.log('2. PUT Produto Bling2 inclui array variacoes[] no body');
console.log('3. Removidos nós obsoletos: Loop Variacoes2, GET Estoque Variacao2, Upsert Variacao Supabase2');
console.log('4. Adicionado novo nó: Upsert Variacoes Supabase (atualiza Supabase após PUT)');
console.log('5. Conexões atualizadas para novo fluxo');
console.log('\nPróximo passo: Importar o JSON no n8n e testar com produto que tem variações');
