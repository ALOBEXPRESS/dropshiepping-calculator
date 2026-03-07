import { test, expect } from '@playwright/test';

test('Dropshipping Calculator Functionality with Shadcn UI', async ({ page }) => {
  // 1. Start application
  await page.goto('http://localhost:5173');

  // 2. Verify initial state of result panel (gray background)
  // We look for the Card that contains "Resultado da Precificação"
  const resultCard = page.locator('.shadow-xl', { hasText: 'Resultado da Precificação' });
  await expect(resultCard).toHaveClass(/bg-gray-500/);
  await expect(resultCard).not.toHaveClass(/from-green-600/);

  // 3. Fill Cost Price to activate calculation
  // Shadcn Input is a standard input, can use fill
  await page.fill('input[id="costPrice"]', '50');

  // 4. Verify panel color change (to vibrant pink)
  await expect(resultCard).toHaveClass(/bg-\[#d91c42\]/);

  // 5. Test Marketplace Selection (Shadcn Select)
  // Initially Shopee. Change to Mercado Livre then back to Shopee to test interaction?
  // Or just verify Shopee elements are present.
  // Let's test interaction: Open// 5. Test Marketplace Selection (Shadcn Select)
  // Initially, it is 'Mercado Livre' (based on recent defaults update)
  const marketplaceTrigger = page.locator('button[role="combobox"]').filter({ hasText: 'Mercado Livre' }).first();
  await expect(marketplaceTrigger).toBeVisible();

  // Change to Shopee for further tests (since original tests assumed Shopee defaults)
  await marketplaceTrigger.click();
  await page.getByRole('option', { name: 'Shopee' }).click();
  
  // Now verify it is Shopee
  const shopeeTrigger = page.locator('button[role="combobox"]').filter({ hasText: 'Shopee' }).first();
  await expect(shopeeTrigger).toBeVisible();
  // 6. Test Category Selection (Shadcn Select)
  // Label "Categoria (Estimativa de CPC)"
  // Trigger should show "Eletrônicos" initially
  const categoryTrigger = page.locator('button[role="combobox"]').filter({ hasText: 'Eletrônicos' });
  await categoryTrigger.click();
  
  // Select "Moda e Acessórios" from the dropdown content
  await page.getByRole('option', { name: 'Moda e Acessórios' }).click();

  // 7. Activate Shopee Ads (Shadcn Checkbox)
  // Label "Calcular Shopee Ads"
  const adsCheckbox = page.getByRole('checkbox', { name: 'Calcular Shopee Ads' });
  await adsCheckbox.click();

  // 8. Verify Inputs update based on category
  // Moda: CPC 0.35
  const cpcInput = page.locator('input[placeholder="0.40"]'); 
  await expect(cpcInput).toHaveValue('0.35');

  // Fill Budget and Sales to calculate CPA
  const budgetInput = page.locator('input[placeholder="10.00"]');
  await budgetInput.fill('20');
  
  // The sales input is inside the ads section.
  // Let's use a better selector if possible or rely on order.
  // The structure is: CPC, Budget, Sales.
  // Or label "Quantidade de Vendas (Para Cálculo de CR)"
  await page.getByLabel('Quantidade de Vendas (Para Cálculo de CR)').fill('2');

  // 9. Verify CPA Calculation
  // Budget 20 / Sales 2 = 10.00
  await expect(page.getByText('CPA (Custo por Aquisição)')).toBeVisible();
  await expect(page.getByText('R$ 10.00', { exact: true })).toBeVisible();

  // 10. Verify Mercado Livre Table
  await expect(page.getByText('Tabela de Margem Recomendada (Mercado Livre)')).toBeVisible();

  console.log('All Shadcn UI tests passed successfully!');
});
