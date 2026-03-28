import json

path = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json'

with open(path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Novo código corrigido para PUT Fornecedor2
# Problema: usava codigo hardcoded 'ALOBFOR_DROP_02' para buscar contato,
# ignorando que o fornecedor pode ser ALOBFOR_DROP_01.
# Correção: usa o codigo do fornecedor identificado dinamicamente.
new_put_fornecedor_code = """const token = $('Get Valid Token2').item.json.access_token;
const fornecedor = $('Code: Identificar Fornecedor2').item.json.fornecedor;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
const costPrice = $('Webhook2').item.json.body.costPrice
  ? Number($('Webhook2').item.json.body.costPrice)
  : (fornecedor.precoCusto || 0);

// Tenta pegar idFornecedor do objeto já carregado
let idFornecedor = (fornecedor.fornecedor && fornecedor.fornecedor.id) ? fornecedor.fornecedor.id : 0;

// Se não veio no objeto, busca pelo codigo correto do fornecedor identificado
if (!idFornecedor) {
  try {
    const r = await this.helpers.httpRequest({
      method: 'GET',
      url: 'https://api.bling.com.br/Api/v3/contatos?codigo=' + encodeURIComponent(fornecedor.codigo),
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
    });
    idFornecedor = (r.data && r.data[0]) ? r.data[0].id : 0;
    console.log('Buscou contato por codigo', fornecedor.codigo, '-> id:', idFornecedor);
  } catch(e) {
    console.log('Erro ao buscar contato:', e.message);
  }
}

if (!idFornecedor) {
  return [{ json: { skipped: true, reason: 'no_contact_id', codigo: fornecedor.codigo } }];
}

try {
  await this.helpers.httpRequest({
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
    }
  });
} catch(err) {
  console.log('PUT Fornecedor error:', err.message);
  return [{ json: { error: err.message, fornecedorId: fornecedor.id } }];
}

return [{ json: { success: true, fornecedorId: fornecedor.id, idFornecedor: idFornecedor, codigo: fornecedor.codigo } }];"""

# Aplica a correção no nó correto
for node in workflow['nodes']:
    if node['name'] == 'PUT Fornecedor2':
        node['parameters']['jsCode'] = new_put_fornecedor_code
        print('✓ Nó PUT Fornecedor2 corrigido')
        break

with open(path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print('✓ Workflow salvo com sucesso')
