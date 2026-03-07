#!/usr/bin/env python3
"""
Script para extrair URLs dos iframes e criar documentação completa
"""

import os
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

def extract_iframe_url(html_file):
    """Extrai a URL do iframe de um arquivo HTML"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            iframe = soup.find('iframe')
            if iframe and iframe.get('src'):
                return iframe.get('src')
    except Exception as e:
        print(f"Erro ao ler {html_file}: {e}")
    return None

def extract_all_effects_with_urls(base_path):
    """Extrai todos os efeitos com suas URLs"""
    
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
            continue
        
        print(f"\n📁 {category_name}")
        effects = []
        
        for item in sorted(folder_path.iterdir()):
            if item.is_dir():
                effect_name = item.name
                
                # Procurar por arquivos HTML
                html_files = list(item.rglob('*.html'))
                
                iframe_url = None
                if html_files:
                    iframe_url = extract_iframe_url(html_files[0])
                
                effect_data = {
                    'name': effect_name,
                    'category': category_name,
                    'iframe_url': iframe_url,
                    'priority': 'high' if any(keyword in effect_name.lower() for keyword in ['hover', 'animação', 'scroll', 'botão', '3d']) else 'medium'
                }
                
                effects.append(effect_data)
                status = "✓" if iframe_url else "⚠"
                print(f"  {status} {effect_name}")
        
        all_effects[category_name] = effects
    
    return all_effects

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    base_path = project_root / 'CSS PACK para Elementor - Heitor Ferreira'
    
    if not base_path.exists():
        base_path = Path('d:/workspace/no-code/dropshipping-calculator-app/CSS PACK para Elementor - Heitor Ferreira')
    
    print("=" * 70)
    print("EXTRATOR DE URLs DOS EFEITOS CSS")
    print("=" * 70)
    print(f"📁 Pasta base: {base_path}")
    
    all_effects = extract_all_effects_with_urls(base_path)
    
    # Salvar em JSON
    output_file = project_root / 'css-pack-effects-with-urls.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_effects, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Dados salvos em: {output_file}")
    
    # Resumo
    print("\n" + "=" * 70)
    print("RESUMO")
    print("=" * 70)
    
    total = sum(len(effects) for effects in all_effects.values())
    with_urls = sum(1 for effects in all_effects.values() for e in effects if e['iframe_url'])
    
    print(f"Total de efeitos: {total}")
    print(f"Com URLs: {with_urls}")
    print(f"Sem URLs: {total - with_urls}")

if __name__ == '__main__':
    main()
