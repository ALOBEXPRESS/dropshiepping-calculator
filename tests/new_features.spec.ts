import { test, expect } from '@playwright/test';

test('Verify New Features: Markup, Extra Commission, and Low Price Fee', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Verify Markup Label rename
  await expect(page.getByText('Markup', { exact: true })).toBeVisible();
  await expect(page.getByText('Markup Multiplicador')).not.toBeVisible();

  // 2. Verify Default Markup is 1.5x
  // The Select value isn't directly visible as text unless opened, but we can check the calculation.
  // Set Cost = 100.
  await page.fill('input[id="costPrice"]', '100');
  // Default Markup 1.5x. Default Packaging Cost = 2.
  // Total Cost = 100 + 2 = 102.
  // Suggested Price = 102 * 1.5 = 153.00.
  // Use specific locator for the price result
  await expect(page.locator('p.text-5xl')).toContainText('R$ 153.00');

  // 2. Test Extra Commission
  // Note: Default marketplace is Mercado Livre. We must switch to Shopee to see "Comissões Extras" input.
  const marketplaceTrigger = page.getByRole('combobox').filter({ hasText: 'Mercado Livre' });
  if (await marketplaceTrigger.isVisible()) {
      await marketplaceTrigger.click();
      await page.getByRole('option', { name: 'Shopee' }).click();
  }

  // Add 10% extra.
  // We need to find the input for "Comissões Extras (%)"
  await page.fill('input[placeholder="0"]', '10');
  
  // Check Tax Description update
  // Should see "+ 10% (Extra)"
  await expect(page.getByText('10% (Extra)')).toBeVisible();

  // Check Calculation
  // Price = 153.00.
  // Shopee Fees: 14 + 6 + 10 = 30%.
  // 30% of 153 = 45.90.
  // Fixed Fee: R$ 4 (Price > 8).
  // Total Fees: 45.90 + 4 = 49.90.
  // Wait, packaging cost (2) is also a cost, but is it in "Taxa Marketplace"?
  // The result card usually shows "Taxa Marketplace" separately.
  // "Taxa Marketplace (30%)" -> 45.90.
  await expect(page.getByText('- R$ 45.90')).toBeVisible();

  // 4. Test Low Price Logic (< R$8)
  // Set Cost = 1.
  // Set Markup = 2.0x (Select "2.0x")
  
  // Clear Extra Commission first
  await page.fill('input[placeholder="0"]', '0');
  
  await page.fill('input[id="costPrice"]', '1');
  
  // Open Markup Select
  await page.locator('button:has-text("1.5x")').click(); // Current value is 1.5x
  await page.getByRole('option', { name: '2.0x' }).click();
  
  // Total Cost = 1 + 2 (Pkg) = 3.
  // Suggested Price = 3 * 2 = 6.00.
  await expect(page.locator('p.text-5xl')).toContainText('R$ 6.00');

  // Fixed Fee should be 50% of 6.00 = 3.00.
  // Check "Taxa Fixa" row in the results
  // Use a more specific locator to avoid confusion with the input label
  const resultCard = page.locator('.shadow-xl', { hasText: 'Resultado da Precificação' });
  await expect(resultCard.getByText('- R$ 3.00')).toBeVisible();
  
  // Check Tax Description has "R$4,00 (Tarifa Fixa)" static text?
  // No, the logic I wrote was:
  // taxDescription = ... + R$4,00 (Tarifa Fixa)
  // Even if the applied fee is dynamic, the description text I hardcoded as "R$4,00".
  // The user asked to add "(Tarifa Fixa)" to the text, implying the text is static description of the rule.
  // But the calculation (Fixed Fee row) should show the actual applied fee.
  // My test checks the "Taxa Fixa" row value, which is correct.

});
