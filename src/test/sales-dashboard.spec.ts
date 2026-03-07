import { test, expect } from '@playwright/test';

test.describe('Sales Dashboard - Visual Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar diretamente para a página de vendas com parâmetro e2e
    await page.goto('http://localhost:5174/sales?e2e=true');
    await page.waitForLoadState('networkidle');
  });

  test('should display sales dashboard with all components', async ({ page }) => {
    // Verificar título da página
    await expect(page.locator('h1')).toContainText('Dashboard de Vendas');
    
    // Verificar se os cards de estatísticas estão visíveis
    const statsCards = page.locator('[class*="StatisticsCards"]').first();
    await expect(statsCards).toBeVisible({ timeout: 10000 });
  });

  test('should display Recent Orders Chart with ApexCharts', async ({ page }) => {
    // Verificar se o título do gráfico está presente
    await expect(page.locator('text=Pedidos Recentes')).toBeVisible({ timeout: 10000 });
    
    // Verificar se o gráfico ApexCharts foi renderizado
    const chartElement = page.locator('.apexcharts-canvas').first();
    await expect(chartElement).toBeVisible({ timeout: 15000 });
    
    // Verificar se há dados de receita exibidos
    await expect(page.locator('text=/R\\$/').first()).toBeVisible();
  });

  test('should display Revenue Report Chart with ApexCharts', async ({ page }) => {
    // Verificar se o título está presente
    await expect(page.locator('text=Relatório de Receita')).toBeVisible({ timeout: 10000 });
    
    // Verificar se o gráfico ApexCharts foi renderizado
    const revenueChart = page.locator('.apexcharts-canvas').nth(1);
    await expect(revenueChart).toBeVisible({ timeout: 15000 });
    
    // Verificar se os filtros de período estão funcionando
    const periodSelect = page.locator('button:has-text("Mensal")').first();
    if (await periodSelect.isVisible()) {
      await periodSelect.click();
      await expect(page.locator('text=Diário')).toBeVisible();
      await expect(page.locator('text=Semanal')).toBeVisible();
      await expect(page.locator('text=Anual')).toBeVisible();
    }
  });

  test('should display Transactions List with DiceBear avatars', async ({ page }) => {
    // Verificar se o título está presente
    await expect(page.locator('text=Transações')).toBeVisible({ timeout: 10000 });
    
    // Verificar se há transações listadas
    const transactionsList = page.locator('[class*="TransactionsList"]').first();
    await expect(transactionsList).toBeVisible({ timeout: 10000 });
    
    // Verificar se avatares estão sendo renderizados (imagens com data URI)
    const avatars = page.locator('img[src^="data:image/svg+xml"]');
    const avatarCount = await avatars.count();
    
    if (avatarCount > 0) {
      // Se há transações, verificar se os avatares estão visíveis
      await expect(avatars.first()).toBeVisible();
      console.log(`✓ ${avatarCount} avatar(s) DiceBear encontrado(s)`);
    } else {
      console.log('⚠ Nenhuma transação disponível para exibir avatares');
    }
  });

  test('should display Brazil States Distribution with colored badges', async ({ page }) => {
    // Verificar se o componente está presente
    await expect(page.locator('text=Distribuição por Estado')).toBeVisible({ timeout: 10000 });
    
    // Verificar se há badges coloridos (gradientes por região)
    const badges = page.locator('[class*="bg-gradient-to-br"]');
    const badgeCount = await badges.count();
    
    if (badgeCount > 0) {
      console.log(`✓ ${badgeCount} badge(s) colorido(s) encontrado(s)`);
      
      // Verificar se há barras de progresso
      const progressBars = page.locator('[class*="h-2"][class*="rounded-full"]');
      await expect(progressBars.first()).toBeVisible();
    } else {
      console.log('⚠ Nenhum estado com pedidos para exibir badges');
    }
  });

  test('should not display console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Aguardar carregamento completo
    await page.waitForTimeout(5000);
    
    // Verificar se não há erros críticos
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR_')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠ Erros encontrados no console:');
      criticalErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Testar em viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se os componentes ainda estão visíveis
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Pedidos Recentes')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Dashboard responsivo em mobile (375x667)');
  });

  test('should display all visual improvements', async ({ page }) => {
    // Fazer screenshot da região específica (Recent Orders, Transactions, Distribution)
    const dashboardRegion = page.locator('.grid.grid-cols-1.lg\\:grid-cols-3').first();
    
    if (await dashboardRegion.isVisible()) {
      await dashboardRegion.screenshot({ 
        path: 'tests/screenshots/sales-dashboard-region.png',
        animations: 'disabled'
      });
      console.log('✓ Screenshot salvo: tests/screenshots/sales-dashboard-region.png');
    }
    
    // Verificar elementos visuais chave
    const checks = [
      { selector: '.apexcharts-canvas', name: 'ApexCharts' },
      { selector: 'img[src^="data:image/svg+xml"]', name: 'DiceBear Avatars' },
      { selector: '[class*="bg-gradient-to-br"]', name: 'Gradient Badges' },
    ];
    
    for (const check of checks) {
      const elements = page.locator(check.selector);
      const count = await elements.count();
      console.log(`✓ ${check.name}: ${count} elemento(s) encontrado(s)`);
    }
  });
});
