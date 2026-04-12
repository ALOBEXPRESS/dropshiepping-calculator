import json

path = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json'

with open(path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# CORREÇÃO DEFINITIVA do PUT Fornecedor2
# 
# Problemas identificados via documentação oficial:
# 1. PUT /produtos/fornecedores/{idProdutoFornecedor}
#    - {idProdutoFornecedor} na URL = ID do VÍNCULO (fornecedor.id do objeto retornado por GET /produtos/fornecedores)
#    - Body deve ter: { produto: {id}, fornecedor: {id}, descricao, codigo, precoCusto, precoCompra, padrao }
#    - O campo "fornecedor.id" no body = ID do CONTATO no Bling
#
# 2. O objeto retornado por GET /produtos/fornecedores tem estrutura:
#    { id: <id_vinculo>, fornecedor: { id: <id_contato> }, produto: { id: <id_produto> }, ... }
#
# Portanto:
#   - URL: /produtos/fornecedores/{fornecedor.id}  <- id do vínculo
#   - Body: fornecedor: { id: fornecedor.fornecedor.id }  <- id do contato

new_put_fornecedor_code = """const token = $('Get Valid Token2').item.json.access_token;
const fornecedor = $('Code: Identificar Fornecedor2').item.json.fornecedor;
const produtoId = $('GET Produto por SKU2').item.json.data[0].id;
stPrice
  ? Number($('Webhook2').item.json.body.costPrice)
  : (fornecedor.precoCusto || 0);

// ID do vínculo produto-fornecedor (usado na URL do PUT)
const idVinculo = fornecedor.id;
// ID do contato fornecedor (usado no body do PUT como fornecedor.id)
const idContatoFornecedor = fornecedor.fornecedor ? fornecedor.fornecedor.id : null;

console.log('idVinculo (URL):', idVinculo);
console.log('idContatoFornecedor (body):', idContatoFornecedor);
console.log('fornecedor completo:', JSON.stringify(fornecedor));

if (!idContatoFornecedor) {
  return [{ json: { skipped: true, reason: 'fornecedor.fornecedor.id ausente', fornecedor: fornecedor } }];
}

try {
  const resp = await this.helpers.httpRequest({
    method: 'PUT',
    url: 'https://api.bling.com.br/Api/v3/produtos/fornecedores/' + idVinculo,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: {
      produto: { id: produtoId },
      fornecedor: { id: idContatoFornecedor },
      descricao: fornecedor.descricao || '',
      codigo: fornecedor.codigo || '',
      precoCusto: costPrice,
      precoCompra: costPrice,
      padrao: fornecedor.padrao !== undefined ? fornecedor.padrao : true
    },
    returnFullResponse: true,
    ignoreHttpStatusErrors: true
  });
  console.log('PUT status:', resp.statusCode, JSON.stringify(resp.body||{}).substring(0, 300));
  if (resp.statusCode >= 400) {
    return [{ json: { error: } }];
  }
} catch(err) {
  console.log('PUT Fornecedor error:', err.message);
  return [{ json: { error: err.message } }];
}

return [{ json: { success: true, idVinculo: idVinculo, idContatoFornecedor: idContatoFornecedor, codigo: fornecedor.codigo } }];"""

for node in workflow['nodes']:
    if node['name'] == 'PUT Fornecedor2':
        node['parameters']['jsCode'] = new_put_fornecedor_code
        print('✓ PUT Fornecedor2 corrigido')
        break

with open(path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print('✓ Workflow salvo')
