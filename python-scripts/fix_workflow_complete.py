#!/usr/bin/env python3
"""
Script para corrigir TODOS os problemas do workflow n8n
Remove onError: continueErrorOutput de TODOS os nós e adiciona alwaysOutputData onde necessário
"""

import json
import sys
from pathlib import Path

def fix_workflow():
    workflow_path = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json")
    
    print("🔧 Corrigindo workflow COMPLETO...")
    print(f"📁 Arquivo: {workflow_path}")
    
    # Ler o workflow
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"✅ Workflow carregado: {workflow['name']}")
    print(f"📊 Total de nós: {len(workflow['nodes'])}")
    
    # Nós que precisam de alwaysOutputData: true (nós de busca/query)
    nodes_need_always_output = [
        'Buscar Canal',
        'Buscar Produto por SKU1',
        'Buscar Produto por SKU2',
        'Buscar em Products Bling (Fallback)1',
        'Pegar order_id1',
        'Buscar Lead Existente1',
        'Buscar Contato no Bling1',
        'Buscar Detalhes do Pedido'
    ]
    
    fixed_nodes = []
    nodes_with_on_error = []
    nodes_with_always_output = []
    
    # Processar cada nó
    for node in workflow['nodes']:
        node_name = node['name']
        changes = []
        
        # 1. Remover onError (qualquer valor)
        if 'onError' in node:
            old_value = node['onError']
            del node['onError']
            changes.append(f"Removido onError: {old_value}")
            nodes_with_on_error.append(node_name)
        
        # 2. Adicionar alwaysOutputData: true onde necessário
        if node_name in nodes_need_always_output:
            if not node.get('alwaysOutputData'):
                node['alwaysOutputData'] = True
                changes.append("Adicionado alwaysOutputData: true")
                nodes_with_always_output.append(node_name)
        
        if changes:
            fixed_nodes.append({
                'name': node_name,
                'id': node['id'],
                'changes': changes
            })
    
    print(f"\n📊 Análise:")
    print(f"   - Nós com onError removido: {len(nodes_with_on_error)}")
    print(f"   - Nós com alwaysOutputData adicionado: {len(nodes_with_always_output)}")
    print(f"   - Total de nós corrigidos: {len(fixed_nodes)}")
    
    if fixed_nodes:
        print(f"\n✅ Nós corrigidos:")
        for node in fixed_nodes:
            print(f"\n   📍 {node['name']}")
            print(f"      ID: {node['id']}")
            for change in node['changes']:
                print(f"      ✓ {change}")
    
    # Salvar o workflow corrigido
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Workflow corrigido e salvo!")
    
    print(f"\n📝 Resumo das Correções:")
    print(f"   1. Removido 'onError: continueErrorOutput' de {len(nodes_with_on_error)} nós")
    print(f"   2. Adicionado 'alwaysOutputData: true' em {len(nodes_with_always_output)} nós")
    print(f"   3. Agora TODOS os nós seguem o fluxo correto:")
    print(f"      - Sucesso → Saída principal (índice 0)")
    print(f"      - Erro → Saída de erro (índice 1)")
    
    if nodes_with_on_error:
        print(f"\n📋 Nós que tinham onError removido:")
        for node_name in nodes_with_on_error:
            print(f"      - {node_name}")
    
    if nodes_with_always_output:
        print(f"\n📋 Nós que receberam alwaysOutputData:")
        for node_name in nodes_with_always_output:
            print(f"      - {node_name}")
    
    return True

if __name__ == "__main__":
    try:
        success = fix_workflow()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
