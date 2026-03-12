#!/usr/bin/env python3
"""
Script para corrigir organization_id no workflow N8N
Substitui o ID errado pelo correto em todo o arquivo JSON
"""

import json
import sys

# IDs
OLD_ORG_ID = "e3274f4d-2627-4121-895d-b0e3a70b0ace"
NEW_ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

def fix_organization_id(file_path):
    """Corrige organization_id no arquivo JSON"""
    
    print(f"📂 Lendo arquivo: {file_path}")
    
    # Ler arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Contar ocorrências
    count = content.count(OLD_ORG_ID)
    print(f"🔍 Encontradas {count} ocorrências do organization_id errado")
    
    if count == 0:
        print("✅ Nenhuma correção necessária!")
        return
    
    # Substituir
    new_content = content.replace(OLD_ORG_ID, NEW_ORG_ID)
    
    # Validar JSON
    try:
        json.loads(new_content)
        print("✅ JSON válido após substituição")
    except json.JSONDecodeError as e:
        print(f"❌ ERRO: JSON inválido após substituição: {e}")
        sys.exit(1)
    
    # Salvar
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Arquivo corrigido! {count} substituições realizadas")
    print(f"   Antigo: {OLD_ORG_ID}")
    print(f"   Novo:   {NEW_ORG_ID}")

if __name__ == "__main__":
    workflow_file = "src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json"
    
    try:
        fix_organization_id(workflow_file)
    except FileNotFoundError:
        print(f"❌ ERRO: Arquivo não encontrado: {workflow_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERRO: {e}")
        sys.exit(1)
