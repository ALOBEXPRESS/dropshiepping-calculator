#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para restaurar o nó "Buscar Contato no Bling" no workflow
Execute este script DEPOIS de atualizar o token com o escopo contatos.read
"""

import json
import sys

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

def add_buscar_contato_node(workflow):
    """Adiciona o nó 'Buscar Contato no Bling'"""
    
    # Verificar se o nó já existe
    existing = find_node_by_name(workflow, 'Buscar Contato no Bling')
    if existing:
        print("  ⚠ Nó 'Buscar Contato no Bling' já existe!")
        return False
    
    # Criar o nó
    node = {
        "parameters": {
            "url": "=https://api.bling.com.br/Api/v3/contatos/{{ $('Buscar Detalhes do Pedido').item.json.data.contato.id }}",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {
                        "name": "Authorization",
                        "value": "=Bearer {{ $('Pegar Access Token1').first().json.access_token }}"
                    },
                    {
                        "name": "Accept",
                        "value": "application/json"
                    }
                ]
            },
            "options": {}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.3,
        "position": [-9920, 5408],
        "id": "lead-node-1-buscar-contato",
        "name": "Buscar Contato no Bling",
        "onError": "continueErrorOutput"
    }
    
    workflow['nodes'].append(node)
    print("  ✓ Nó 'Buscar Contato no Bling' adicionado")
    return True

def update_processar_lead_code(workflow):
    """Atualiza o código do nó 'Processar Dados do Lead' para usar dados da API"""
    
    node = find_node_by_name(workflow, 'Processar Dados do Lead')
    if not node:
        print("  ❌ Nó 'Processar Dados do Lead' não encontrado")
        return False
    
    # Código original que usa dados da API de contatos
    original_code = """try {
  console.log('=== PROCESSAR LEAD/CONTATO ===');
  
  const contactData = $input.item.json.data;
  
  if (!contactData) {
    throw new Error('Dados do contato não encontrados');
  }
  
  console.log('Contact ID:', contactData.id);
  console.log('Contact Name:', contactData.nome);
  
  let documentType = null;
  let documentNumber = null;
  
  if (contactData.numeroDocumento) {
    const cleanDoc = contactData.numeroDocumento.replace(/[^0-9]/g, '');
    
    if (cleanDoc.length === 11) {
      documentType = 'CPF';
      documentNumber = contactData.numeroDocumento;
    } else if (cleanDoc.length === 14) {
      documentType = 'CNPJ';
      documentNumber = contactData.numeroDocumento;
    }
  }
  
  const address = contactData.endereco || {};
  
  const leadData = {
    bling_contact_id: contactData.id,
    organization_id: 'e3274f4d-2627-4121-895d-b0e3a70b0ace',
    name: contactData.nome || 'Nome não informado',
    email: contactData.email || null,
    phone: contactData.telefone || contactData.celular || null,
    mobile_phone: contactData.celular || null,
    document_type: documentType,
    document_number: documentNumber,
    ie: contactData.ie || null,
    rg: contactData.rg || null,
    address_street: address.endereco || address.rua || null,
    address_number: address.numero || null,
    address_complement: address.complemento || null,
    address_neighborhood: address.bairro || null,
    address_city: address.municipio || address.cidade || null,
    address_state: address.uf || address.estado || null,
    address_zip: address.cep || null,
    address_country: address.pais || 'Brasil',
    company_name: contactData.razaoSocial || null,
    trade_name: contactData.nomeFantasia || contactData.fantasia || null,
    bling_data: contactData,
    is_active: true,
    lead_status: 'customer',
    lead_source: $('Mapear Canal de Venda').item.json.marketplace || null
  };
  
  console.log('Lead data prepared:', {
    bling_contact_id: leadData.bling_contact_id,
    name: leadData.name,
    email: leadData.email,
    document_type: leadData.document_type
  });
  
  return { json: leadData };
  
} catch (error) {
  console.error('ERRO ao processar lead:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
"""
    
    node['parameters']['jsCode'] = original_code
    print("  ✓ Código do nó 'Processar Dados do Lead' restaurado (versão com API)")
    return True

def update_connections(workflow):
    """Atualiza as conexões para incluir o nó restaurado"""
    
    connections = workflow.get('connections', {})
    
    # Encontrar IDs dos nós
    validar_node = find_node_by_name(workflow, 'Validar Dados para NF')
    buscar_contato_node = find_node_by_name(workflow, 'Buscar Contato no Bling')
    processar_node = find_node_by_name(workflow, 'Processar Dados do Lead')
    
    if not validar_node or not buscar_contato_node or not processar_node:
        print("  ❌ Nós necessários não encontrados")
        return False
    
    validar_id = validar_node['id']
    buscar_contato_id = buscar_contato_node['id']
    
    # Conectar: Validar Dados para NF → Buscar Contato no Bling
    if validar_id not in connections:
        connections[validar_id] = {}
    
    connections[validar_id]['main'] = [[{
        'node': 'Buscar Contato no Bling',
        'type': 'main',
        'index': 0
    }]]
    
    # Conectar: Buscar Contato no Bling → Processar Dados do Lead
    connections[buscar_contato_id] = {
        'main': [[{
            'node': 'Processar Dados do Lead',
            'type': 'main',
            'index': 0
        }]]
    }
    
    workflow['connections'] = connections
    print("  ✓ Conexões atualizadas")
    return True

def save_workflow(workflow, filepath):
    """Salva o workflow atualizado"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Workflow salvo em: {filepath}")

def main():
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    
    print("=" * 60)
    print("RESTAURAR NÓ 'BUSCAR CONTATO NO BLING'")
    print("=" * 60)
    print("\n⚠️  IMPORTANTE: Execute este script APENAS se você:")
    print("   1. Adicionou o escopo 'contatos.read' no Bling")
    print("   2. Gerou um novo token")
    print("   3. Atualizou o token no N8N/banco de dados")
    print("\nSe você ainda não fez isso, pressione Ctrl+C para cancelar.")
    print("\nContinuando em 3 segundos...")
    
    import time
    time.sleep(3)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós")
    
    # Adicionar nó "Buscar Contato no Bling"
    print(f"\n2. Adicionando nó 'Buscar Contato no Bling'...")
    if not add_buscar_contato_node(workflow):
        print("\n⚠️  Nó já existe, pulando...")
    
    # Atualizar código do nó "Processar Dados do Lead"
    print(f"\n3. Restaurando código original do nó 'Processar Dados do Lead'...")
    if not update_processar_lead_code(workflow):
        print("\n❌ Falha ao atualizar código")
        return 1
    
    # Atualizar conexões
    print(f"\n4. Atualizando conexões...")
    if not update_connections(workflow):
        print("\n❌ Falha ao atualizar conexões")
        return 1
    
    # Salvar workflow
    print(f"\n5. Salvando workflow...")
    save_workflow(workflow, workflow_path)
    
    print("\n" + "=" * 60)
    print("✅ NÓ RESTAURADO COM SUCESSO!")
    print("=" * 60)
    print(f"\nTotal de nós no workflow: {len(workflow['nodes'])}")
    print("\nMudanças aplicadas:")
    print("  ✓ Nó 'Buscar Contato no Bling' adicionado")
    print("  ✓ Código do nó 'Processar Dados do Lead' restaurado")
    print("  ✓ Agora usa dados completos da API de contatos")
    print("  ✓ Todos os campos serão preenchidos (email, telefone, etc.)")
    print("\nPróximos passos:")
    print("1. Reimporte o workflow no N8N")
    print("2. Teste com um pedido")
    print("3. Verifique se todos os campos do lead foram preenchidos")
    print("\n⚠️  Se ainda der erro 403:")
    print("   - Verifique se o token foi atualizado corretamente")
    print("   - Teste o token manualmente (veja COMO_AUMENTAR_ESCOPO_TOKEN_BLING.md)")
    print("   - Aguarde alguns minutos e tente novamente")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
