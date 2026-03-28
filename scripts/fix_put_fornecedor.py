import json

path = 'src/hooks/n8n/workflows/Bling Atualizar Produto.json'

new_code = (
    "const token = $('Get Valid Token2').item.json.access_token;\n"
    "const fornecedor = $('Code: Identificar Fornecedor2').item.json.fornecedor;\n"
    "const produtoId = $('GET Produto por SKU2').item.json.data[0].id;\n"
    "const costPrice = $('Webhook2').item.json.body.costPrice\n"
    "  ? Number($('Webhook2').item.json.body.costPrice)\n"
    "  : (fornecedor.precoCusto || 0);\n"
    "\n"
    "// Mapeamento fixo: codigo do fornecedor -> ID do contato no Bling\n"
    "const FORNECEDOR_IDS = {\n"
    "  'ALOBFOR_DROP_01': 17905608001,\n"
    "  'ALOBFOR_DROP_02': 18016812879,\n"
    "  'ALOBEXPRESS_01':  17852526265\n"
    "};\n"
    "\n"
    "const idVinculo = fornecedor.id;\n"
    "const idContatoFornecedor = (fornecedor.fornecedor && fornecedor.fornecedor.id)\n"
    "  ? fornecedor.fornecedor.id\n"
    "  : (FORNECEDOR_IDS[fornecedor.codigo] || null);\n"
    "\n"
    "console.log('codigo:', fornecedor.codigo, 'idVinculo:', idVinculo, 'idContato:', idContatoFornecedor);\n"
    "\n"
    "if (!idContatoFornecedor) {\n"
    "  return [{ json: { skipped: true, reason: 'idContato nao encontrado para: ' + fornecedor.codigo } }];\n"
    "}\n"
    "\n"
    "try {\n"
    "  const resp = await this.helpers.httpRequest({\n"
    "    method: 'PUT',\n"
    "    url: 'https://api.bling.com.br/Api/v3/produtos/fornecedores/' + idVinculo,\n"
    "    headers: {\n"
    "      'Authorization': 'Bearer ' + token,\n"
    "      'Content-Type': 'application/json',\n"
    "      'Accept': 'application/json'\n"
    "    },\n"
    "    body: {\n"
    "      produto: { id: produtoId },\n"
    "      fornecedor: { id: idContatoFornecedor },\n"
    "      descricao: fornecedor.descricao || '',\n"
    "      codigo: fornecedor.codigo || '',\n"
    "      precoCusto: costPrice,\n"
    "      precoCompra: costPrice,\n"
    "      padrao: fornecedor.padrao !== undefined ? fornecedor.padrao : true\n"
    "    },\n"
    "    returnFullResponse: true,\n"
    "    ignoreHttpStatusErrors: true\n"
    "  });\n"
    "  console.log('PUT status:', resp.statusCode, JSON.stringify(resp.body||{}).substring(0, 300));\n"
    "  if (resp.statusCode >= 400) {\n"
    "    return [{ json: { error: 'PUT falhou', status: resp.statusCode, body: resp.body } }];\n"
    "  }\n"
    "  return [{ json: { success: true, idVinculo: idVinculo, idContatoFornecedor: idContatoFornecedor, codigo: fornecedor.codigo } }];\n"
    "} catch(err) {\n"
    "  console.log('PUT Fornecedor error:', err.message);\n"
    "  return [{ json: { error: err.message } }];\n"
    "}"
)

with open(path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

for node in workflow['nodes']:
    if node['name'] == 'PUT Fornecedor2':
        node['parameters']['jsCode'] = new_code
        assert "$('Get Valid Token2')" in new_code
        assert 'ALOBFOR_DROP_01' in new_code
        print('corrigido')
        break

with open(path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print('salvo')
