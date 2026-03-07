#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir referências incorretas de nós no workflow
"""

import json
import sys
import re

def load_workflow(filepath):
    """Carrega o workflow do N8N"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='latin-1') as f:
            return json.load(f)

def find_node_by_name(workflow, node_name):
    """Encontra um nó pelo nome"""
    for node in workflow['nodes']:
        if node.get('name') == node_name:
            return node
    return None

def get_all_node_names(workflow):
    """Retorna lista de todos os nomes de nós"""
    return [node.get('name') for node in workflow['nodes']]

def fix_node_references(workflow):
    """Corrige referências incorretas de nós no código JavaScript"""
    
    all_node_names = get_all_node_names(workflow)
    print(f"\n📋 Nós disponíveis no workflow:")
    for name in sorted(all_node_names):
        print(f"   - {name}")
    
    fixes_made = []
    
    # Procurar nós com código JavaScript
    for node in workflow['nodes']:
        if node.get('type') == 'n8n-nodes-base.code':
            node_name = node.get('name')
            code = node.get('parameters', {}).get('jsCode', '')
            
            if not code:
                continue
            
            print(f"\n🔍 Verificando nó: {node_name}")
            
            # Encontrar todas as referências $('...')
            pattern = r"\$\('([^']+)'\)"
            matches = re.findall(pattern, code)
            
            if matches:
                print(f"   Referências encontradas: {matches}")
                
                # Verificar se cada referência existe
                for ref in set(matches):
                    if ref not in all_node_names:
                        print(f"   ❌ Referência inválida: '{ref}'")
                        
                        # Tentar encontrar o nome correto
                        # Remover números do final
                        ref_without_number = re.sub(r'\d+$', '', ref)
                        
                        if ref_without_number in all_node_names:
                            print(f"   ✓ Correção encontrada: '{ref}' → '{ref_without_number}'")
                            
                            # Substituir no código
                            old_pattern = f"$('{ref}')"
                            new_pattern = f"$('{ref_without_number}')"
                            code = code.replace(old_pattern, new_pattern)
                            
                            fixes_made.append({
                                'node': node_name,
                                'old': ref,
                                'new': ref_without_number
                            })
                        else:
                            print(f"   ⚠️  Não foi possível encontrar correção automática")
                            print(f"      Nós similares:")
                            for name in all_node_names:
                                if ref_without_number.lower() in name.lower():
                                    print(f"      - {name}")
                    else:
                        print(f"   ✓ Referência válida: '{ref}'")
            
            # Atualizar o código no nó
            if fixes_made and fixes_made[-1]['node'] == node_name:
                node['parameters']['jsCode'] = code
    
    return fixes_made

def save_workflow(workflow, filepath):
    """Salva o workflow atualizado"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Workflow salvo em: {filepath}")

def main():
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    
    print("=" * 60)
    print("CORRIGIR REFERÊNCIAS DE NÓS NO WORKFLOW")
    print("=" * 60)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós")
    
    # Corrigir referências
    print(f"\n2. Verificando e corrigindo referências...")
    fixes = fix_node_references(workflow)
    
    if not fixes:
        print("\n✅ Nenhuma correção necessária!")
        print("   Todas as referências estão corretas.")
        return 0
    
    # Salvar workflow
    print(f"\n3. Salvando workflow...")
    save_workflow(workflow, workflow_path)
    
    print("\n" + "=" * 60)
    print("✅ REFERÊNCIAS CORRIGIDAS COM SUCESSO!")
    print("=" * 60)
    print(f"\nTotal de correções: {len(fixes)}")
    print("\nCorreções aplicadas:")
    for fix in fixes:
        print(f"  ✓ Nó '{fix['node']}':")
        print(f"    '{fix['old']}' → '{fix['new']}'")
    
    print("\nPróximos passos:")
    print("1. Reimporte o workflow no N8N")
    print("2. Execute o workflow")
    print("3. Verifique se não há mais erros de referência")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
