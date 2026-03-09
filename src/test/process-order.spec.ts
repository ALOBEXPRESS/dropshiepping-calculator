import { test, expect } from '@playwright/test';

test.describe('Processar Pedido #103', () => {
  test('deve processar pedido com variação com sucesso', async ({ page }) => {
    // Navegar para a página de vendas
    await page.goto('/');

    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');

    // Tirar screenshot para debug
    await page.screenshot({ path: 'test-results/before-process.png', fullPage: true });

    // Aguardar um pouco para os dados carregarem
    await page.waitForTimeout(3000);

    // Procurar pelo texto "Vendas a Processar"
    const vendaSection = page.locator('text=Vendas a Processar');
    await expect(vendaSection).toBeVisible({ timeout: 10000 });

    // Procurar pelo card do pedido #103
    const orderCard = page.locator('text=Pedido #103');
    
    if (await orderCard.isVisible()) {
      console.log('✅ Pedido #103 encontrado!');
      
      // Encontrar o card pai
      const card = orderCard.locator('xpath=ancestor::div[contains(@class, "p-4")]').first();
      
      // Clicar no botão "PROCESSAR LUCRO"
      const processButton = card.locator('button:has-text("PROCESSAR LUCRO")');
      await expect(processButton).toBeVisible();
      
      // Escutar logs do console
      page.on('console', msg => {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      });

      // Escutar alerts
      page.on('dialog', async dialog => {
        console.log(`[ALERT] ${dialog.type()}: ${dialog.message()}`);
        await dialog.accept();
      });

      await processButton.click();

      // Aguardar o processamento (botão muda para "Processando...")
      await expect(processButton).toContainText('Processando...', { timeout: 5000 });

      // Aguardar o processamento completar
      await page.waitForTimeout(5000);

      // Tirar screenshot após processar
      await page.screenshot({ path: 'test-results/after-process.png', fullPage: true });

      console.log('✅ Teste concluído!');
    } else {
      console.log('❌ Pedido #103 não encontrado na página');
      await page.screenshot({ path: 'test-results/pedido-nao-encontrado.png', fullPage: true });
      throw new Error('Pedido #103 não encontrado');
    }
  });
});
