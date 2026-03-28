import json

path = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json'

with open(path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Corrige PUT Fornecedor2:
# O problema é que GET /contatos?codigo=ALOBFOR_DROP_01 pode não retornar nada
# pois "codigo" no endpoint /contatos é o CPF/CNPJ, não o código do fornecedor.
# A busca correta é GET /contatos?nome=THAIS+SOUZA... ou buscar sem filtro e filtrar manualmente.
# Solução: o idFornecedor já está dentro do objeto fornecedor retornado por GET /produtos/fornecedores
# O campo correto é fornecedor.fornecedor.id (objeto aninhado)
new_put_fornecedor_code = """const token = $('Get Valid Token2').item.json.access_token;
const fornecedor = $('Code: Identificar Fornecedor2').item.json.fornecedor;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const costPrice = $('Webhook2').item.json.body.costPrice
  ? Number($('Webhook2').item.json.body.costPrice)
  : (fornecedor.precoCusto || 0);

console.log('Fornecedor completo:', JSON.stringify(fornecedor));

// O idFornecedor é o ID do CONTATO no Bling, que vem em fornecedor.fornecedor.id
let idFornecedor = (fornecedor.fornecedor && fornecedor.fornecedor.id) ? fornecedor.fornecedor.id : 0;
console.log('idFornecedor do objeto:', idFornecedor);

// Se não veio no objeto, busca o contato pelo nome (campo correto da API Bling)
if (!idFornecedor) {
  // Tenta buscar por nome - THAIS SOUZA para ALOBFOR_DROP_01, ou nome do fornecedor
  const nomeBusca = fornecedor.fornecedor && fornecedor.fornecedor.nome
    ? fornecedor.fornecedor.nome
    : (fornecedor.codigo === 'ALOBFOR_DROP_01' ? 'THAIS SOUZA DO NASCIMENTO DIAS' : 'DOGMA');
  
  try {
    const r = await this.helpers.httpRequest({
      method: 'GET',
      url: 'https://api.bling.com.br/Api/v3/contatos?pesquisa=' + encodeURIComponent(nomeBusca),
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
    });
    console.log('Busca contato por nome:', nomeBusca, '-> resultado:', JSON.stringify((r.data||[]).slice(0,2)));
    idFornecedor = (r.data && r.data[0]) ? r.data[0].id : 0;
  } catch(e) {
    console.log('Erro ao buscar contato por nome:', e.message);
  }
}

if (!idFornecedor) {
  return [{ json: { skipped: true, reason: 'no_contact_id', codigo: fornecedor.codigo } }];
}

try {
  const resp = await this.helpers.httpRequest({
    method: 'PUT',
    url: 'https://api.bling.com.br/Api/v3/produtos/fornecedores/' + fornecedor.id,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: {
      idProduto: produtoId,
      idFornecedor: idFornecedor,
      descricao: fornecedor.descricao || '',
      codigo: fornecedor.codigo || '',
      precoCusto: costPrice,
      precoCompra: costPrice,
      padrao: fornecedor.padrao !== undefined ? fornecedor.padrao : true
    },
    returnFullResponse: true,
    ignoreHttpStatusErrors: true
  });
  console.log('PUT Fornecedor status:', resp.statusCode, JSON.stringify(resp.body||{}).substring(0,300));
} catch(err) {
  console.log('PUT Fornecedor error:', err.message);
  return [{ json: { error: err.message, fornecedorId: fornecedor.id } }];
}

return [{ json: { success: true, fornecedorId: fornecedor.id, idFornecedor: idFornecedor, codigo: fornecedor.codigo } }];"""

for node in workflow['nodes']:
    if node['name'] == 'PUT Fornecedor2':
        node['parameters']['jsCode'] = new_put_fornecedor_code
        print('✓ PUT Fornecedor2 corrigido')
        break

with open(path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print('✓ Workflow salvo')
