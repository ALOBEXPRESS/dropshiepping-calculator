#!/usr/bin/env python3
"""
Script para corrigir as conexões do workflow n8n
Adiciona os nós de variações e conecta corretamente
"""

import json
import sys

def fix_workflow_connections(workflow_path):
    """Corrige as conexões do workflow"""
    
    print(f"📖 Lendo workflow de: {workflow_path}")
    
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"✅ Workflow carregado: {workflow['name']}")
    print(f"📊 Total de nós: {len(workflow['nodes'])}")
    
    # Encontrar os IDs dos nós importantes
    node_ids = {}
    for node in workflow['nodes']:
        node_ids[node['name']] = node['id']
        print(f"   - {node['name']}: {node['id']}")
    
    # Verificar se os nós necessários existem
    required_nodes = [
        'Preparar Itens do pedido2',
        'Buscar Produto por SKU2',
        'Buscar Variação por SKU2',
        'Combinar Produtos e Variações2',
        'Preparar dados do item2'
    ]
    
    print("\n🔍 Verificando nós necessários:")
    missing_nodes = []
    for node_name in required_nodes:
        if node_name in node_ids:
            print(f"   ✅ {node_name}")
        else:
            print(f"   ❌ {node_name} - FALTANDO")
            missing_nodes.append(node_name)
    
    if missing_nodes:
        print(f"\n⚠️ AVISO: {len(missing_nodes)} nós faltando!")
        print("   Certifique-se de que o workflow foi importado corretamente.")
        return False
    
    # Atualizar conexões
    print("\n🔧 Atualizando conexões...")
    
    connections = workflow.get('connections', {})
    
    # 1. Preparar Itens do pedido2 → Buscar Produto por SKU2
    if 'Preparar Itens do pedido2' not in connections:
        connections['Preparar Itens do pedido2'] = {'main': [[]]}
    
    # Adicionar conexão para Buscar Produto por SKU2
    connections['Preparar Itens do pedido2']['main'][0] = [
        {
            'node': 'Buscar Produto por SKU2',
            'type': 'main',
            'index': 0
        }
    ]
    print("   ✅ Preparar Itens do pedido2 → Buscar Produto por SKU2")
    
    # 2. Preparar Itens do pedido2 → Buscar Variação por SKU2
    if len(connections['Preparar Itens do pedido2']['main']) < 2:
        connections['Preparar Itens do pedido2']['main'].append([])
    
    connections['Preparar Itens do pedido2']['main'].append([
        {
            'node': 'Buscar Variação por SKU2',
            'type': 'main',
            'index': 0
        }
    ])
    print("   ✅ Preparar Itens do pedido2 → Buscar Variação por SKU2")
    
    # 3. Buscar Produto por SKU2 → Combinar Produtos e Variações2
    connections['Buscar Produto por SKU2'] = {
        'main': [[
            {
                'node': 'Combinar Produtos e Variações2',
                'type': 'main',
                'index': 0
            }
        ]]
    }
    print("   ✅ Buscar Produto por SKU2 → Combinar Produtos e Variações2")
    
    # 4. Buscar Variação por SKU2 → Combinar Produtos e Variações2
    connections['Buscar Variação por SKU2'] = {
        'main': [[
            {
                'node': 'Combinar Produtos e Variações2',
                'type': 'main',
                'index': 0
            }
        ]]
    }
    print("   ✅ Buscar Variação por SKU2 → Combinar Produtos e Variações2")
    
    # 5. Combinar Produtos e Variações2 → Preparar dados do item2
    connections['Combinar Produtos e Variações2'] = {
        'main': [[
            {
                'node': 'Preparar dados do item2',
                'type': 'main',
                'index': 0
            }
        ]]
    }
    print("   ✅ Combinar Produtos e Variações2 → Preparar dados do item2")
    
    # Atualizar o workflow
    workflow['connections'] = connections
    
    # Salvar o workflow corrigido
    output_path = workflow_path.replace('.json', '_CORRIGIDO.json')
    
    print(f"\n💾 Salvando workflow corrigido em: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Workflow corrigido com sucesso!")
    print(f"\n📋 Próximos passos:")
    print(f"   1. Importe o arquivo: {output_path}")
    print(f"   2. No n8n, vá em 'Workflows' → 'Import from File'")
    print(f"   3. Selecione o arquivo corrigido")
    print(f"   4. Marque 'Update existing workflow'")
    print(f"   5. Ative o workflow")
    
    return True

if __name__ == '__main__':
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json'
    
    if len(sys.argv) > 1:
        workflow_path = sys.argv[1]
    
    print("🔧 Corretor de Conexões do Workflow n8n")
    print("=" * 50)
    
    success = fix_workflow_connections(workflow_path)
    
    if success:
        print("\n🎉 Processo concluído!")
        sys.exit(0)
    else:
        print("\n❌ Processo falhou!")
        sys.exit(1)
