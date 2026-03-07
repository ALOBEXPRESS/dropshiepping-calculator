import { test, expect } from '@playwright/test';

test('Audit Dropshipping Calculator', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors (uncaught exceptions)
  const pageErrors: Error[] = [];
  page.on('pageerror', exception => {
    pageErrors.push(exception);
  });

  // Navigate to the app (using the port we saw active)
  await page.goto('/?e2e=true');

  // Check title
  await expect(page).toHaveTitle(/Calculadora Dropshipping - Alob Express/);

  // Check for specific text "Calculadora de Precificação Dropshipping Nacional"
  const headerText = page.locator('text=Calculadora de Precificação Dropshipping Nacional');
  await expect(headerText).toBeVisible();
  await expect(headerText).toContainText(/v\d+\.\d+\.\d+/);

  // Check footer
  const footerAuthor = page.locator('text=Desenvolvido por: Jonatan Renan');
  await footerAuthor.scrollIntoViewIfNeeded();
  await expect(footerAuthor).toBeVisible();
  await expect(page.locator('text=Alob Express © todos os direitos reservados')).toBeVisible();

  // Check for "gaffes" - e.g. placeholder text, broken images
  const images = await page.getByRole('img').all();
  for (const img of images) {
    const src = await img.getAttribute('src');
    // Simple check if src is present
    expect(src).toBeTruthy();
    // Ideally we would check if image loads, but this is a good start
  }

  // Check inputs exist
  await expect(page.getByLabel('Nome do Produto')).toBeVisible();
  
  // Wait a bit to ensure animations finish
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'audit-screenshot.png', fullPage: true });

  // Assert no errors
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('Navegacao para Produtos', async ({ page }) => {
  await page.goto('/?e2e=true');
  await page.getByRole('button', { name: 'Resumo Financeiro Geral' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.goto('/produtos?e2e=true');
  await expect(page.getByText('Produtos adicionados')).toBeVisible();
});
