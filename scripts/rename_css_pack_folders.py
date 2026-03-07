#!/usr/bin/env python3
"""
Script para renomear pastas e subpastas do CSS PACK
Remove espaços e caracteres especiais dos nomes
"""

import os
import re
from pathlib import Path

def sanitize_name(name):
    """Remove espaços e caracteres especiais, mantendo apenas letras, números, hífen e underscore"""
    # Substituir espaços por hífen
    name = name.replace(' ', '-')
    # Substituir caracteres especiais
    name = name.replace('##', '')
    name = name.replace('(', '')
    name = name.replace(')', '')
    name = name.replace('–', '-')
    name = name.replace('—', '-')
    name = name.replace('É', 'E')
    name = name.replace('Í', 'I')
    name = name.replace('Ó', 'O')
    name = name.replace('Ú', 'U')
    name = name.replace('Ã', 'A')
    name = name.replace('Õ', 'O')
    name = name.replace('Ç', 'C')
    name = name.replace('á', 'a')
    name = name.replace('é', 'e')
    name = name.replace('í', 'i')
    name = name.replace('ó', 'o')
    name = name.replace('ú', 'u')
    name = name.replace('ã', 'a')
    name = name.replace('õ', 'o')
    name = name.replace('ç', 'c')
    name = name.replace('â', 'a')
    name = name.replace('ê', 'e')
    name = name.replace('ô', 'o')
    
    # Remover múltiplos hífens consecutivos
    name = re.sub(r'-+', '-', name)
    
    # Remover hífen no início e fim
    name = name.strip('-')
    
    return name

def rename_folders_recursive(base_path, dry_run=True):
    """Renomeia todas as pastas recursivamente"""
    
    base_path = Path(base_path)
    
    if not base_path.exists():
        print(f"❌ Pasta não encontrada: {base_path}")
        return
    
    # Coletar todas as pastas (do mais profundo para o mais raso)
    all_folders = []
    for root, dirs, files in os.walk(base_path, topdown=False):
        for dir_name in dirs:
            folder_path = Path(root) / dir_name
            all_folders.append(folder_path)
    
    print(f"📁 Encontradas {len(all_folders)} pastas para processar")
    print(f"{'🔍 MODO DRY-RUN (simulação)' if dry_run else '✏️  MODO REAL (renomeando)'}")
    print("=" * 80)
    
    renamed_count = 0
    
    for folder_path in all_folders:
        old_name = folder_path.name
        new_name = sanitize_name(old_name)
        
        if old_name != new_name:
            new_path = folder_path.parent / new_name
            
            print(f"\n📂 {old_name}")
            print(f"   → {new_name}")
            
            if not dry_run:
                try:
                    folder_path.rename(new_path)
                    print("   ✅ Renomeado")
                    renamed_count += 1
                except Exception as e:
                    print(f"   ❌ Erro: {e}")
            else:
                renamed_count += 1
    
    print("\n" + "=" * 80)
    print(f"{'🔍 Simulação concluída' if dry_run else '✅ Renomeação concluída'}")
    print(f"📊 Total de pastas {'que seriam renomeadas' if dry_run else 'renomeadas'}: {renamed_count}")
    
    if dry_run:
        print("\n⚠️  Para executar a renomeação real, execute:")
        print("   python scripts/rename_css_pack_folders.py --real")

def main():
    import sys
    
    base_path = 'CSS PACK para Elementor - Heitor Ferreira'
    
    # Verificar se deve executar em modo real
    dry_run = '--real' not in sys.argv
    
    print("=" * 80)
    print("RENOMEADOR DE PASTAS CSS PACK")
    print("=" * 80)
    print()
    
    if dry_run:
        print("⚠️  ATENÇÃO: Executando em modo DRY-RUN (simulação)")
        print("   Nenhuma pasta será renomeada de verdade.")
        print()
    else:
        print("⚠️  ATENÇÃO: Executando em MODO REAL")
        print("   As pastas SERÃO renomeadas!")
        print()
        response = input("Deseja continuar? (s/N): ")
        if response.lower() != 's':
            print("❌ Operação cancelada")
            return
        print()
    
    rename_folders_recursive(base_path, dry_run=dry_run)

if __name__ == '__main__':
    main()
