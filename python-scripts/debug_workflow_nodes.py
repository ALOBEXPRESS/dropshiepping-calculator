#!/usr/bin/env python3
"""
Script para debugar os nós do workflow e verificar se o código está correto
"""

import json
from pathlib import Path

def debug_workflow():
    workflow_path = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json")
    
    print("🔍 Analisando workflow...")
    print(f"📁 Arquivo: {workflow_path}")
    
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"\n✅ Workflow: {workflow['name']}")
    print(f"📊 Total de nós: {len(workflow['nodes'])}")
    
    # Procurar nós relacionados a itens
    print("\n🔍 Nós relacionados a 'item':")
    item_nodes = []
    for node in workflow['nodes']:
        if 'item' in node['name'].lower():
            item_nodes.append(node)
            print(f"   - {node['name']} (ID: {node['id']})")
    
    # Procurar nós de preparar dados
    print("\n🔍 Nós de 'Preparar dados':")
    for node in workflow['nodes']:
        if 'preparar dados' in node['name'].lower():
            print(f"\n   📍 {node['name']}")
            print(f"      ID: {node['id']}")
            print(f"      Tipo: {node['type']}")
            
            if node['type'] == 'n8n-nodes-base.code':
                code = node['parameters']['jsCode']
                
                # Verificar se tem o fallback
                if 'Fallback: usar um hash do código' in code:
                    print(f"      ✅ TEM fallback para bling_item_id")
                else:
                    print(f"      ❌ NÃO TEM fallback para bling_item_id")
                
                # Verificar se tem logs
                if 'console.log' in code:
                    log_count = code.count('console.log')
                    print(f"      📝 {log_count} logs no código")
                
                # Mostrar primeiras linhas
                lines = code.split('\n')[:5]
                print(f"      📄 Primeiras linhas:")
                for line in lines:
                    print(f"         {line[:80]}")
    
    # Procurar nós de inserir
    print("\n🔍 Nós de 'Inserir':")
    for node in workflow['nodes']:
        if 'inserir' in node['name'].lower() and 'item' in node['name'].lower():
            print(f"\n   📍 {node['name']}")
            print(f"      ID: {node['id']}")
            print(f"      Tipo: {node['type']}")
            
            if node['type'] == 'n8n-nodes-base.supabase':
                # Verificar campos
                fields = node['parameters'].get('fieldsUi', {}).get('fieldValues', [])
                print(f"      📊 {len(fields)} campos")
                
                # Verificar se tem bling_item_id
                has_bling_item_id = any(f['fieldId'] == 'bling_item_id' for f in fields)
                if has_bling_item_id:
                    bling_field = next(f for f in fields if f['fieldId'] == 'bling_item_id')
                    print(f"      ✅ Campo bling_item_id: {bling_field['fieldValue']}")
                else:
                    print(f"      ❌ Campo bling_item_id NÃO ENCONTRADO")
    
    print("\n" + "="*60)
    print("📋 RESUMO:")
    print(f"   - Total de nós: {len(workflow['nodes'])}")
    print(f"   - Nós com 'item': {len(item_nodes)}")
    print("\n💡 DICA:")
    print("   Se o n8n mostra nós diferentes (ex: 'item2'), significa que:")
    print("   1. O n8n não importou o arquivo corretamente")
    print("   2. Há cache no navegador")
    print("   3. O workflow no n8n é diferente do arquivo")
    print("\n🔧 SOLUÇÃO:")
    print("   1. Feche o n8n completamente")
    print("   2. Limpe o cache do navegador (Ctrl+Shift+Del)")
    print("   3. Abra o n8n novamente")
    print("   4. Delete o workflow antigo")
    print("   5. Importe o arquivo novamente")

if __name__ == "__main__":
    debug_workflow()
