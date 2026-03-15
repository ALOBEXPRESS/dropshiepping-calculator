/**
 * Fix: Move PUT Produto Bling2 to run AFTER GET Variacoes2
 * 
 * Current (WRONG) flow:
 *   Wait Apos PUT Fornecedor2 → PUT Produto Bling2 → Wait Apos PUT Produto2 → GET Lojas2 → Loop Lojas2 → IF Tem Variacoes2 → GET Variacoes2
 * 
 * Correct flow:
 *   Wait Apos PUT Fornecedor2 → GET Lojas2 → Loop Lojas2 → IF Tem Variacoes2 → GET Variacoes2 → PUT Produto Bling2 → Upsert Variacoes Supabase → Upsert Produto Supabase2
 *                                                                              ↘ (false) → PUT Produto Bling2 (simple) → Upsert Produto Supabase2
 * 
 * Also: POST Fornecedor2 path should also go to GET Lojas2 (not PUT Produto Bling2)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/n8n/workflows/Bling Atualizar Produto.json');
const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const conn = workflow.connections;

// ─── Step 1: Remove Wait Apos PUT Produto2 node (no longer needed in this position)
// We'll repurpose it or just remove it from connections
// Actually let's keep it but rewire everything

// ─── Step 2: Rewire connections
// 
// OLD:
//   Wait Apos PUT Fornecedor2 → PUT Produto Bling2
//   Wait Apos POST Fornecedor2 → PUT Produto Bling2
//   PUT Produto Bling2 → Wait Apos PUT Produto2
//   Wait Apos PUT Produto2 → GET Lojas2
//
// NEW:
//   Wait Apos PUT Fornecedor2 → GET Lojas2
//   Wait Apos POST Fornecedor2 → GET Lojas2
//   IF Tem Variacoes2 true (0) → GET Variacoes2 (unchanged)
//   IF Tem Variacoes2 false (1) → PUT Produto Bling2 (simple path)
//   GET Variacoes2 → PUT Produto Bling2 (variation path)
//   PUT Produto Bling2 → Upsert Variacoes Supabase (for variation path, it already handles both)
//   Upsert Variacoes Supabase → Upsert Produto Supabase2 (unchanged)
//   PUT Produto Bling2 (simple) → Upsert Produto Supabase2

// Fix Wait Apos PUT Fornecedor2 → GET Lojas2 (was → PUT Produto Bling2)
conn['Wait Apos PUT Fornecedor2'] = {
  main: [[{ node: 'GET Lojas2', type: 'main', index: 0 }]]
};

// Fix Wait Apos POST Fornecedor2 → GET Lojas2 (was → PUT Produto Bling2)
conn['Wait Apos POST Fornecedor2'] = {
  main: [[{ node: 'GET Lojas2', type: 'main', index: 0 }]]
};

// Remove Wait Apos PUT Produto2 from connections (it was between PUT Produto Bling2 and GET Lojas2)
// GET Lojas2 is now triggered directly from Wait Apos PUT Fornecedor2
delete conn['Wait Apos PUT Produto2'];

// Fix IF Tem Variacoes2:
//   true (index 0) → GET Variacoes2 (unchanged)
//   false (index 1) → PUT Produto Bling2 (simple product path)
conn['IF Tem Variacoes2'] = {
  main: [
    [{ node: 'GET Variacoes2', type: 'main', index: 0 }],
    [{ node: 'PUT Produto Bling2', type: 'main', index: 0 }]
  ]
};

// GET Variacoes2 → PUT Produto Bling2 (variation path)
conn['GET Variacoes2'] = {
  main: [[{ node: 'PUT Produto Bling2', type: 'main', index: 0 }]]
};

// PUT Produto Bling2 → Upsert Variacoes Supabase
// (Upsert Variacoes Supabase already handles the case where GET Variacoes2 wasn't run)
conn['PUT Produto Bling2'] = {
  main: [[{ node: 'Upsert Variacoes Supabase', type: 'main', index: 0 }]]
};

// Upsert Variacoes Supabase → Upsert Produto Supabase2 (unchanged, already correct)
// conn['Upsert Variacoes Supabase'] already points to Upsert Produto Supabase2

// Verify the chain
console.log('=== Verifying new connection chain ===');
console.log('Wait Apos PUT Fornecedor2 →', JSON.stringify(conn['Wait Apos PUT Fornecedor2']));
console.log('Wait Apos POST Fornecedor2 →', JSON.stringify(conn['Wait Apos POST Fornecedor2']));
console.log('IF Tem Variacoes2 →', JSON.stringify(conn['IF Tem Variacoes2']));
console.log('GET Variacoes2 →', JSON.stringify(conn['GET Variacoes2']));
console.log('PUT Produto Bling2 →', JSON.stringify(conn['PUT Produto Bling2']));
console.log('Upsert Variacoes Supabase →', JSON.stringify(conn['Upsert Variacoes Supabase']));
console.log('Upsert Produto Supabase2 →', JSON.stringify(conn['Upsert Produto Supabase2']));

fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
console.log('\n✅ Workflow connections fixed and saved!');
console.log('\nNew flow for formato=V:');
console.log('  Wait Apos PUT Fornecedor2 → GET Lojas2 → Loop Lojas2 → IF Tem Variacoes2 (true) → GET Variacoes2 → PUT Produto Bling2 → Upsert Variacoes Supabase → Upsert Produto Supabase2');
console.log('\nNew flow for formato=S:');
console.log('  ... → IF Tem Variacoes2 (false) → PUT Produto Bling2 → Upsert Variacoes Supabase (skips) → Upsert Produto Supabase2');
