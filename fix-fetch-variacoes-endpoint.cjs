const fs = require('fs');

const workflowPath = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// The issue: GET Detalhes Produto2 returns variacoes: [] (empty)
// Solution: Use /produtos/variacoes?idProdutoPai={id} endpoint instead

// Find GET Variacoes2 node
const getVariacoesNode = workflow.nodes.find(n => n.name === 'GET Variacoes2');
if (!getVariacoesNode) {
  console.error('Node GET Variacoes2 not found');
  process.exit(1);
}

// Rewrite to use the correct Bling API endpoint
getVariacoesNode.parameters.jsCode = `const det = $('GET Detalhes Produto2').item.json.data;
const token = $('Get Valid Token2').item.json.access_token;

console.log('=== DEBUG GET VARIACOES2 ===');
console.log('Produto formato:', det.formato);
console.log('Produto ID:', det.id);

// CRITICAL FIX: Use /produtos/variacoes?idProdutoPai={id} endpoint
// The /produtos/{id} endpoint returns variacoes: [] (empty array)
let variacoes = [];
try {
  const varResp = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.bling.com.br/Api/v3/produtos/variacoes?idProdutoPai=' + det.id,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    }
  });
  variacoes = (varResp && varResp.data) ? varResp.data : [];
  console.log('Variacoes fetched from /produtos/variacoes:', variacoes.length);
} catch(e) {
  console.log('Error fetching variacoes:', e.message);
  return [{ json: { variacoes: [] } }];
}

if (variacoes.length === 0) {
  console.log('AVISO: Nenhuma variacao encontrada para produto', det.id);
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

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('✅ GET Variacoes2 corrigido - agora usa endpoint /produtos/variacoes');
console.log('\nPróximos passos:');
console.log('1. Reimporte o workflow no n8n');
console.log('2. Teste com o botão "Atualizar"');
console.log('3. As imagens devem ser preservadas agora!');
