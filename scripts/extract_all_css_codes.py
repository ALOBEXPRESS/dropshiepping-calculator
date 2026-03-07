#!/usr/bin/env python3
"""
Script para extrair todos os códigos CSS da pasta CSS PACK
"""

import os
import json
from pathlib import Path

def read_file_content(file_path):
    """Lê o conteúdo de um arquivo com tratamento de erros"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"[Erro ao ler arquivo: {e}]"

def extract_css_codes(base_path):
    """Extrai todos os códigos CSS organizados por categoria"""
    
    categories = {
        '02 - PERSONALIZAÇÕES': 'Personalizações',
        '03 - FERRAMENTAS': 'Ferramentas',
        '04 - COMPOSIÇÕES': 'Composições',
        '05 - ANIMAÇÕES': 'Animações',
        '06 - CARROSSÉIS': 'Carrosséis',
        '07 - BOTÕES': 'Botões',
        '08 - ANIMAÇÕES DE SCROLL AVANÇADO (BÔNUS)': 'Animações de Scroll Avançado',
        '## NOVIDADES': 'Novidades'
    }
    
    all_effects = {}
    
    for folder, category_name in categories.items():
        folder_path = Path(base_path) / folder
        
        if not folder_path.exists():
            print(f"⚠️  Pasta não encontrada: {folder}")
            print(f"    Caminho tentado: {folder_path.absolute()}")
            continue
        
        print(f"\n📁 Explorando: {category_name}")
        effects = []
        
        # Listar todas as subpastas (cada uma é um efeito)
        for item in sorted(folder_path.iterdir()):
            if item.is_dir():
                effect_name = item.name
                
                # Procurar por arquivos CSS, HTML, JS em todas as subpastas
                css_files = list(item.rglob('*.css'))
                html_files = list(item.rglob('*.html'))
                js_files = list(item.rglob('*.js'))
                
                # Ler conteúdo dos arquivos CSS
                css_content = {}
                for css_file in css_files:
                    css_content[css_file.name] = read_file_content(css_file)
                
                effect_data = {
                    'name': effect_name,
                    'path': str(item.relative_to(base_path)),
                    'has_css': len(css_files) > 0,
                    'has_html': len(html_files) > 0,
                    'has_js': len(js_files) > 0,
                    'files': {
                        'css': [f.name for f in css_files],
                        'html': [f.name for f in html_files],
                        'js': [f.name for f in js_files]
                    },
                    'css_code': css_content
                }
                
                effects.append(effect_data)
                print(f"  ✓ {effect_name}")
        
        all_effects[category_name] = effects
        print(f"  Total: {len(effects)} efeitos")
    
    return all_effects

def main():
    # Tentar encontrar a pasta CSS PACK
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    possible_paths = [
        project_root / 'CSS PACK para Elementor - Heitor Ferreira',
        Path.cwd() / 'CSS PACK para Elementor - Heitor Ferreira',
        Path('CSS PACK para Elementor - Heitor Ferreira'),
        Path('d:/workspace/no-code/dropshipping-calculator-app/CSS PACK para Elementor - Heitor Ferreira'),
    ]
    
    base_path = None
    for path in possible_paths:
        test_path = Path(path)
        if test_path.exists() and test_path.is_dir():
            base_path = test_path
            break
    
    if not base_path:
        print("❌ Pasta CSS PACK não encontrada!")
        print("\nTentei procurar em:")
        for path in possible_paths:
            print(f"  - {path.absolute()}")
        print(f"\n📂 Diretório atual: {Path.cwd()}")
        print(f"📂 Diretório do script: {script_dir}")
        print(f"📂 Raiz do projeto: {project_root}")
        print("\n💡 Execute o script a partir do diretório raiz do projeto:")
        print("   python scripts/extract_all_css_codes.py")
        return
    
    print("=" * 70)
    print("EXTRATOR DE CÓDIGOS CSS - CSS PACK")
    print("=" * 70)
    print(f"📁 Pasta base encontrada: {base_path.absolute()}")
    print()
    
    # Extrair todos os efeitos
    all_effects = extract_css_codes(base_path)
    
    # Salvar em JSON
    output_file = project_root / 'css-pack-all-effects.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_effects, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Dados salvos em: {output_file}")
    
    # Mostrar resumo
    print("\n" + "=" * 70)
    print("RESUMO GERAL")
    print("=" * 70)
    
    total = 0
    for category, effects in all_effects.items():
        count = len(effects)
        total += count
        print(f"{category}: {count} efeitos")
    
    print(f"\n🎯 TOTAL: {total} efeitos CSS")
    print("=" * 70)
    print("\n💡 Os nomes das pastas contêm espaços e caracteres especiais.")
    print("   Isso é normal e o script funciona corretamente com eles.")

if __name__ == '__main__':
    main()
