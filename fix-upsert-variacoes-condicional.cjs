#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Corrigindo nó Upsert Variacoes Supabase...');

// Encontrar o nó Upsert Variacoes Supabase
const upsertVariacoesNode = workflow.nodes.find(n => n.name === 'Upsert Variacoes Supabase');

if (upsertVariacoesNode) {
  console.log('✓ Modificando Upsert Variacoes Supabase para verificar se GET Variacoes2 foi executado');
  
  upsertVariacoesNode.parameters.jsCode = `// Verificar se GET Variacoes2 foi executado (só executa para produtos com variacoes)
let variacoesData = [];
try {
  variacoesData = $('GET Variacoes2').item.json.variacoes || [];
} catch(e) {
  console.log('GET Variacoes2 nao foi executado - produto sem variacoes, pulando update');
  return [{ json: { skipped: true, reason: 'no_variations_node' } }];
}

if (variacoesData.length === 0) {
  console.log('Nenhuma variacao para atualizar no Supabase');
  return [{ json: { skipped: true, reason: 'no_variations_data' } }];
}

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

return [{ json: { success: true, variacoesAtualizadas: variacoesData.length } }];`;

  console.log('✓ Código atualizado com try-catch para verificar execução do GET Variacoes2');
}

// Salvar workflow modificado
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('\n✅ Correção aplicada com sucesso!');
console.log('\nAgora o nó Upsert Variacoes Supabase:');
console.log('- Verifica se GET Variacoes2 foi executado');
console.log('- Pula execução se produto não tem variações');
console.log('- Retorna {skipped: true} em vez de erro');
