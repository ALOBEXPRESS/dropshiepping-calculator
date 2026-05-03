#!/usr/bin/env python3
"""
Script para corrigir o workflow Bling Pedido de Venda Automatization
Problema: Workflow trava no nó "Buscar Canal" quando o canal não é encontrado
Solução: Adicionar validação e canal padrão quando não encontrar
"""

import json
import sys
from pathlib import Path

def fix_workflow():
    workflow_path = Path("src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json")
    
    print(f"📂 Lendo workflow: {workflow_path}")
    
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"✅ Workflow carregado: {workflow['name']}")
    print(f"📊 Total de nós: {len(workflow['nodes'])}")
    
    # 1. Modificar o nó "Buscar Canal" para sempre retornar dados
    print("\n🔧 Modificando nó 'Buscar Canal'...")
    for node in workflow['nodes']:
        if node['name'] == 'Buscar Canal':
            # Adicionar alwaysOutputData e returnAll
            node['parameters']['returnAll'] = True
            node['alwaysOutputData'] = True
            print("   ✅ Adicionado 'alwaysOutputData' e 'returnAll'")
            break
    
    # 2. Adicionar novo nó "Validar Canal Encontrado"
    print("\n🔧 Adicionando nó 'Validar Canal Encontrado'...")
    
    validar_canal_node = {
        "parameters": {
            "jsCode": """// Validar se encontrou canal, senão criar um padrão
try {
  console.log('=== VALIDAR CANAL ENCONTRADO ===');
  
  const inputData = $input.all();
  console.log('Total de canais encontrados:', inputData.length);
  
  // Se encontrou canal, retornar o primeiro
  if (inputData.length > 0 && inputData[0].json.id) {
    console.log('✅ Canal encontrado:', inputData[0].json.name);
    return inputData[0];
  }
  
  // Se não encontrou, criar um canal padrão
  console.log('⚠️ Canal não encontrado, usando canal padrão');
  
  const storeId = $('Preparar Dados').item.json.bling_store_id;
  
  // Retornar estrutura de canal padrão
  return {
    json: {
      id: null, // Será NULL no banco, mas não vai quebrar o workflow
      bling_store_id: storeId,
      name: `Loja ${storeId} (Não Mapeada)`,
      marketplace: 'Desconhecido',
      account_type: 'CPF',
      account_holder: 'Sistema',
      is_active: true,
      organization_id: '28b4b443-03fd-4a2d-b596-9dcaf142b389',
      _warning: 'Canal não encontrado - usando padrão'
    }
  };
  
} catch (error) {
  console.error('ERRO ao validar canal:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
"""
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [3344, 2720],
        "id": "validar-canal-encontrado-001",
        "name": "Validar Canal Encontrado"
    }
    
    workflow['nodes'].append(validar_canal_node)
    print("   ✅ Nó 'Validar Canal Encontrado' adicionado")
    
    # 3. Adicionar nó de log para canal não encontrado
    print("\n🔧 Adicionando nó 'Log Canal Não Encontrado'...")
    
    log_canal_node = {
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "loose",
                    "version": 3
                },
                "conditions": [
                    {
                        "id": "canal-nao-encontrado",
                        "leftValue": "={{ $('Validar Canal Encontrado').item.json.id === null }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "equals"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.3,
        "position": [3552, 2720],
        "id": "if-canal-nao-encontrado-001",
        "name": "Canal Não Encontrado?"
    }
    
    workflow['nodes'].append(log_canal_node)
    print("   ✅ Nó 'Canal Não Encontrado?' adicionado")
    
    # 4. Adicionar nó de log de warning
    log_warning_node = {
        "parameters": {
            "tableId": "bling_sync_logs",
            "fieldsUi": {
                "fieldValues": [
                    {
                        "fieldId": "organization_id",
                        "fieldValue": "28b4b443-03fd-4a2d-b596-9dcaf142b389"
                    },
                    {
                        "fieldId": "event_type",
                        "fieldValue": "={{ $('Preparar Dados').item.json.event_type }}"
                    },
                    {
                        "fieldId": "bling_order_id",
                        "fieldValue": "={{ $('Buscar Detalhes do Pedido').item.json.data.id }}"
                    },
                    {
                        "fieldId": "marketplace_order_number",
                        "fieldValue": "={{ $('Buscar Detalhes do Pedido').item.json.data.numeroLoja }}"
                    },
                    {
                        "fieldId": "bling_store_id",
                        "fieldValue": "={{ $('Preparar Dados').item.json.bling_store_id }}"
                    },
                    {
                        "fieldId": "status",
                        "fieldValue": "warning"
                    },
                    {
                        "fieldId": "error_message",
                        "fieldValue": "=Canal de venda não encontrado para bling_store_id {{ $('Preparar Dados').item.json.bling_store_id }}. Pedido inserido com sales_channel_id NULL."
                    },
                    {
                        "fieldId": "webhook_data",
                        "fieldValue": "={{ $('Preparar Dados').item.json.webhook_data }}"
                    },
                    {
                        "fieldId": "api_response",
                        "fieldValue": "={{ JSON.stringify($('Validar Canal Encontrado').item.json) }}"
                    }
                ]
            }
        },
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [3760, 2880],
        "id": "log-warning-canal-001",
        "name": "Log Warning Canal",
        "credentials": {
            "supabaseApi": {
                "id": "JAUrj9KSS49DSWZu",
                "name": "Supabase account"
            }
        },
        "onError": "continueRegularOutput"
    }
    
    workflow['nodes'].append(log_warning_node)
    print("   ✅ Nó 'Log Warning Canal' adicionado")
    
    # 5. Atualizar conexões
    print("\n🔧 Atualizando conexões...")
    
    # Buscar Canal -> Validar Canal Encontrado
    workflow['connections']['Buscar Canal'] = {
        "main": [
            [
                {
                    "node": "Validar Canal Encontrado",
                    "type": "main",
                    "index": 0
                }
            ],
            [
                {
                    "node": "Houve erro?35",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Validar Canal Encontrado -> Canal Não Encontrado?
    workflow['connections']['Validar Canal Encontrado'] = {
        "main": [
            [
                {
                    "node": "Canal Não Encontrado?",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Canal Não Encontrado? -> Log Warning (true) ou Wait10 (false)
    workflow['connections']['Canal Não Encontrado?'] = {
        "main": [
            [
                {
                    "node": "Log Warning Canal",
                    "type": "main",
                    "index": 0
                }
            ],
            [
                {
                    "node": "Wait10",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Log Warning Canal -> Wait10
    workflow['connections']['Log Warning Canal'] = {
        "main": [
            [
                {
                    "node": "Wait10",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    print("   ✅ Conexões atualizadas")
    
    # 6. Atualizar referências no nó "Inserir Pedido"
    print("\n🔧 Atualizando referências no nó 'Inserir Pedido'...")
    for node in workflow['nodes']:
        if node['name'] == 'Inserir Pedido':
            for field in node['parameters']['fieldsUi']['fieldValues']:
                if field['fieldId'] == 'sales_channel_id':
                    # Mudar de Buscar Canal para Validar Canal Encontrado
                    field['fieldValue'] = "={{ $('Validar Canal Encontrado').item.json.id || null }}"
                    print("   ✅ Referência atualizada para usar 'Validar Canal Encontrado'")
                    break
            break
    
    # 7. Salvar workflow modificado
    print("\n💾 Salvando workflow modificado...")
    
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Workflow salvo com sucesso!")
    print(f"\n📊 Estatísticas finais:")
    print(f"   - Total de nós: {len(workflow['nodes'])}")
    print(f"   - Total de conexões: {len(workflow['connections'])}")
    
    print("\n" + "="*60)
    print("✅ CORREÇÃO APLICADA COM SUCESSO!")
    print("="*60)
    print("\n📋 Mudanças aplicadas:")
    print("   1. ✅ Nó 'Buscar Canal' agora sempre retorna dados")
    print("   2. ✅ Novo nó 'Validar Canal Encontrado' cria canal padrão")
    print("   3. ✅ Novo nó 'Canal Não Encontrado?' detecta canais não mapeados")
    print("   4. ✅ Novo nó 'Log Warning Canal' registra avisos")
    print("   5. ✅ Nó 'Inserir Pedido' aceita sales_channel_id NULL")
    print("\n🎯 Resultado:")
    print("   - Workflow não vai mais travar quando canal não for encontrado")
    print("   - Pedidos serão inseridos com sales_channel_id NULL")
    print("   - Logs de warning serão registrados para análise")
    print("\n💡 Próximos passos:")
    print("   1. Importe o workflow atualizado no n8n")
    print("   2. Teste com um pedido que tenha canal não mapeado")
    print("   3. Verifique os logs de warning em bling_sync_logs")
    print("   4. Adicione os canais faltantes na tabela sales_channels")
    print("\n")

if __name__ == "__main__":
    try:
        fix_workflow()
    except Exception as e:
        print(f"\n❌ ERRO: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
