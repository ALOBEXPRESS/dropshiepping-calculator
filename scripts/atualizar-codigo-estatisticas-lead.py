#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar o código do nó "Atualizar Estatísticas do Lead"
Corrige erro "Invalid expression" quando lead não existe
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

def update_estatisticas_code(workflow):
    """Atualiza o código do nó 'Atualizar Estatísticas do Lead'"""
    
    node = find_node_by_name(workflow, 'Atualizar Estatísticas do Lead')
    if not node:
        print("  ❌ Nó 'Atualizar Estatísticas do Lead' não encontrado")
        return False
    
    # Novo código que lida com lead inexistente
    new_code = """try {
  console.log('=== ATUALIZAR ESTATÍSTICAS DO LEAD ===');
  
  const orderData = $('Buscar Detalhes do Pedido').item.json.data;
  
  if (!orderData) {
    throw new Error('Dados do pedido não encontrados');
  }
  
  console.log('Order ID:', orderData.id);
  console.log('Order Total:', orderData.total);
  console.log('Order Date:', orderData.data);
  
  let leadData = null;
  
  try {
    leadData = $('Buscar Lead Existente').item.json;
  } catch (e) {
    console.log('Lead não encontrado no nó anterior, usando valores padrão');
  }
  
  const currentTotalOrders = leadData?.total_orders || 0;
  const currentTotalSpent = parseFloat(leadData?.total_spent || 0);
  const orderTotal = parseFloat(orderData.total || 0);
  const orderDate = orderData.data;
  
  const newTotalOrders = currentTotalOrders + 1;
  const newTotalSpent = currentTotalSpent + orderTotal;
  
  let firstOrderDate = leadData?.first_order_date;
  let lastOrderDate = leadData?.last_order_date;
  
  if (!firstOrderDate) {
    firstOrderDate = orderDate;
  } else {
    if (new Date(orderDate) < new Date(firstOrderDate)) {
      firstOrderDate = orderDate;
    }
  }
  
  if (!lastOrderDate) {
    lastOrderDate = orderDate;
  } else {
    if (new Date(orderDate) > new Date(lastOrderDate)) {
      lastOrderDate = orderDate;
    }
  }
  
  const updateData = {
    total_orders: newTotalOrders,
    total_spent: newTotalSpent,
    first_order_date: firstOrderDate,
    last_order_date: lastOrderDate,
    lead_status: 'customer',
    updated_at: new Date().toISOString()
  };
  
  console.log('Statistics updated:', {
    total_orders: newTotalOrders,
    total_spent: newTotalSpent,
    first_order_date: firstOrderDate,
    last_order_date: lastOrderDate
  });
  
  const bling_contact_id = $('Processar Dados do Lead').item.json.bling_contact_id;
  
  return {
    json: {
      bling_contact_id: bling_contact_id,
      ...updateData
    }
  };
  
} catch (error) {
  console.error('ERRO ao atualizar estatísticas:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
"""
    
    node['parameters']['jsCode'] = new_code
    print("  ✓ Código do nó 'Atualizar Estatísticas do Lead' atualizado")
    print("  ✓ Agora lida com casos onde o lead não existe")
    print("  ✓ Usa valores padrão quando necessário")
    return True

def save_workflow(workflow, filepath):
    """Salva o workflow atualizado"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Workflow salvo em: {filepath}")

def main():
    workflow_path = 'src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json'
    
    print("=" * 60)
    print("ATUALIZAR CÓDIGO 'ATUALIZAR ESTATÍSTICAS DO LEAD'")
    print("=" * 60)
    
    # Carregar workflow
    print(f"\n1. Carregando workflow: {workflow_path}")
    workflow = load_workflow(workflow_path)
    print(f"   ✓ Workflow carregado: {len(workflow['nodes'])} nós")
    
    # Atualizar código
    print(f"\n2. Atualizando código do nó 'Atualizar Estatísticas do Lead'...")
    if not update_estatisticas_code(workflow):
        print("\n❌ Falha ao atualizar código")
        return 1
    
    # Salvar workflow
    print(f"\n3. Salvando workflow...")
    save_workflow(workflow, workflow_path)
    
    print("\n" + "=" * 60)
    print("✅ CÓDIGO ATUALIZADO COM SUCESSO!")
    print("=" * 60)
    print("\nMudanças aplicadas:")
    print("  ✓ Código do nó 'Atualizar Estatísticas do Lead' atualizado")
    print("  ✓ Usa try/catch para pegar dados do lead")
    print("  ✓ Usa valores padrão se lead não existir")
    print("  ✓ Usa optional chaining (?.) para segurança")
    print("\nPróximos passos:")
    print("1. Reimporte o workflow no N8N")
    print("2. Execute o workflow")
    print("3. Verifique se as estatísticas foram atualizadas")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
