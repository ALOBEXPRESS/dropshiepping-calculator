/**
 * Fix: Add delay between variation GET requests to avoid 429 rate limit
 * Bling API rate limit: ~3 req/s = 333ms between requests
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Find GET Variacoes2 node
const node = workflow.nodes.find(n => n.name === 'GET Variacoes2');

if (!node) {
  console.error('❌ Node GET Variacoes2 not found!');
  process.exit(1);
}

// Update jsCode with delay
node.parameters.jsCode = `const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;
const variacoes = det.variacoes || [];
console.log('Total variacoes encontradas:', variacoes.length);

if (variacoes.length === 0) {
  return [{ json: { variacoes: [] } }];
}

// Helper: sleep function
function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// Fetch each variation individually to get full midia
const variacoesCompletas = [];
for (var i = 0; i < variacoes.length; i++) {
  var v = variacoes[i];
  
  // Add 400ms delay between requests to avoid 429 rate limit (Bling: ~3 req/s)
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
    console.log('Variacao', i + 1, '/', variacoes.length, 'processada:', varFull.codigo);
  } catch(e) {
    console.log('Error fetching variacao', v.id, ':', e.message);
    // Continue even on error to process remaining variations
  }
}

console.log('Array de variacoes construido:', variacoesCompletas.length, 'itens');
return [{ json: { variacoes: variacoesCompletas } }];`;

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('✅ GET Variacoes2 updated with 400ms delay between requests');
console.log('   This should prevent 429 rate limit errors from Bling API');
