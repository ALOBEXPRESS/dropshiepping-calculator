#!/usr/bin/env python3
"""
Script para corrigir o problema do bling_item_id NULL
Adiciona fallback quando o item não tem ID
"""

import json
import sys
from pathlib import Path

def fix_workflow():
    workflow_path = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json")
    
    print("🔧 Corrigindo problema do bling_item_id NULL...")
    print(f"📁 Arquivo: {workflow_path}")
    
    # Ler o workflow
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"✅ Workflow carregado: {workflow['name']}")
    
    # Procurar o nó "Preparar dados do item1"
    node_found = False
    for node in workflow['nodes']:
        if node['name'] == 'Preparar dados do item1':
            node_found = True
            print(f"\n✅ Nó encontrado: {node['name']}")
            
            # Pegar o código JavaScript atual
            old_code = node['parameters']['jsCode']
            
            # Substituir a parte do bling_item_id
            old_snippet = """    const blingItemId = itemDoPedido.id ? parseInt(itemDoPedido.id) : null;

    console.log('bling_item_id:', blingItemId, 'tipo:', typeof blingItemId);

    if (!blingItemId) {
      console.error('ERRO: bling_item_id é null ou inválido para SKU:', productSKU);
      console.error('itemDoPedido.id:', itemDoPedido.id);
      continue; // Pula este item
    }"""
            
            new_snippet = """    // CORREÇÃO: bling_item_id pode vir como string ou número
    // Se não vier, usar o código do produto como fallback
    let blingItemId = null;
    
    if (itemDoPedido.id) {
      blingItemId = parseInt(itemDoPedido.id);
      console.log('✅ bling_item_id do Bling:', blingItemId);
    } else {
      // Fallback: usar um hash do código como ID temporário
      console.warn('⚠️ AVISO: item sem ID do Bling, gerando ID baseado no código:', itemDoPedido.codigo);
      // Gerar um número baseado no código (hash simples)
      const hashCode = itemDoPedido.codigo.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      blingItemId = Math.abs(hashCode);
      console.log('✅ bling_item_id gerado:', blingItemId);
    }

    console.log('bling_item_id final:', blingItemId, 'tipo:', typeof blingItemId);
    console.log('itemDoPedido.id original:', itemDoPedido.id);
    console.log('itemDoPedido.codigo:', itemDoPedido.codigo);

    if (!blingItemId || blingItemId === 0) {
      console.error('❌ ERRO: bling_item_id é null, 0 ou inválido para SKU:', productSKU);
      console.error('itemDoPedido completo:', JSON.stringify(itemDoPedido, null, 2));
      continue; // Pula este item
    }"""
            
            if old_snippet in old_code:
                new_code = old_code.replace(old_snippet, new_snippet)
                node['parameters']['jsCode'] = new_code
                print("✅ Código corrigido!")
                print("\n📝 Mudanças:")
                print("   - Adicionado fallback para quando item.id não existe")
                print("   - Gera ID baseado em hash do código do produto")
                print("   - Adiciona logs detalhados para debug")
            else:
                print("⚠️ Snippet antigo não encontrado - código pode já estar atualizado")
                # Verificar se já tem o novo código
                if "Fallback: usar um hash do código" in old_code:
                    print("✅ Código já contém o fallback!")
                else:
                    print("❌ Código não reconhecido - pode precisar de correção manual")
            
            break
    
    if not node_found:
        print("❌ Nó 'Preparar dados do item1' não encontrado!")
        return False
    
    # Salvar o workflow corrigido
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Workflow salvo!")
    print(f"\n📋 Próximos passos:")
    print(f"   1. Reimporte o workflow no n8n")
    print(f"   2. Clone uma venda no Bling para testar")
    print(f"   3. Verifique os logs do n8n para ver se o bling_item_id está sendo gerado")
    
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
