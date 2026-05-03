#!/usr/bin/env python3
"""
Script para modificar o workflow do n8n e substituir o nó "Buscar Produto por SKU2"
para usar HTTP Request chamando a função RPC do Supabase search_product_by_sku()
"""

import json
import sys
from pathlib import Path

# Caminho do arquivo do workflow
WORKFLOW_FILE = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json")

# URL do projeto Supabase
SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzU5NzcsImV4cCI6MjA1MTE1MTk3N30.Ks_Ql5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks5Ks"

def main():
    print("🔧 Modificando workflow do n8n...")
    
    # Ler o arquivo JSON
    print(f"📖 Lendo arquivo: {WORKFLOW_FILE}")
    with open(WORKFLOW_FILE, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    # Encontrar o nó "Buscar Produto por SKU2"
    node_found = False
    for i, node in enumerate(workflow['nodes']):
        if node['name'] == 'Buscar Produto por SKU2':
            print(f"✅ Nó encontrado: {node['name']}")
            node_found = True
            
            # Substituir o nó Supabase por HTTP Request
            workflow['nodes'][i] = {
                "parameters": {
                    "method": "POST",
                    "url": f"{SUPABASE_URL}/rest/v1/rpc/search_product_by_sku",
                    "sendHeaders": True,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "apikey",
                                "value": SUPABASE_ANON_KEY
                            },
                            {
                                "name": "Authorization",
                                "value": f"Bearer {SUPABASE_ANON_KEY}"
                            },
                            {
                                "name": "Content-Type",
                                "value": "application/json"
                            }
                        ]
                    },
                    "sendBody": True,
                    "bodyParameters": {
                        "parameters": [
                            {
                                "name": "p_sku",
                                "value": "={{ $json.codigo }}"
                            }
                        ]
                    },
                    "options": {}
                },
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.3,
                "position": node['position'],
                "id": node['id'],
                "name": node['name'],
                "credentials": {}
            }
            
            print(f"✅ Nó modificado para HTTP Request")
            break
    
    if not node_found:
        print("❌ Nó 'Buscar Produto por SKU2' não encontrado!")
        sys.exit(1)
    
    # Salvar o arquivo modificado
    output_file = WORKFLOW_FILE.parent / "Bling Pedido de Venda Automatization (MODIFIED).json"
    print(f"💾 Salvando arquivo modificado: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print("✅ Workflow modificado com sucesso!")
    print(f"\n📋 Próximos passos:")
    print(f"1. Importe o arquivo modificado no n8n:")
    print(f"   {output_file}")
    print(f"2. Teste o workflow com um pedido real")
    print(f"3. Verifique que o nó 'Buscar Produto por SKU2' retorna produtos")

if __name__ == "__main__":
    main()
