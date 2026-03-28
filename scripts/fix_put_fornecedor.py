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
    "const idVinculo = fornecedor.id;\n"
    "const idContatoFornecedor = fornecedor.fornecedor ? fornecedor.fornecedor.id : null;\n"
    "\n"
    "console.log('idVinculo:', idVinculo, 'idContato:', idContatoFornecedor);\n"
    "console.log('fornecedor obj:', JSON.stringify(fornecedor));\n"
    "\n"
    "if (!idContatoFornecedor) {\n"
    "  return [{ json: { skipped: true, reason: 'fornecedor.fornecedor.id ausente' } }];\n"
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
    "  return [{ json: { success: true, idVinculo: idVinculo, idContatoFornecedor: idContatoFornecedor } }];\n"
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
        print('corrigido')
        # Verifica se $() está presente
        assert "$('Get Valid Token2')" in new_code, "ERRO: expressoes $ perdidas!"
        break

with open(path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print('salvo')
