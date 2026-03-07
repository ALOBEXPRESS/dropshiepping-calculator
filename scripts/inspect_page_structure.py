#!/usr/bin/env python3
"""
Script para inspecionar a estrutura de uma página e encontrar onde está o CSS
"""

from playwright.sync_api import sync_playwright
import time

def inspect_page():
    url = "https://cdncsspack.heitorweb.com/cssptexto-com-cor-de-destaque/?proibidocompartilhar=21561568"
    
    with sync_playwright() as p:
        print("🌐 Abrindo navegador...")
        browser = p.chromium.launch(headless=False)  # Visível para debug
        page = browser.new_page()
        
        print(f"📄 Navegando para: {url}")
        page.goto(url, wait_until='networkidle')
        time.sleep(3)
        
        print("\n" + "=" * 70)
        print("ESTRUTURA DA PÁGINA")
        print("=" * 70)
        
        # Procurar elementos com código
        print("\n1. Procurando elementos <pre>:")
        pres = page.query_selector_all('pre')
        print(f"   Encontrados: {len(pres)}")
        for i, pre in enumerate(pres[:3]):
            text = pre.inner_text()[:200]
            print(f"   Pre {i+1}: {text}...")
        
        print("\n2. Procurando elementos <code>:")
        codes = page.query_selector_all('code')
        print(f"   Encontrados: {len(codes)}")
        for i, code in enumerate(codes[:3]):
            text = code.inner_text()[:200]
            print(f"   Code {i+1}: {text}...")
        
        print("\n3. Procurando por classes com 'language':")
        langs = page.query_selector_all('[class*="language"]')
        print(f"   Encontrados: {len(langs)}")
        for i, lang in enumerate(langs[:3]):
            classes = lang.get_attribute('class')
            text = lang.inner_text()[:200]
            print(f"   Element {i+1} ({classes}): {text}...")
        
        print("\n4. Procurando por classes com 'css':")
        css_elems = page.query_selector_all('[class*="css"]')
        print(f"   Encontrados: {len(css_elems)}")
        for i, elem in enumerate(css_elems[:5]):
            classes = elem.get_attribute('class')
            tag = elem.evaluate('el => el.tagName')
            print(f"   Element {i+1}: <{tag}> class='{classes}'")
        
        print("\n5. Estrutura do body:")
        body_html = page.query_selector('body').inner_html()
        print(f"   Tamanho HTML: {len(body_html)} caracteres")
        
        # Salvar HTML para análise
        with open('page_structure.html', 'w', encoding='utf-8') as f:
            f.write(body_html)
        print("   ✅ HTML salvo em: page_structure.html")
        
        print("\n6. Aguardando 10 segundos para inspeção manual...")
        time.sleep(10)
        
        browser.close()

if __name__ == '__main__':
    inspect_page()
