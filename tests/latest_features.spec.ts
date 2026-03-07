import { test, expect } from '@playwright/test';

test('Verify Latest Features: Discount/Acréscimo, Packaging Cost, and Variations', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Test Packaging Cost and Total Cost Logic
  // Set Product Cost = 100
  // Switch to Shopee to match previous test logic
  const marketplaceTrigger = page.getByRole('combobox').filter({ hasText: 'Mercado Livre' });
  if (await marketplaceTrigger.isVisible()) {
      await marketplaceTrigger.click();
      await page.getByRole('option', { name: 'Shopee' }).click();
  }

  await page.fill('input[id="costPrice"]', '100');
  
  // Set Packaging Cost = 10
  await page.fill('input[id="packagingCost"]', '10');
  
  // Check "Custos Embalagem" row
  // Now it should show ONLY the packaging cost as negative: "- R$ 10.00"
  await expect(page.getByText('Custos Embalagem', { exact: true })).toBeVisible();
  await expect(page.getByText('- R$ 10.00')).toBeVisible();
  
  // Suggested Price Calculation (Markup 1.5x on 110 (100+10) = 165)
  await expect(page.locator('p.text-5xl')).toContainText('R$ 165.00');

  // 2. Test "Acréscimo Aplicado" Label
  // Manual Price = 200 (Suggested is 165, so 35 more)
  // Use specific locator for Manual Price input
  await page.fill('input[id="manualSellingPrice"]', '200');

  // Check for "Acréscimo Aplicado"
  // Logic: Manual (200) > Suggested (165) => Diff = -35 (Negative) => Acréscimo.
  await expect(page.getByText('Acréscimo Aplicado')).toBeVisible();
  
  // Check value difference: 200 - 165 = 35.00
  // It should be visible as "R$ 35.00"
  await expect(page.getByText('R$ 35.00')).toBeVisible();

  // Test "Desconto Aplicado" (Manual < Suggested)
  await page.fill('input[id="manualSellingPrice"]', '150'); // Less than 165
  // Diff = 150 - 165 = -15. Wait.
  // Logic in code: discountApplied = manual - suggested? No.
  // Code: manualPriceVal > 0 ? suggestedPrice - manualPriceVal : 0;
  // So: 165 - 150 = +15. (Positive).
  // Positive => 'Desconto Aplicado'.
  await expect(page.getByText('Desconto Aplicado')).toBeVisible();
  await expect(page.getByText('R$ 15.00')).toBeVisible();

  // 3. Test Tax Description Marketplace Name
  // Should see "(Tarifa Fixa Shopee)"
  await expect(page.getByText('(Tarifa Fixa Shopee)')).toBeVisible();

  // Switch to Mercado Livre
  // The locator is tricky because 'div' filter matches parent containers too.
  // Let's target the exact structure:
  // <div class="grid ..."> <Label>Marketplace</Label> <Select>...</Select> </div>
  // We can select the div that DIRECTLY contains the label "Marketplace".
  // But Playwright's filter matches if *any* descendant has text.
  // Let's use the nth match or a more precise chain.
  // The Marketplace select is the 4th one (Modalidade, Delivery, Marketplace, Markup...).
  // Wait, Markup has ID 'markupMultiplier'.
  // Marketplace does NOT have an ID on the trigger (SelectTrigger).
  // But we can find the label "Marketplace", get its parent, and find the button inside.
  // <div class="grid ...">
  //   <Label>Marketplace</Label>
  //   <Select ...> <SelectTrigger> ... </SelectTrigger> </Select>
  // </div>
  // So: page.locator('div', { has: page.getByText('Marketplace', { exact: true }) }).locator('button[role="combobox"]')
  // But since the parent div is inside CardContent, checking 'div' might still be too broad if not scoped.
  // However, the "grid w-full max-w-sm" div is specific enough if we filter by "Marketplace" label text ONLY inside it.
  
  // Actually, let's just use the fact that it currently has value "Shopee" and is NOT the delivery mode "Shopee Envios".
  // The button text is exactly "Shopee".
  // The other one is "Shopee Envios".
  const marketplaceSelect = page.getByRole('combobox').filter({ hasText: /^Shopee$/ });
  
  await marketplaceSelect.click();
  await expect(page.getByRole('option', { name: 'Mercado Livre' })).toBeVisible();
  await page.getByRole('option', { name: 'Mercado Livre' }).click();
  
  // Should see "(Tarifa Fixa Mercado Livre)" if fixed fee applies
  // Cost 110 -> Price ~165. > 79, so Fixed Fee is 0. 
  // Let's lower cost to trigger fixed fee. Cost = 20. Total = 30.
  await page.fill('input[id="costPrice"]', '20');
  // Price ~45. Fixed Fee applies (6.50 for 29-50 range).
  await expect(page.getByText('(Tarifa Fixa Mercado Livre)')).toBeVisible();

  // 4. Test Variations
  // Enable variations
  await page.getByLabel('É produto com variação?').check();
  
  // Add a variation
  await page.fill('input[placeholder="Variação (ex: P)"]', 'Var A');
  await page.fill('input[placeholder="Custo (R$)"]', '50');
  await page.fill('input[placeholder="Markup"]', '2');
  await page.getByRole('button', { name: 'Adicionar Variação' }).click();
  
  // Check if variation result card appears
  // Use specific title to find the card
  const varCard = page.locator('.shadow-xl', { hasText: 'Resultados das Variações' });
  await expect(varCard).toBeVisible();
  
  // Verify content inside the card
  await expect(varCard).toContainText('Var A');
  
  // Cost 50 + Pkg 10 = 60. Markup 2.0 -> Price 120.
  // Check Suggested Price in variation card
  // The table cell should contain "R$ 120.00"
  await expect(varCard).toContainText('R$ 120.00');

  // Variation Total Cost: 50 + 10 (pkg) = 60.
  await expect(varCard.getByText('Custo Total')).toBeVisible();
  await expect(varCard.getByText('R$ 60.00')).toBeVisible();

  // 5. Test Profit Table
  await expect(page.getByText('Projeção de Lucro')).toBeVisible();
  await expect(page.getByText('Unidades Vendidas')).toBeVisible();
  await expect(page.getByText('Lucro Estimado')).toBeVisible();
});

test('Verify Shopee Extra Commission and Low Price Fee', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // 1. Test Extra Commission
  // Note: Default marketplace is Mercado Livre. We must switch to Shopee to see "Comissões Extras" input.
  const marketplaceTrigger = page.getByRole('combobox').filter({ hasText: 'Mercado Livre' });
  if (await marketplaceTrigger.isVisible()) {
      await marketplaceTrigger.click();
      await page.getByRole('option', { name: 'Shopee' }).click();
  }

  // Set Cost 100
  await page.fill('input[id="costPrice"]', '100');
  
  // Check Suggested Price (Markup 1.5x default)
  // Suggested Price = (100 + 2) * 1.5 = 153.00.
  await expect(page.locator('p.text-5xl')).toContainText('R$ 153.00');

  // Now add Extra Commission 10%
  // Find input by placeholder "0" which is inside the "Comissões Extras" block or use specific locator if possible.
  // The input is near "Comissões Extras (%)".
  // Let's use getByPlaceholder('0') but be careful.
  // Or better, calculate input index or use label.
  // The label is "Comissões Extras (%)".
  // The input is in a div following the label?
  // Let's try filling by placeholder "0" (it's the only one with just "0" probably, others are "0,00" or "0.00").
  await page.fill('input[placeholder="0"]', '10');
  
  // Check Tax Description
  // Should see "+ 10% (Extra)"
  await expect(page.getByText('10% (Extra)')).toBeVisible();
  
  // Check Marketplace Fee Calculation
  // Standard Shopee: 14% + 6% = 20%.
  // With Extra: 20% + 10% = 30%.
  // 30% of 150 = 45.00.
  // Verify "Taxa Marketplace (30%)"
  await expect(page.getByText('Taxa Marketplace (30%)')).toBeVisible();
  // Verify value "- R$ 45.90" (30% of 153.00)
  await expect(page.getByText('- R$ 45.90')).toBeVisible();

  // 2. Test Low Price Fee (< R$8)
  // Clear inputs by reloading
  await page.reload();
  
  // Set Cost 1.00
  await page.fill('input[id="costPrice"]', '1');
  // Set Packaging 2.00
  await page.fill('input[id="packagingCost"]', '2');

  // Suggested Price
  // Cost 1 + Pkg 2 = 3. Markup 1.5 (Default) -> 4.50.
  await expect(page.locator('p.text-5xl')).toContainText('R$ 4.50');

  // Fixed Fee Calculation
  // Price < 8, so Fixed Fee = 50% of 4.50 = 2.25.
  // Check "Taxa Fixa" row
  const resultCard = page.locator('.shadow-xl', { hasText: 'Resultado da Precificação' });
  await expect(resultCard.getByText('- R$ 2.25')).toBeVisible();
});
