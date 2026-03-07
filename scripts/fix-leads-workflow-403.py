#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir o erro 403 no workflow de leads
Remove o nó "Buscar Contato no Bling" e ajusta o código para usar dados do pedido
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

def remove_node_by_name(workflow, node_name):
    """Remove um nó pelo nome"""
    workflow['nodes'] = [n for n in workflow['nodes'] if n.get('name') != node_name]
    print(f"  ✓ Nó '{node_name}' removido")

def update_processar_lead_node(workflow):
    """Atualiza o nó 'Processar Dados do Lead' com o novo código"""
    
    node = find_node_by_name(workflow, 'Processar Dados do Lead')
    if not node:
        print("  ❌ Nó 'Processar Dados do Lead' não encontrado")
        return False
    
    # Novo código que usa dados do pedido
    new_code = """try {
  console.log('=== PROCESSAR LEAD/CONTATO (dos dados do pedido) ===');
  
  // Pegar dados do pedido
  const orderData = $('Buscar Detalhes do Pedido').item.json.data;
  
  if (!orderData || !orderData.contato) {
    throw new Error('Dados do contato não encontrados no pedido');
  }
  
  const contactData = orderData.contato;
  const transportData = orderData.transporte?.etiqueta || {};
  
  console.log('Contact ID:', contactData.id);
  console.log('Contact Name:', contactData.nome);
  console.log('Contact Type:', contactData.tipoPessoa);
  
  // Determinar tipo de documento (CPF ou CNPJ)
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
  
  // Se não tiver documento mas tiver tipoPessoa, usar isso
  if (!documentType && contactData.tipoPessoa) {
    if (contactData.tipoPessoa === 'F') {
      documentType = 'CPF';
    } else if (contactData.tipoPessoa === 'J') {
      documentType = 'CNPJ';
    }
  }
  
  // Preparar dados do lead usando dados do pedido + etiqueta de transporte
  const leadData = {
    bling_contact_id: contactData.id,
    organization_id: 'e3274f4d-2627-4121-895d-b0e3a70b0ace',
    name: contactData.nome || transportData.nome || 'Nome não informado',
    email: null,
    phone: null,
    mobile_phone: null,
    document_type: documentType,
    document_number: documentNumber || contactData.numeroDocumento || null,
    ie: null,
    rg: null,
    address_street: transportData.endereco || null,
    address_number: transportData.numero || null,
    address_complement: transportData.complemento || null,
    address_neighborhood: transportData.bairro || null,
    address_city: transportData.municipio || null,
    address_state: transportData.uf || null,
    address_zip: transportData.cep || null,
    address_country: transportData.nomePais || 'Brasil',
    company_name: null,
    trade_name: null,
    bling_data: {
      contato: contactData,
      etiqueta: transportData,
      pedido_id: orderData.id,
      pedido_numero: orderData.numero
    },
    is_active: true,
    lead_status: 'customer',
    lead_source: $('Mapear Canal de Venda').item.json.marketplace || null
  };
  
  console.log('Lead data prepared:', {
    bling_contact_id: leadData.bling_contact_id,
    name: leadData.name,
    document_type: leadData.document_type,
    address_city: leadData.address_city,
    address_state: leadData.address_state
  });
  
  return { json: leadData };
  
} catch (error) {
  console.error('ERRO ao processar lead:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
"""
    
    node['parameters']['jsCode'] = new_code
    print("  ✓ Código do nó 'Processar Dados do Lead' atualizado")
    return True

def update_connections(workflow):
    """Atualiza as conexões para remover referência ao nó removido"""
    
    connections = workflow.get('connections', {})
    
    # Encontrar ID do nó "Validar Dados para NF"
    validar_node = find_node_by_name(workflow, 'Validar Dados para NF')
    processar_node = find_node_by_name(workflow, 'Processar Dados do Lead')
    
    if not validar_node or not processar_node:
        print("  ❌ Nós necessários não encontrados")
        return False
    
    validar_id = validar_node['id']
    
    # Conectar "Validar Dados para NF" diretamente a "Processar Dados do Lead"
    if validar_id in connections:
        connections[validar_id]['main'] = [[{
            'node': 'Processar Dados do Lead',
            'type': 'main',
            'index': 0
        }]]
    
    # Remover conexões do nó "Buscar Contato no Bling" se existirem
    buscar_contato_node = find_node_by_name(workflow, 'Buscar Contato no Bling')
    if buscar_contato_node:
        buscar_id = buscar_contato_node['id']
        if buscar_id in connections:
            del connections[buscar_id]
    
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
    print("CORRIGIR ERRO 403 - WORKFLOW DE LEADS")
    print("=" * 60)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós")
    
    # Remover nó "Buscar Contato no Bling"
    print(f"\n2. Removendo nó 'Buscar Contato no Bling'...")
    remove_node_by_name(workflow, 'Buscar Contato no Bling')
    
    # Atualizar código do nó "Processar Dados do Lead"
    print(f"\n3. Atualizando código do nó 'Processar Dados do Lead'...")
    if not update_processar_lead_node(workflow):
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
    print("✅ WORKFLOW CORRIGIDO COM SUCESSO!")
    print("=" * 60)
    print(f"\nTotal de nós no workflow: {len(workflow['nodes'])}")
    print("\nMudanças aplicadas:")
    print("  ✓ Nó 'Buscar Contato no Bling' removido")
    print("  ✓ Código do nó 'Processar Dados do Lead' atualizado")
    print("  ✓ Usa dados do contato que já vêm no pedido")
    print("  ✓ Usa dados da etiqueta de transporte para endereço")
    print("\nPróximos passos:")
    print("1. Reimporte o workflow no N8N")
    print("2. Teste com um pedido")
    print("3. Verifique se o lead foi criado no banco")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
