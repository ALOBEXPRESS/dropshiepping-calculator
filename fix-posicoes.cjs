const fs = require('fs');
const w = JSON.parse(fs.readFileSync('src/hooks/n8n/workflows/Bling Atualizar Produto.json', 'utf8'));

// Pegar posições de referência dos nós vizinhos
const getPos = function(name) {
  const n = w.nodes.find(function(n) { return n.name === name; });
  return n ? n.position : null;
};

const ifTemVarPos = getPos('IF Tem Variacoes2');
const upsertProdutoPos = getPos('Upsert Produto Supabase2');

console.log('IF Tem Variacoes2 pos:', ifTemVarPos);
console.log('Upsert Produto Supabase2 pos:', upsertProdutoPos);

// GET Variacoes2: à direita do IF Tem Variacoes2, mesma altura
const getVariacoesNode = w.nodes.find(function(n) { return n.name === 'GET Variacoes2'; });
if (getVariacoesNode && ifTemVarPos) {
  getVariacoesNode.position = [ifTemVarPos[0] + 240, ifTemVarPos[1]];
  console.log('✓ GET Variacoes2 reposicionado para:', getVariacoesNode.position);
}

// Upsert Variacoes Supabase: à direita do GET Variacoes2, mesma altura
const upsertVariacoesNode = w.nodes.find(function(n) { return n.name === 'Upsert Variacoes Supabase'; });
if (upsertVariacoesNode && ifTemVarPos) {
  upsertVariacoesNode.position = [ifTemVarPos[0] + 480, ifTemVarPos[1]];
  console.log('✓ Upsert Variacoes Supabase reposicionado para:', upsertVariacoesNode.position);
}

// Upsert Produto Supabase2: à direita do Upsert Variacoes Supabase, mesma altura
if (upsertProdutoPos && ifTemVarPos) {
  const upsertProdutoNode = w.nodes.find(function(n) { return n.name === 'Upsert Produto Supabase2'; });
  if (upsertProdutoNode) {
    upsertProdutoNode.position = [ifTemVarPos[0] + 720, ifTemVarPos[1]];
    console.log('✓ Upsert Produto Supabase2 reposicionado para:', upsertProdutoNode.position);
  }
}

// Respond to Webhook2: à direita do Upsert Produto Supabase2
const respondNode = w.nodes.find(function(n) { return n.name === 'Respond to Webhook2'; });
if (respondNode && ifTemVarPos) {
  respondNode.position = [ifTemVarPos[0] + 960, ifTemVarPos[1]];
  console.log('✓ Respond to Webhook2 reposicionado para:', respondNode.position);
}

fs.writeFileSync('src/hooks/n8n/workflows/Bling Atualizar Produto.json', JSON.stringify(w, null, 2), 'utf8');
console.log('\n✅ Posições corrigidas! Reimporte o JSON no n8n.');
