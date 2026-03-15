/**
 * Fix: Add delay in Atualizar Lojas2 PUT loop to avoid 429
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const node = workflow.nodes.find(n => n.name === 'Atualizar Lojas2');

if (!node) {
  console.error('❌ Node Atualizar Lojas2 not found!');
  process.exit(1);
}

node.parameters.jsCode = `const token = $('Get Valid Token2').item.json.access_token;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const salePrice = $('Webhook2').item.json.body.sellingPrice
  ? Number($('Webhook2').item.json.body.sellingPrice)
  : null;

// Helper: sleep function
function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

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

// PUT each loja with delay to avoid 429
for (var i = 0; i < lojas.length; i++) {
  var loja = lojas[i];
  if (!loja.id) continue;
  
  // Add 400ms delay between requests
  if (i > 0) {
    await sleep(400);
  }
  
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

return [{ json: { lojasAtualizadas: lojas.length } }];`;

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('✅ Atualizar Lojas2 updated with 400ms delay between PUT requests');
