const fs = require('fs');
const w = JSON.parse(fs.readFileSync('src/hooks/n8n/workflows/Bling Atualizar Produto.json', 'utf8'));

console.log('=== CONNECTIONS ===');
Object.entries(w.connections).forEach(function([from, conn]) {
  conn.main.forEach(function(outputs, idx) {
    outputs.forEach(function(o) {
      console.log(from + ' -[' + idx + ']-> ' + o.node);
    });
  });
});

console.log('\n=== NODES SEM CONEXAO DE ENTRADA ===');
const destinos = new Set();
Object.values(w.connections).forEach(function(conn) {
  conn.main.forEach(function(outputs) {
    outputs.forEach(function(o) { destinos.add(o.node); });
  });
});
w.nodes.forEach(function(n) {
  if (!destinos.has(n.name) && n.name !== 'Webhook2') {
    console.log('SEM ENTRADA: ' + n.name);
  }
});
