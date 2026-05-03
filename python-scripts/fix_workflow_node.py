import json

# Ler o workflow
with open('src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Encontrar e modificar o nó "Buscar Produto por SKU2"
for node in workflow['nodes']:
    if node['name'] == 'Buscar Produto por SKU2':
        print(f"✅ Nó encontrado: {node['name']}")
        print(f"   ID: {node['id']}")
        print(f"   Configuração atual: {node['parameters']}")
        
        # Modificar para usar HTTP Request com a função SQL
        node['type'] = 'n8n-nodes-base.httpRequest'
        node['typeVersion'] = 4.3
        node['parameters'] = {
            'method': 'POST',
            'url': 'https://oensqhjnxwpcuanozske.supabase.co/rest/v1/rpc/search_product_by_sku',
            'authentication': 'predefinedCredentialType',
            'nodeCredentialType': 'supabaseApi',
            'sendHeaders': True,
            'headerParameters': {
                'parameters': [
                    {
                        'name': 'Content-Type',
                        'value': 'application/json'
                    },
                    {
                        'name': 'Prefer',
                        'value': 'return=representation'
                    }
                ]
            },
            'sendBody': True,
            'contentType': 'json',
            'bodyParameters': {
                'parameters': []
            },
            'specifyBody': 'json',
            'jsonBody': '={\n  "p_sku": "{{ $json.codigo }}"\n}',
            'options': {}
        }
        
        print(f"✅ Nó modificado com sucesso!")
        print(f"   Novo tipo: {node['type']}")
        break

# Salvar o workflow modificado
with open('src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json', 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print("\n✅ Workflow salvo com sucesso!")
print("📝 Próximo passo: Importar o workflow no n8n")
