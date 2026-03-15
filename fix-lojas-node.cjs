/**
 * Fix: Replace GET Lojas2 + Loop Lojas2 + PUT Loja2 + Wait Apos PUT Loja2
 * with a single Code node "Atualizar Lojas2" that handles everything internally
 * and always passes through to IF Tem Variacoes2.
 * 
 * Also removes Wait Apos PUT Loja2 from connections.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ─── 1. Replace GET Lojas2 node parameters with a Code node ───────────────────
// Find the node by name and replace it
const nodes = workflow.nodes;

// Remove old nodes: GET Lojas2, Loop Lojas2, PUT Loja2, Wait Apos PUT Loja2
const nodesToRemove = ['GET Lojas2', 'Loop Lojas2', 'PUT Loja2', 'Wait Apos PUT Loja2'];
workflow.nodes = nodes.filter(function(n) {
  return !nodesToRemove.includes(n.name);
});

// ─── 2. Add new "Atualizar Lojas2" Code node ──────────────────────────────────
const newNode = {
  parameters: {
    jsCode: `const token = $('Get Valid Token2').item.json.access_token;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

// GET lojas for this product
let lojas = [];
try {
  const resp = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.bling.com.br/Api/v3/produtos/lojas?idProduto=' + produtoId,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    }
  });
  lojas = (resp && resp.data) ? resp.data : [];
} catch(e) {
  console.log('GET Lojas error (ignorado):', e.message);
}

console.log('Lojas encontradas:', lojas.length);

if (lojas.length === 0 || !salePrice) {
  console.log('Sem lojas ou sem preco, pulando PUT lojas');
  return [{ json: { lojasAtualizadas: 0 } }];
}

// PUT each loja
for (var i = 0; i < lojas.length; i++) {
  var loja = lojas[i];
  if (!loja.id) continue;
  try {
    await this.helpers.httpRequest({
      method: 'PUT',
      url: 'https://api.bling.com.br/Api/v3/produtos/lojas/' + loja.id,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: { preco: salePrice }
    });
    console.log('PUT Loja success:', loja.id);
  } catch(e) {
    console.log('PUT Loja error (ignorado):', loja.id, e.message);
  }
}

return [{ json: { lojasAtualizadas: lojas.length } }];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [92224, 22112],
  id: 'atualizar-lojas-2-node',
  name: 'Atualizar Lojas2',
  onError: 'continueRegularOutput'
};

workflow.nodes.push(newNode);

// ─── 3. Fix connections ────────────────────────────────────────────────────────
const conn = workflow.connections;

// Remove old loop connections
delete conn['GET Lojas2'];
delete conn['Loop Lojas2'];
delete conn['PUT Loja2'];
delete conn['Wait Apos PUT Loja2'];

// Wait Apos PUT Fornecedor2 → Atualizar Lojas2
conn['Wait Apos PUT Fornecedor2'] = {
  main: [[{ node: 'Atualizar Lojas2', type: 'main', index: 0 }]]
};

// Wait Apos POST Fornecedor2 → Atualizar Lojas2
conn['Wait Apos POST Fornecedor2'] = {
  main: [[{ node: 'Atualizar Lojas2', type: 'main', index: 0 }]]
};

// Atualizar Lojas2 → IF Tem Variacoes2
conn['Atualizar Lojas2'] = {
  main: [[{ node: 'IF Tem Variacoes2', type: 'main', index: 0 }]]
};

// Verify
console.log('=== Verifying connections ===');
console.log('Wait Apos PUT Fornecedor2 ->', JSON.stringify(conn['Wait Apos PUT Fornecedor2']));
console.log('Wait Apos POST Fornecedor2 ->', JSON.stringify(conn['Wait Apos POST Fornecedor2']));
console.log('Atualizar Lojas2 ->', JSON.stringify(conn['Atualizar Lojas2']));
console.log('IF Tem Variacoes2 ->', JSON.stringify(conn['IF Tem Variacoes2']));
console.log('GET Variacoes2 ->', JSON.stringify(conn['GET Variacoes2']));
console.log('PUT Produto Bling2 ->', JSON.stringify(conn['PUT Produto Bling2']));

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('\n✅ Done! GET Lojas2 + Loop + PUT Loja2 replaced with Atualizar Lojas2 Code node');
