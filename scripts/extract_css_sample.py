#!/usr/bin/env python3
"""
Script para extrair códigos CSS - VERSÃO DE TESTE (primeiros 10 efeitos)
"""

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def extract_css_from_url(page, url, effect_name):
    """Extrai código CSS de uma URL específica"""
    try:
        print(f"  Navegando: {effect_name[:60]}...")
        
        # Navegar para a URL
        page.goto(url, wait_until='domcontentloaded', timeout=15000)
        time.sleep(1)
        
        # Extrair todo o HTML da página
        html_content = page.content()
        
        # Extrair CSS inline
        css_code = ""
        
        # Método 1: Tags <style>
        styles = page.query_selector_all('style')
        if styles:
            for style in styles:
                content = style.inner_text().strip()
                if content:
                    css_code += content + "\n\n"
        
        # Método 2: Atributos style inline
        elements_with_style = page.query_selector_all('[style]')
        if elements_with_style and not css_code:
            inline_styles = []
            for elem in elements_with_style[:20]:  # Limitar a 20 elementos
                style_attr = elem.get_attribute('style')
                if style_attr:
                    inline_styles.append(style_attr)
            if inline_styles:
                css_code = "/* Inline Styles */\n" + "\n".join(inline_styles)
        
        return css_code.strip() if css_code.strip() else None
        
    except Exception as e:
        print(f"    ❌ Erro: {str(e)[:80]}")
        return None

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    urls_file = project_root / 'css-pack-effects-with-urls.json'
    effects_file = project_root / 'css-pack-all-effects.json'
    
    print("=" * 70)
    print("TESTE DE EXTRAÇÃO - 10 PRIMEIROS EFEITOS")
    print("=" * 70)
    
    with open(urls_file, 'r', encoding='utf-8') as f:
        urls_data = json.load(f)
    
    with open(effects_file, 'r', encoding='utf-8') as f:
        effects_data = json.load(f)
    
    with sync_playwright() as p:
        print("🌐 Iniciando navegador...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        processed = 0
        success = 0
        max_process = 10
        
        # Processar apenas os primeiros 10
        for category, effects in urls_data.items():
            if processed >= max_process:
                break
                
            print(f"\n📁 {category}")
            
            for effect in effects:
                if processed >= max_process:
                    break
                    
                url = effect.get('iframe_url')
                if not url:
                    continue
                
                processed += 1
                effect_name = effect['name']
                
                css_code = extract_css_from_url(page, url, effect_name)
                
                if css_code:
                    # Atualizar effects_data
                    for cat_effects in effects_data.values():
                        for e in cat_effects:
                            if e['name'] == effect_name:
                                e['css_code']['extracted'] = css_code
                                e['css_code']['url'] = url
                                success += 1
                                print(f"    ✅ {len(css_code)} caracteres extraídos")
                                break
                else:
                    print(f"    ⚠️  Nenhum código encontrado")
        
        browser.close()
    
    # Salvar
    print("\n💾 Salvando teste...")
    test_file = project_root / 'css-pack-all-effects-test.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(effects_data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 70)
    print(f"✅ Teste concluído: {success}/{processed} efeitos")
    print(f"📄 Arquivo de teste: {test_file}")
    print("=" * 70)

if __name__ == '__main__':
    main()
