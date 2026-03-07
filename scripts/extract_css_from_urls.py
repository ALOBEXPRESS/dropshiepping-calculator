#!/usr/bin/env python3
"""
Script para extrair códigos CSS navegando nas URLs dos efeitos
"""

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def extract_css_from_url(page, url, effect_name):
    """Extrai código CSS de uma URL específica"""
    try:
        print(f"  Navegando: {effect_name[:50]}...")
        
        # Navegar para a URL
        page.goto(url, wait_until='networkidle', timeout=30000)
        time.sleep(2)  # Aguardar carregamento completo
        
        # Tentar extrair código CSS de diferentes formas
        css_code = None
        
        # Método 1: Procurar por tags <style>
        styles = page.query_selector_all('style')
        if styles:
            css_code = '\n\n'.join([style.inner_text() for style in styles if style.inner_text().strip()])
        
        # Método 2: Procurar por elementos com código CSS visível
        if not css_code:
            code_elements = page.query_selector_all('code, pre, .code, .css-code')
            if code_elements:
                css_code = '\n\n'.join([elem.inner_text() for elem in code_elements if elem.inner_text().strip()])
        
        # Método 3: Extrair todo o conteúdo da página se necessário
        if not css_code:
            body = page.query_selector('body')
            if body:
                text = body.inner_text()
                # Verificar se há código CSS no texto
                if '{' in text and '}' in text:
                    css_code = text
        
        return css_code if css_code else None
        
    except Exception as e:
        print(f"    ❌ Erro: {str(e)[:100]}")
        return None

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Carregar arquivos JSON
    urls_file = project_root / 'css-pack-effects-with-urls.json'
    effects_file = project_root / 'css-pack-all-effects.json'
    
    print("=" * 70)
    print("EXTRATOR DE CÓDIGOS CSS DAS URLs")
    print("=" * 70)
    
    # Carregar dados
    with open(urls_file, 'r', encoding='utf-8') as f:
        urls_data = json.load(f)
    
    with open(effects_file, 'r', encoding='utf-8') as f:
        effects_data = json.load(f)
    
    # Contar total de URLs
    total_urls = sum(len([e for e in effects if e.get('iframe_url')]) 
                     for effects in urls_data.values())
    
    print(f"📊 Total de URLs para processar: {total_urls}")
    print(f"⏱️  Tempo estimado: {total_urls * 5 / 60:.1f} minutos")
    print()
    
    # Iniciar Playwright
    with sync_playwright() as p:
        print("🌐 Iniciando navegador...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        processed = 0
        success = 0
        failed = 0
        
        # Processar cada categoria
        for category, effects in urls_data.items():
            print(f"\n📁 {category}")
            
            for effect in effects:
                url = effect.get('iframe_url')
                if not url:
                    continue
                
                processed += 1
                effect_name = effect['name']
                
                # Extrair CSS
                css_code = extract_css_from_url(page, url, effect_name)
                
                if css_code:
                    # Atualizar effects_data
                    for cat_effects in effects_data.values():
                        for e in cat_effects:
                            if e['name'] == effect_name:
                                e['css_code'] = {
                                    'extracted': css_code,
                                    'url': url
                                }
                                success += 1
                                print(f"    ✅ Código extraído ({len(css_code)} chars)")
                                break
                else:
                    failed += 1
                    print(f"    ⚠️  Nenhum código encontrado")
                
                # Progresso
                if processed % 10 == 0:
                    print(f"\n📊 Progresso: {processed}/{total_urls} ({processed/total_urls*100:.1f}%)")
                    print(f"   ✅ Sucesso: {success} | ⚠️  Falhas: {failed}")
        
        browser.close()
    
    # Salvar dados atualizados
    print("\n💾 Salvando dados...")
    with open(effects_file, 'w', encoding='utf-8') as f:
        json.dump(effects_data, f, ensure_ascii=False, indent=2)
    
    # Resumo final
    print("\n" + "=" * 70)
    print("RESUMO FINAL")
    print("=" * 70)
    print(f"Total processado: {processed}")
    print(f"✅ Sucesso: {success} ({success/processed*100:.1f}%)")
    print(f"⚠️  Falhas: {failed} ({failed/processed*100:.1f}%)")
    print(f"\n📄 Arquivo atualizado: {effects_file}")
    print("=" * 70)

if __name__ == '__main__':
    main()
