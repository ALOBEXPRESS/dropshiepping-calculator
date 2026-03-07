import { test } from '@playwright/test';

test('debug sales page', async ({ page }) => {
  await page.goto('http://localhost:5174/sales?e2e=true');
  await page.waitForTimeout(5000);
  
  // Tirar screenshot
  await page.screenshot({ path: 'debug-sales.png', fullPage: true });
  
  // Pegar o HTML
  const html = await page.content();
  console.log('HTML length:', html.length);
  
  // Verificar se há erros no console
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  // Verificar o que está sendo exibido
  const body = await page.locator('body').textContent();
  console.log('Body text:', body?.substring(0, 500));
  
  // Aguardar mais um pouco
  await page.waitForTimeout(10000);
  
  // Tirar outro screenshot
  await page.screenshot({ path: 'debug-sales-after.png', fullPage: true });
});
