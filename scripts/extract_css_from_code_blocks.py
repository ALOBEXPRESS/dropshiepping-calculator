#!/usr/bin/env python3
"""
Script para extrair códigos CSS dos blocos de código nas páginas web
Extrai apenas o CSS útil dos blocos formatados (não o template)
"""

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def extract_css_from_page(page, url, effect_name):
    """Extrai código CSS dos blocos de código na página"""
    try:
        print(f"  Navegando: {effect_name[:60]}...")
        
        # Navegar para a URL
        page.goto(url, wait_until='domcontentloaded', timeout=15000)
        time.sleep(2)  # Aguardar carregamento
        
        # Procurar por blocos de código CSS
        # Padrão 1: Blocos com class contendo 'language-css'
        css_blocks = page.query_selector_all('.language-css, pre.language-css, code.language-css')
        
        if css_blocks:
            css_codes = []
            for block in css_blocks:
                code = block.inner_text().strip()
                if code and len(code) > 50:  # Ignorar blocos muito pequenos
                    css_codes.append(code)
            
            if css_codes:
                # Retornar o maior bloco (geralmente o código principal)
                main_code = max(css_codes, key=len)
                return clean_css_code(main_code)
        
        # Padrão 2: Procurar em elementos <pre> ou <code>
        code_elements = page.query_selector_all('pre, code')
        if code_elements:
            for elem in code_elements:
                code = elem.inner_text().strip()
                # Verificar se parece CSS (contém { e })
                if '{' in code and '}' in code and len(code) > 100:
                    return clean_css_code(code)
        
        return None
        
    except Exception as e:
        print(f"    ❌ Erro: {str(e)[:80]}")
        return None

def clean_css_code(css_code):
    """Limpa o código CSS removendo lixo"""
    # Remover números de linha no início
    lines = css_code.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Remover números de linha (ex: "1  ", "2  ", etc)
        cleaned_line = line.lstrip('0123456789 \t')
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
    
    return '\n'.join(cleaned_lines).strip()

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    urls_file = project_root / 'css-pack-effects-with-urls.json'
    effects_file = project_root / 'css-pack-all-effects.json'
    
    print("=" * 70)
    print("EXTRAÇÃO DE CSS DOS BLOCOS DE CÓDIGO")
    print("=" * 70)
    
    # Carregar dados
    with open(urls_file, 'r', encoding='utf-8') as f:
        urls_data = json.load(f)
    
    with open(effects_file, 'r', encoding='utf-8') as f:
        effects_data = json.load(f)
    
    # Contar URLs
    total_urls = sum(len([e for e in effects if e.get('iframe_url')]) 
                     for effects in urls_data.values())
    
    print(f"📊 Total de URLs: {total_urls}")
    print(f"⏱️  Tempo estimado: {total_urls * 3 / 60:.1f} minutos")
    
    # Perguntar quantos processar
    print("\nOpções:")
    print("1. Testar com 10 primeiros")
    print("2. Processar 50 efeitos")
    print("3. Processar TODOS os efeitos")
    
    choice = input("\nEscolha (1/2/3): ").strip()
    
    if choice == '1':
        max_process = 10
    elif choice == '2':
        max_process = 50
    else:
        max_process = total_urls
    
    print(f"\n🚀 Processando {max_process} efeitos...")
    
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
                
                # Extrair CSS
                css_code = extract_css_from_page(page, url, effect_name)
                
                if css_code:
                    # Atualizar effects_data
                    for cat_effects in effects_data.values():
                        for e in cat_effects:
                            if e['name'] == effect_name:
                                if 'css_code' not in e:
                                    e['css_code'] = {}
                                e['css_code']['extracted'] = css_code
                                e['css_code']['url'] = url
                                success += 1
                                print(f"    ✅ {len(css_code)} caracteres")
                                break
                else:
                    failed += 1
                    print(f"    ⚠️  Nenhum código encontrado")
                
                # Progresso a cada 10
                if processed % 10 == 0:
                    print(f"\n📊 Progresso: {processed}/{max_process} ({processed/max_process*100:.1f}%)")
                    print(f"   ✅ Sucesso: {success} | ⚠️  Falhas: {failed}")
        
        browser.close()
    
    # Salvar
    print("\n💾 Salvando dados...")
    output_file = effects_file if max_process == total_urls else project_root / f'css-pack-effects-extracted-{max_process}.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(effects_data, f, ensure_ascii=False, indent=2)
    
    # Resumo
    print("\n" + "=" * 70)
    print("RESUMO FINAL")
    print("=" * 70)
    print(f"Total processado: {processed}")
    print(f"✅ Sucesso: {success} ({success/processed*100:.1f}%)")
    print(f"⚠️  Falhas: {failed} ({failed/processed*100:.1f}%)")
    print(f"\n📄 Arquivo: {output_file}")
    print("=" * 70)

if __name__ == '__main__':
    main()
