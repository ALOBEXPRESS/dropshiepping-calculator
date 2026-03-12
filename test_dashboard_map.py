#!/usr/bin/env python3
"""
Teste Playwright: Verificar se o mapa de distribuição por estado está carregando
"""

import asyncio
from playwright.async_api import async_playwright

async def test_dashboard_map():
    async with async_playwright() as p:
        print("🚀 Iniciando teste do dashboard...")
        
        # Abrir navegador
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Navegar para o dashboard
            print("📍 Navegando para http://localhost:5173/sales")
            await page.goto("http://localhost:5173/sales", wait_until="networkidle")
            
            # Aguardar um pouco para carregar
            await page.wait_for_timeout(3000)
            
            # Verificar se há erro na página
            print("\n🔍 Verificando erros na página...")
            errors = await page.locator('text=/erro|error/i').count()
            if errors > 0:
                print(f"⚠️  Encontrados {errors} elementos com erro")
            else:
                print("✅ Nenhum erro visível na página")
            
            # Verificar se o componente de distribuição por estado existe
            print("\n🗺️  Verificando componente de distribuição por estado...")
            
            # Procurar pelo título do componente
            map_title = page.locator('text=/distribuição por estado/i')
            if await map_title.count() > 0:
                print("✅ Título 'Distribuição por Estado' encontrado")
            else:
                print("❌ Título 'Distribuição por Estado' NÃO encontrado")
            
            # Verificar se há SVG do mapa (react-simple-maps usa SVG)
            svg_maps = await page.locator('svg').count()
            print(f"📊 Encontrados {svg_maps} elementos SVG na página")
            
            # Verificar se há dados de estados
            state_elements = await page.locator('[class*="state"], [data-state]').count()
            print(f"🏛️  Encontrados {state_elements} elementos relacionados a estados")
            
            # Verificar se há mensagem de "sem dados"
            no_data = await page.locator('text=/nenhum dado|sem dados|no data/i').count()
            if no_data > 0:
                print(f"⚠️  Encontrada mensagem de 'sem dados' ({no_data} ocorrências)")
            else:
                print("✅ Nenhuma mensagem de 'sem dados'")
            
            # Verificar loading
            loading = await page.locator('text=/carregando|loading/i').count()
            if loading > 0:
                print(f"⏳ Componente ainda está carregando ({loading} ocorrências)")
            else:
                print("✅ Nenhum indicador de loading")
            
            # Tirar screenshot
            print("\n📸 Tirando screenshot...")
            await page.screenshot(path="dashboard-map-test.png", full_page=True)
            print("✅ Screenshot salvo: dashboard-map-test.png")
            
            # Aguardar um pouco antes de fechar
            print("\n⏸️  Aguardando 5 segundos para inspeção visual...")
            await page.wait_for_timeout(5000)
            
        except Exception as e:
            print(f"\n❌ ERRO: {e}")
            await page.screenshot(path="dashboard-map-error.png")
            print("📸 Screenshot de erro salvo: dashboard-map-error.png")
        
        finally:
            await browser.close()
            print("\n✅ Teste concluído!")

if __name__ == "__main__":
    asyncio.run(test_dashboard_map())
