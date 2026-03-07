#!/usr/bin/env python3
"""
Script INTELIGENTE para extrair códigos CSS específicos dos efeitos
Ignora CSS de template e foca apenas no código útil
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

def extract_css_from_local_html(html_path):
    """Extrai código CSS de arquivo HTML local"""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Procurar por blocos de código CSS
        # Padrão 1: Dentro de <style> tags
        style_pattern = r'<style[^>]*>(.*?)</style>'
        styles = re.findall(style_pattern, content, re.DOTALL | re.IGNORECASE)
        
        # Padrão 2: Dentro de <pre> ou <code> tags
        code_pattern = r'<(?:pre|code)[^>]*>(.*?)</(?:pre|code)>'
        codes = re.findall(code_pattern, content, re.DOTALL | re.IGNORECASE)
        
        # Combinar todos os códigos encontrados
        all_css = '\n\n'.join(styles + codes)
        
        # Filtrar CSS útil (remover template WordPress)
        if all_css:
            # Remover CSS de WordPress/template comum
            useful_css = filter_useful_css(all_css)
            return useful_css if useful_css else None
        
        return None
        
    except Exception as e:
        return None

def filter_useful_css(css_code):
    """Filtra CSS útil, removendo código de template"""
    
    # Padrões de CSS de template para remover
    template_patterns = [
        r':root\{--wp--preset.*?\}',  # WordPress presets
        r'\.wp-.*?\{.*?\}',  # Classes WordPress
        r'\.has-.*?-color\{.*?\}',  # WordPress color classes
        r'img\.wp-smiley.*?\}',  # WordPress emoji
        r'\.is-layout-.*?\{.*?\}',  # WordPress layout
    ]
    
    filtered = css_code
    for pattern in template_patterns:
        filtered = re.sub(pattern, '', filtered, flags=re.DOTALL)
    
    # Remover linhas vazias excessivas
    filtered = re.sub(r'\n\s*\n\s*\n+', '\n\n', filtered)
    
    # Se sobrou menos de 100 caracteres, provavelmente não é útil
    if len(filtered.strip()) < 100:
        return None
    
    return filtered.strip()

def extract_from_folder_structure():
    """Extrai CSS dos arquivos HTML locais"""
    
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    css_pack_dir = project_root / 'CSS PACK para Elementor - Heitor Ferreira'
    
    effects_file = project_root / 'css-pack-all-effects.json'
    
    print("=" * 70)
    print("EXTRAÇÃO INTELIGENTE DE CSS DOS ARQUIVOS LOCAIS")
    print("=" * 70)
    
    # Carregar dados existentes
    with open(effects_file, 'r', encoding='utf-8') as f:
        effects_data = json.load(f)
    
    total = 0
    success = 0
    
    # Processar cada categoria
    for category, effects in effects_data.items():
        print(f"\n📁 {category}")
        
        for effect in effects:
            if not effect.get('has_html'):
                continue
            
            total += 1
            effect_path = css_pack_dir / effect['path']
            
            # Procurar arquivos HTML
            html_files = list(effect_path.glob('html/*.html'))
            
            if html_files:
                # Tentar extrair CSS do primeiro arquivo HTML
                css_code = extract_css_from_local_html(html_files[0])
                
                if css_code:
                    effect['css_code']['local_extracted'] = css_code
                    success += 1
                    print(f"  ✅ {effect['name'][:50]} ({len(css_code)} chars)")
                else:
                    print(f"  ⚠️  {effect['name'][:50]} - Sem CSS útil")
            else:
                print(f"  ❌ {effect['name'][:50]} - Sem HTML")
    
    # Salvar
    print("\n💾 Salvando dados...")
    with open(effects_file, 'w', encoding='utf-8') as f:
        json.dump(effects_data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 70)
    print(f"✅ Sucesso: {success}/{total} efeitos")
    print(f"📄 Arquivo: {effects_file}")
    print("=" * 70)

if __name__ == '__main__':
    extract_from_folder_structure()
