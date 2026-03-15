#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Reconstruindo conexões do zero...');

// Remover nó Wait Apos PUT Produto Bling2 (não existe como nó, só como conexão)
// e renomear Wait Apos PUT Produto2 de volta ao nome correto
const waitAposPutProduto2 = workflow.nodes.find(n => n.name === 'Wait Apos PUT Produto2');
if (waitAposPutProduto2) {
  console.log('✓ Wait Apos PUT Produto2 encontrado, id:', waitAposPutProduto2.id);
}

// Remover nó fantasma Wait Apos PUT Produto Bling2 se existir
workflow.nodes = workflow.nodes.filter(n => n.name !== 'Wait Apos PUT Produto Bling2');

// Fluxo correto:
//
// Webhook2 → Pegar Access Token2 → Check Token Expiry1 → IF Precisa Refresh1
//   ├─ (true)  → Refresh Token1 → Atualizar Token2 → Get Valid Token2
//   └─ (false) → Get Valid Token2
// Get Valid Token2 → GET Produto por SKU2 → IF Produto Encontrado2
//   ├─ (true)  → GET Detalhes Produto2 → Wait Apos Detalhes2 → GET Estoque2 → GET Fornecedores2
//                → Code: Identificar Fornecedor2 → IF Fornecedor Encontrado2
//                   ├─ (true)  → PUT Fornecedor2 → Wait Apos PUT Fornecedor2 → PUT Produto Bling2
//                   └─ (false) → GET Contato Fornecedor2 → POST Fornecedor2 → Wait Apos POST Fornecedor2 → PUT Produto Bling2
//   └─ (false) → Error Handler2
//
// PUT Produto Bling2 → Wait Apos PUT Produto2 → GET Lojas2 → Loop Lojas2
//   ├─ (done)  → IF Tem Variacoes2
//                   ├─ (true)  → GET Variacoes2 → Upsert Variacoes Supabase → Upsert Produto Supabase2
//                   └─ (false) → Upsert Produto Supabase2
//   └─ (batch) → PUT Loja2 → Wait Apos PUT Loja2 → Loop Lojas2
//
// Upsert Produto Supabase2 → Respond to Webhook2

workflow.connections = {
  // Token flow
  'Webhook2': { main: [[{ node: 'Pegar Access Token2', type: 'main', index: 0 }]] },
  'Pegar Access Token2': { main: [[{ node: 'Check Token Expiry1', type: 'main', index: 0 }]] },
  'Check Token Expiry1': { main: [[{ node: 'IF Precisa Refresh1', type: 'main', index: 0 }]] },
  'IF Precisa Refresh1': {
    main: [
      [{ node: 'Refresh Token1', type: 'main', index: 0 }],   // true → refresh
      [{ node: 'Get Valid Token2', type: 'main', index: 0 }]  // false → use existing
    ]
  },
  'Refresh Token1': { main: [[{ node: 'Atualizar Token2', type: 'main', index: 0 }]] },
  'Atualizar Token2': { main: [[{ node: 'Get Valid Token2', type: 'main', index: 0 }]] },
  'Get Valid Token2': { main: [[{ node: 'GET Produto por SKU2', type: 'main', index: 0 }]] },

  // Product lookup
  'GET Produto por SKU2': { main: [[{ node: 'IF Produto Encontrado2', type: 'main', index: 0 }]] },
  'IF Produto Encontrado2': {
    main: [
      [{ node: 'GET Detalhes Produto2', type: 'main', index: 0 }], // true
      [{ node: 'Error Handler2', type: 'main', index: 0 }]         // false
    ]
  },

  // Product details + stock + supplier
  'GET Detalhes Produto2': { main: [[{ node: 'Wait Apos Detalhes2', type: 'main', index: 0 }]] },
  'Wait Apos Detalhes2': { main: [[{ node: 'GET Estoque2', type: 'main', index: 0 }]] },
  'GET Estoque2': { main: [[{ node: 'GET Fornecedores2', type: 'main', index: 0 }]] },
  'GET Fornecedores2': { main: [[{ node: 'Code: Identificar Fornecedor2', type: 'main', index: 0 }]] },
  'Code: Identificar Fornecedor2': { main: [[{ node: 'IF Fornecedor Encontrado2', type: 'main', index: 0 }]] },
  'IF Fornecedor Encontrado2': {
    main: [
      [{ node: 'PUT Fornecedor2', type: 'main', index: 0 }],        // true → update supplier
      [{ node: 'GET Contato Fornecedor2', type: 'main', index: 0 }] // false → create supplier
    ]
  },
  'PUT Fornecedor2': { main: [[{ node: 'Wait Apos PUT Fornecedor2', type: 'main', index: 0 }]] },
  'Wait Apos PUT Fornecedor2': { main: [[{ node: 'PUT Produto Bling2', type: 'main', index: 0 }]] },
  'GET Contato Fornecedor2': { main: [[{ node: 'POST Fornecedor2', type: 'main', index: 0 }]] },
  'POST Fornecedor2': { main: [[{ node: 'Wait Apos POST Fornecedor2', type: 'main', index: 0 }]] },
  'Wait Apos POST Fornecedor2': { main: [[{ node: 'PUT Produto Bling2', type: 'main', index: 0 }]] },

  // PUT product → wait → GET lojas
  'PUT Produto Bling2': { main: [[{ node: 'Wait Apos PUT Produto2', type: 'main', index: 0 }]] },
  'Wait Apos PUT Produto2': { main: [[{ node: 'GET Lojas2', type: 'main', index: 0 }]] },

  // Lojas loop
  'GET Lojas2': { main: [[{ node: 'Loop Lojas2', type: 'main', index: 0 }]] },
  'Loop Lojas2': {
    main: [
      [{ node: 'IF Tem Variacoes2', type: 'main', index: 0 }], // done (all batches processed)
      [{ node: 'PUT Loja2', type: 'main', index: 0 }]          // batch item
    ]
  },
  'PUT Loja2': { main: [[{ node: 'Wait Apos PUT Loja2', type: 'main', index: 0 }]] },
  'Wait Apos PUT Loja2': { main: [[{ node: 'Loop Lojas2', type: 'main', index: 0 }]] },

  // Variacoes branch
  'IF Tem Variacoes2': {
    main: [
      [{ node: 'GET Variacoes2', type: 'main', index: 0 }],       // true → has variations
      [{ node: 'Upsert Produto Supabase2', type: 'main', index: 0 }] // false → no variations
    ]
  },
  'GET Variacoes2': { main: [[{ node: 'Upsert Variacoes Supabase', type: 'main', index: 0 }]] },
  'Upsert Variacoes Supabase': { main: [[{ node: 'Upsert Produto Supabase2', type: 'main', index: 0 }]] },

  // Final upsert + respond
  'Upsert Produto Supabase2': { main: [[{ node: 'Respond to Webhook2', type: 'main', index: 0 }]] },
};

console.log('✓ Conexões reconstruídas');

// Verificar que todos os nós referenciados existem
const nodeNames = new Set(workflow.nodes.map(n => n.name));
let allOk = true;
Object.entries(workflow.connections).forEach(([from, conn]) => {
  if (!nodeNames.has(from)) {
    console.log('⚠️  Nó origem não encontrado:', from);
    allOk = false;
  }
  conn.main.forEach((outputs) => {
    outputs.forEach(o => {
      if (!nodeNames.has(o.node)) {
        console.log('⚠️  Nó destino não encontrado:', o.node, '(de:', from + ')');
        allOk = false;
      }
    });
  });
});

if (allOk) {
  console.log('✓ Todos os nós referenciados existem');
}

// Salvar
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log('\n✅ Workflow salvo com sucesso!');
console.log('\nFluxo final:');
console.log('Webhook → Token → GET SKU → GET Detalhes → GET Estoque → GET Fornecedores');
console.log('  → IF Fornecedor → PUT/POST Fornecedor → PUT Produto Bling2 → Wait → GET Lojas');
console.log('  → Loop Lojas → PUT Loja (loop)');
console.log('  → IF Tem Variacoes');
console.log('      ├─ (true)  → GET Variacoes2 → Upsert Variacoes Supabase → Upsert Produto Supabase2');
console.log('      └─ (false) → Upsert Produto Supabase2');
console.log('  → Respond to Webhook2');
