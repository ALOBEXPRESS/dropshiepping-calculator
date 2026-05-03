#!/usr/bin/env python3
"""
Script para corrigir o workflow do n8n - Problema com inserção de itens
O workflow não está inserindo os itens porque o fluxo está incorreto.
"""

import json
import sys
from pathlib import Path

def fix_workflow():
    workflow_path = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json")
    
    print("🔧 Corrigindo workflow...")
    print(f"📁 Arquivo: {workflow_path}")
    
    # Ler o workflow
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"✅ Workflow carregado: {workflow['name']}")
    print(f"📊 Total de nós: {len(workflow['nodes'])}")
    
    # O problema é que o nó "Inserir Pedido" está configurado com onError="continueErrorOutput"
    # Isso faz com que quando há sucesso, o fluxo vá para a saída de erro (índice 1)
    # E quando há erro, vá para a saída principal (índice 0)
    
    # Encontrar o nó "Inserir Pedido"
    inserir_pedido_node = None
    for node in workflow['nodes']:
        if node['name'] == 'Inserir Pedido':
            inserir_pedido_node = node
            break
    
    if not inserir_pedido_node:
        print("❌ Nó 'Inserir Pedido' não encontrado!")
        return False
    
    print(f"\n📍 Nó 'Inserir Pedido' encontrado:")
    print(f"   - ID: {inserir_pedido_node['id']}")
    print(f"   - onError: {inserir_pedido_node.get('onError', 'N/A')}")
    
    # Remover o onError para que o fluxo funcione normalmente
    if 'onError' in inserir_pedido_node:
        old_value = inserir_pedido_node['onError']
        del inserir_pedido_node['onError']
        print(f"   ✅ Removido onError: {old_value}")
    
    # Verificar as conexões
    connections = workflow.get('connections', {})
    inserir_pedido_connections = connections.get('Inserir Pedido', {})
    
    print(f"\n📊 Conexões do 'Inserir Pedido':")
    print(f"   - main: {inserir_pedido_connections.get('main', [])}")
    
    # As conexões devem estar corretas:
    # main[0] -> Preparar Itens do pedido (sucesso)
    # main[1] -> Houve erro?34 (erro)
    
    # Salvar o workflow corrigido
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Workflow corrigido e salvo!")
    print(f"\n📝 Mudanças:")
    print(f"   1. Removido 'onError: continueErrorOutput' do nó 'Inserir Pedido'")
    print(f"   2. Agora o fluxo seguirá normalmente:")
    print(f"      - Sucesso → Preparar Itens do pedido")
    print(f"      - Erro → Houve erro?34")
    
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
