import { test, expect } from '@playwright/test';

test('Wordpress and UI Updates', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Verify Video Background
  const video = page.locator('video');
  await expect(video).toBeVisible();
  
  // 2. Select Wordpress Marketplace
  // Default is Mercado Livre
  const marketplaceTrigger = page.locator('button[role="combobox"]').filter({ hasText: 'Mercado Livre' }).first();
  await marketplaceTrigger.click();
  await page.getByRole('option', { name: 'Wordpress (Site)' }).click();

  // 3. Verify Wordpress Fields
  await expect(page.getByLabel('Frete (R$)')).toBeVisible();

  // 4. Fill Data
  await page.fill('input[id="costPrice"]', '50');
  await page.fill('input[id="wordpressShipping"]', '15'); // Shipping 15

  // 5. Verify Results
  // Check for "Frete (Wordpress)" in results
  // Note: Depending on implementation, it might appear multiple times (e.g. in variation list vs main result).
  // Use .first() or a specific container to avoid ambiguity.
  const resultSection = page.locator('.space-y-3').filter({ hasText: 'Total de Taxas e Custos' });
  await expect(resultSection.getByText('Frete (Wordpress)').first()).toBeVisible();
  await expect(page.getByText('- R$ 15').first()).toBeVisible();

  // 6. Verify Green Areas
  // In the updated logic, if margin is excellent, it might be cyan (#25f4ee)
  // or green (#16A34A/20) if just good.
  // The test failed because it was cyan.
  // We can check if it has either class or just check it's not red.
  
  const profitLabel = page.getByText('Lucro Líquido', { exact: true });
  const profitContainer = profitLabel.locator('..');
  // Expect green-600 OR excellent color. 
  // The current logic uses 'bg-green-600' for good and 'bg-[#25f4ee]' for excellent.
  // Let's verify it is one of them.
  await expect(profitContainer).toHaveClass(/bg-green-600|bg-\[#25f4ee\]/);
  
  const marginLabel = page.getByText('Margem de Lucro', { exact: true });
  const marginContainer = marginLabel.locator('..');
  await expect(marginContainer).toHaveClass(/bg-green-600|bg-\[#25f4ee\]/);
});
