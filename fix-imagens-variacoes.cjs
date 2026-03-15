/**
 * Fix: Never send empty arrays for internas/externas in midia block.
 * Bling deletes images when it receives an empty array.
 * Only include internas/externas keys if they have items.
 * Also applies same fix to PUT Produto Bling2 parent product midia.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ─── Fix GET Variacoes2 ────────────────────────────────────────────────────────
const gvNode = workflow.nodes.find(n => n.name === 'GET Variacoes2');
if (!gvNode) { console.error('❌ GET Variacoes2 not found'); process.exit(1); }

gvNode.parameters.jsCode = `const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;
const variacoes = det.variacoes || [];
console.log('Total variacoes encontradas:', variacoes.length);

if (variacoes.length === 0) {
  return [{ json: { variacoes: [] } }];
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

const variacoesCompletas = [];
for (var i = 0; i < variacoes.length; i++) {
  var v = variacoes[i];

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

    // Build midia block - NEVER send empty arrays (Bling deletes images on empty array)
    if (varFull.midia && varFull.midia.imagens) {
      var imagensBlock = {};
      var hasImages = false;

      // internas: only include if has items (empty array = delete images)
      if (varFull.midia.imagens.internas && varFull.midia.imagens.internas.length > 0) {
        imagensBlock.internas = varFull.midia.imagens.internas.map(function(img) { return { id: img.id }; });
        hasImages = true;
        console.log('Variacao', varFull.codigo, '- internas:', imagensBlock.internas.length);
      }

      // externas: only include if has items
      if (varFull.midia.imagens.externas && varFull.midia.imagens.externas.length > 0) {
        imagensBlock.externas = varFull.midia.imagens.externas.map(function(img) {
          return { link: img.link };
        });
        hasImages = true;
        console.log('Variacao', varFull.codigo, '- externas:', imagensBlock.externas.length);
      }

      if (hasImages) {
        varForPut.midia = { imagens: imagensBlock };
      }
    }

    variacoesCompletas.push(varForPut);
    console.log('Variacao', i + 1, '/', variacoes.length, 'processada:', varFull.codigo);
  } catch(e) {
    console.log('Error fetching variacao', v.id, ':', e.message);
  }
}

console.log('Array de variacoes construido:', variacoesCompletas.length, 'itens');
return [{ json: { variacoes: variacoesCompletas } }];`;

// ─── Fix PUT Produto Bling2 parent midia block ─────────────────────────────────
const putNode = workflow.nodes.find(n => n.name === 'PUT Produto Bling2');
if (!putNode) { console.error('❌ PUT Produto Bling2 not found'); process.exit(1); }

// Replace the midia building pattern in PUT Produto Bling2
// It has two midia blocks (formato=V and formato=S) - fix both
let code = putNode.parameters.jsCode;

// Replace the midia block builder pattern (appears twice - for V and S paths)
// Old pattern: builds internas/externas then checks if either has length
// New pattern: only add keys if they have items
const oldMidiaBlock = `  if (det.midia && det.midia.imagens) {
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
  }`;

const newMidiaBlock = `  if (det.midia && det.midia.imagens) {
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
  }`;

const count = (code.match(/if \(det\.midia && det\.midia\.imagens\)/g) || []).length;
console.log('Found', count, 'midia blocks in PUT Produto Bling2');

code = code.split(oldMidiaBlock).join(newMidiaBlock);
putNode.parameters.jsCode = code;

const countAfter = (code.match(/paiHasImages/g) || []).length;
console.log('Replaced', countAfter / 2, 'midia blocks');

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('\n✅ Fixed: empty arrays no longer sent in midia block');
console.log('   - internas: [] omitted (would delete images)');
console.log('   - externas: mapped to { link } format explicitly');
