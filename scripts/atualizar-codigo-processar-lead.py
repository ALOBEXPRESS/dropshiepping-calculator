#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar o código do nó "Processar Dados do Lead"
Remove dependência do nó "Mapear Canal de Venda"
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

def update_processar_lead_code(workflow):
    """Atualiza o código do nó 'Processar Dados do Lead'"""
    
    node = find_node_by_name(workflow, 'Processar Dados do Lead')
    if not node:
        print("  ❌ Nó 'Processar Dados do Lead' não encontrado")
        return False
    
    # Novo código que não depende de "Mapear Canal de Venda"
    new_code = """try {
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
  
  const orderData = $('Buscar Detalhes do Pedido').item.json.data;
  const storeId = orderData?.loja?.id;
  
  const STORE_MAPPING = {
    205833031: 'MercadoLivre',
    205785487: 'TikTok',
    205835012: 'MercadoLivre',
    205852755: 'Shopee',
    205889400: 'Shopee',
    205899802: 'Facebook',
    205836967: 'Site'
  };
  
  const marketplace = STORE_MAPPING[storeId] || 'Desconhecido';
  
  console.log('Store ID:', storeId);
  console.log('Marketplace:', marketplace);
  
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
    lead_source: marketplace
  };
  
  console.log('Lead data prepared:', {
    bling_contact_id: leadData.bling_contact_id,
    name: leadData.name,
    email: leadData.email,
    document_type: leadData.document_type,
    lead_source: leadData.lead_source
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
    print("  ✓ Removida dependência do nó 'Mapear Canal de Venda'")
    print("  ✓ Marketplace agora é obtido diretamente dos dados do pedido")
    return True

def save_workflow(workflow, filepath):
    """Salva o workflow atualizado"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Workflow salvo em: {filepath}")

def main():
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    
    print("=" * 60)
    print("ATUALIZAR CÓDIGO DO NÓ 'PROCESSAR DADOS DO LEAD'")
    print("=" * 60)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós")
    
    # Atualizar código
    print(f"\n2. Atualizando código do nó 'Processar Dados do Lead'...")
    if not update_processar_lead_code(workflow):
        print("\n❌ Falha ao atualizar código")
        return 1
    
    # Salvar workflow
    print(f"\n3. Salvando workflow...")
    save_workflow(workflow, workflow_path)
    
    print("\n" + "=" * 60)
    print("✅ CÓDIGO ATUALIZADO COM SUCESSO!")
    print("=" * 60)
    print("\nMudanças aplicadas:")
    print("  ✓ Código do nó 'Processar Dados do Lead' atualizado")
    print("  ✓ Não depende mais do nó 'Mapear Canal de Venda'")
    print("  ✓ Marketplace obtido diretamente do pedido")
    print("  ✓ Mapeamento de lojas incluído no código")
    print("\nPróximos passos:")
    print("1. Reimporte o workflow no N8N")
    print("2. Execute o workflow")
    print("3. Verifique se o lead foi criado com sucesso")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
