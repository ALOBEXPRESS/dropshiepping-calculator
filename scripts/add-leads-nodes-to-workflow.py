#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para adicionar os nós de Leads ao workflow do N8N
"""

import json
import sys

def load_workflow(filepath):
    """Carrega o workflow do N8N"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except UnicodeDecodeError:
        # Tenta com latin-1 se UTF-8 falhar
        with open(filepath, 'r', encoding='latin-1') as f:
            return json.load(f)

def load_new_nodes(filepath):
    """Carrega os novos nós de leads"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_node_by_name(workflow, node_name):
    """Encontra um nó pelo nome"""
    for node in workflow['nodes']:
        if node.get('name') == node_name:
            return node
    return None

def add_leads_nodes(workflow, new_nodes_data):
    """Adiciona os novos nós de leads ao workflow"""
    
    # Encontrar o nó "Validar Dados para NF"
    validar_node = find_node_by_name(workflow, 'Validar Dados para NF')
    
    if not validar_node:
        print("ERRO: Nó 'Validar Dados para NF' não encontrado!")
        return False
    
    print(f"✓ Nó 'Validar Dados para NF' encontrado na posição {validar_node['position']}")
    
    # Adicionar os novos nós
    nodes_to_add = new_nodes_data['nodes']
    
    print(f"\nAdicionando {len(nodes_to_add)} novos nós...")
    
    for node in nodes_to_add:
        # Verificar se o nó já existe
        existing = find_node_by_name(workflow, node['name'])
        if existing:
            print(f"  ⚠ Nó '{node['name']}' já existe, pulando...")
            continue
        
        # Adicionar o nó
        workflow['nodes'].append(node)
        print(f"  ✓ Nó '{node['name']}' adicionado")
    
    return True

def update_connections(workflow):
    """Atualiza as conexões do workflow"""
    
    # Encontrar os IDs dos nós relevantes
    node_ids = {}
    for node in workflow['nodes']:
        node_ids[node['name']] = node['id']
    
    # Verificar se todos os nós necessários existem
    required_nodes = [
        'Validar Dados para NF',
        'Buscar Contato no Bling',
        'Processar Dados do Lead',
        'Buscar Lead Existente',
        'Lead Existe?',
        'Atualizar Lead',
        'Criar Lead',
        'Atualizar Estatísticas do Lead',
        'Salvar Estatísticas no Banco'
    ]
    
    missing_nodes = [n for n in required_nodes if n not in node_ids]
    if missing_nodes:
        print(f"\nERRO: Nós faltando: {', '.join(missing_nodes)}")
        return False
    
    # Criar/atualizar conexões
    connections = workflow.get('connections', {})
    
    # Conexão: Validar Dados para NF -> Buscar Contato no Bling
    validar_id = node_ids['Validar Dados para NF']
    buscar_contato_id = node_ids['Buscar Contato no Bling']
    
    if validar_id not in connections:
        connections[validar_id] = {}
    
    connections[validar_id]['main'] = [[{
        'node': 'Buscar Contato no Bling',
        'type': 'main',
        'index': 0
    }]]
    
    # Conexão: Buscar Contato no Bling -> Processar Dados do Lead
    connections[buscar_contato_id] = {
        'main': [[{
            'node': 'Processar Dados do Lead',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Processar Dados do Lead -> Buscar Lead Existente
    processar_id = node_ids['Processar Dados do Lead']
    connections[processar_id] = {
        'main': [[{
            'node': 'Buscar Lead Existente',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Buscar Lead Existente -> Lead Existe?
    buscar_lead_id = node_ids['Buscar Lead Existente']
    connections[buscar_lead_id] = {
        'main': [[{
            'node': 'Lead Existe?',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Lead Existe? -> Atualizar Lead (TRUE) e Criar Lead (FALSE)
    lead_existe_id = node_ids['Lead Existe?']
    connections[lead_existe_id] = {
        'main': [
            [{  # TRUE
                'node': 'Atualizar Lead',
                'type': 'main',
                'index': 0
            }],
            [{  # FALSE
                'node': 'Criar Lead',
                'type': 'main',
                'index': 0
            }]
        ]
    }
    
    # Conexão: Atualizar Lead -> Atualizar Estatísticas do Lead
    atualizar_lead_id = node_ids['Atualizar Lead']
    connections[atualizar_lead_id] = {
        'main': [[{
            'node': 'Atualizar Estatísticas do Lead',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Criar Lead -> Atualizar Estatísticas do Lead
    criar_lead_id = node_ids['Criar Lead']
    connections[criar_lead_id] = {
        'main': [[{
            'node': 'Atualizar Estatísticas do Lead',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Atualizar Estatísticas do Lead -> Salvar Estatísticas no Banco
    atualizar_stats_id = node_ids['Atualizar Estatísticas do Lead']
    connections[atualizar_stats_id] = {
        'main': [[{
            'node': 'Salvar Estatísticas no Banco',
            'type': 'main',
            'index': 0
        }]]
    }
    
    # Conexão: Salvar Estatísticas no Banco -> próximo nó (se houver)
    # Você precisará conectar manualmente ao próximo nó do fluxo original
    
    workflow['connections'] = connections
    
    print("\n✓ Conexões atualizadas")
    return True

def save_workflow(workflow, filepath):
    """Salva o workflow atualizado"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Workflow salvo em: {filepath}")

def main():
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    new_nodes_path = 'src/hooks/n8n/novos-nos-leads.json'
    output_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    
    print("=" * 60)
    print("ADICIONAR NÓS DE LEADS AO WORKFLOW N8N")
    print("=" * 60)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós existentes")
    
    # Carregar novos nós
    print(f"\n2. Carregando novos nós: {new_nodes_path}")
    new_nodes = load_new_nodes(new_nodes_path)
    print(f"   ✓ {len(new_nodes['nodes'])} novos nós carregados")
    
    # Adicionar nós
    print(f"\n3. Adicionando nós ao workflow...")
    if not add_leads_nodes(workflow, new_nodes):
        print("\n❌ Falha ao adicionar nós")
        return 1
    
    # Atualizar conexões
    print(f"\n4. Atualizando conexões...")
    if not update_connections(workflow):
        print("\n❌ Falha ao atualizar conexões")
        return 1
    
    # Salvar workflow
    print(f"\n5. Salvando workflow atualizado...")
    save_workflow(workflow, output_path)
    
    print("\n" + "=" * 60)
    print("✅ WORKFLOW ATUALIZADO COM SUCESSO!")
    print("=" * 60)
    print(f"\nTotal de nós no workflow: {len(workflow['nodes'])}")
    print("\nPróximos passos:")
    print("1. Importe o arquivo no N8N")
    print("2. Verifique as conexões visualmente")
    print("3. Teste o workflow com um pedido")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
