#!/usr/bin/env python3
"""
Script para debugar o carregamento da página
"""

from playwright.sync_api import sync_playwright
import time

def debug_page():
    url = "https://cdncsspack.heitorweb.com/cssptexto-com-cor-de-destaque/?proibidocompartilhar=21561568"
    
    with sync_playwright() as p:
        print("🌐 Abrindo navegador...")
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        print(f"📄 Navegando para: {url}")
        response = page.goto(url, wait_until='networkidle', timeout=30000)
        
        print(f"   Status: {response.status}")
        print(f"   URL final: {page.url}")
        
        print("\n⏳ Aguardando 5 segundos...")
        time.sleep(5)
        
        # Tirar screenshot
        page.screenshot(path='page_screenshot.png', full_page=True)
        print("📸 Screenshot salvo: page_screenshot.png")
        
        # Tentar obter HTML novamente
        html = page.content()
        print(f"\n📄 Tamanho HTML: {len(html)} caracteres")
        
        if len(html) > 100:
            with open('page_full.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("✅ HTML completo salvo: page_full.html")
            
            # Procurar por texto específico
            if 'CSS' in html or 'css' in html:
                print("✅ Encontrou referências a CSS no HTML")
            
            if 'cor' in html.lower() or 'color' in html.lower():
                print("✅ Encontrou referências a cor/color no HTML")
        
        # Tentar executar JavaScript para ver o conteúdo
        print("\n🔍 Tentando extrair via JavaScript...")
        try:
            body_text = page.evaluate('() => document.body.innerText')
            print(f"   Texto do body: {len(body_text)} caracteres")
            if body_text:
                print(f"   Primeiros 500 chars:\n{body_text[:500]}")
        except Exception as e:
            print(f"   Erro: {e}")
        
        print("\n⏳ Aguardando 15 segundos para inspeção manual...")
        time.sleep(15)
        
        browser.close()

if __name__ == '__main__':
    debug_page()
