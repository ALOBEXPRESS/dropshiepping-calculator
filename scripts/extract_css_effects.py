#!/usr/bin/env python3
"""
Script para extrair todos os efeitos CSS do site CSS PACK
Usa Playwright para navegar e capturar informações
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def extract_css_effects():
    """Extrai todos os efeitos CSS do site"""
    
    async with async_playwright() as p:
        # Iniciar navegador
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Navegar para o site
        print("Navegando para o site CSS PACK...")
        await page.goto('https://heitorferreira.com.br/plataforma-hotmart-preview/')
        await page.wait_for_load_state('networkidle')
        
        # Extrair todos os efeitos
        print("Extraindo efeitos...")
        effects = await page.evaluate("""
            () => {
                const effects = [];
                
                // Selecionar todos os cards de efeitos
                const cards = document.querySelectorAll('.elementor-widget-container');
                
                cards.forEach(card => {
                    // Procurar por título que contenha "Aula:"
                    const titleElement = card.querySelector('h3, h4, .elementor-heading-title');
                    if (titleElement && titleElement.textContent.includes('Aula:')) {
                        const title = titleElement.textContent.trim();
                        
                        // Procurar por descrição
                        const descElement = card.querySelector('p');
                        const description = descElement ? descElement.textContent.trim() : '';
                        
                        // Procurar por módulo/categoria
                        const moduleLinks = card.querySelectorAll('a[href*="tag"]');
                        const modules = Array.from(moduleLinks).map(link => link.textContent.trim());
                        
                        // Procurar por badge "Novo"
                        const isNew = title.includes('Novo !');
                        
                        effects.push({
                            title: title.replace('Novo !', '').replace('Aula:', '').trim(),
                            description: description,
                            modules: modules,
                            isNew: isNew
                        });
                    }
                });
                
                // Remover duplicatas
                const uniqueEffects = [];
                const seen = new Set();
                
                effects.forEach(effect => {
                    if (!seen.has(effect.title)) {
                        seen.add(effect.title);
                        uniqueEffects.push(effect);
                    }
                });
                
                return uniqueEffects;
            }
        """)
        
        print(f"\nTotal de efeitos encontrados: {len(effects)}")
        
        # Explorar cada categoria
        categories = [
            'Animações',
            'Animações de Scroll Avançado',
            'Botões',
            'Carrosséis',
            'Composições',
            'Ferramentas',
            'Formulário',
            'Hover',
            'Personalizações'
        ]
        
        all_effects_by_category = {}
        
        for category in categories:
            print(f"\nExplorando categoria: {category}")
            
            # Clicar no botão da categoria
            try:
                await page.get_by_role('button', name=category).click()
                await page.wait_for_timeout(1500)
                
                # Extrair efeitos desta categoria
                category_effects = await page.evaluate("""
                    () => {
                        const effects = [];
                        const cards = document.querySelectorAll('.elementor-widget-container');
                        
                        cards.forEach(card => {
                            const titleElement = card.querySelector('h3, h4, .elementor-heading-title');
                            if (titleElement && titleElement.textContent.includes('Aula:')) {
                                const title = titleElement.textContent.trim();
                                const descElement = card.querySelector('p');
                                const description = descElement ? descElement.textContent.trim() : '';
                                
                                effects.push({
                                    title: title.replace('Novo !', '').replace('Aula:', '').trim(),
                                    description: description
                                });
                            }
                        });
                        
                        // Remover duplicatas
                        const uniqueEffects = [];
                        const seen = new Set();
                        
                        effects.forEach(effect => {
                            if (!seen.has(effect.title)) {
                                seen.add(effect.title);
                                uniqueEffects.push(effect);
                            }
                        });
                        
                        return uniqueEffects;
                    }
                """)
                
                all_effects_by_category[category] = category_effects
                print(f"  - {len(category_effects)} efeitos encontrados")
                
                # Tirar screenshot da categoria
                await page.screenshot(path=f'css-pack-{category.lower().replace(" ", "-")}.png', full_page=True)
                
            except Exception as e:
                print(f"  - Erro ao explorar categoria {category}: {e}")
        
        # Voltar para "Todos os Códigos"
        await page.get_by_role('button', name='Todos os Códigos').click()
        await page.wait_for_timeout(1000)
        
        # Fechar navegador
        await browser.close()
        
        return {
            'all_effects': effects,
            'by_category': all_effects_by_category
        }

async def main():
    """Função principal"""
    print("=" * 60)
    print("EXTRATOR DE EFEITOS CSS - CSS PACK")
    print("=" * 60)
    
    # Extrair efeitos
    data = await extract_css_effects()
    
    # Salvar em JSON
    output_file = 'css-pack-effects.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Dados salvos em: {output_file}")
    
    # Mostrar resumo
    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    print(f"Total de efeitos únicos: {len(data['all_effects'])}")
    print("\nPor categoria:")
    for category, effects in data['by_category'].items():
        print(f"  - {category}: {len(effects)} efeitos")
    
    print("\n" + "=" * 60)
    print("LISTA DE EFEITOS")
    print("=" * 60)
    for i, effect in enumerate(data['all_effects'], 1):
        print(f"\n{i}. {effect['title']}")
        if effect['modules']:
            print(f"   Módulos: {', '.join(effect['modules'])}")
        if effect['isNew']:
            print("   🆕 NOVO")
        if effect['description']:
            desc_preview = effect['description'][:100] + "..." if len(effect['description']) > 100 else effect['description']
            print(f"   {desc_preview}")

if __name__ == '__main__':
    asyncio.run(main())
