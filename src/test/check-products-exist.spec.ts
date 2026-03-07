import { test, expect } from '@playwright/test';

test.describe('Check Products Exist', () => {
  test('Should load products page and show product cards', async ({ page }) => {
    await page.goto('http://localhost:5174/produtos');
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load
    const productCards = page.locator('[data-product-id]');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    
    // Count how many products are visible
    const count = await productCards.count();
    console.log(`Found ${count} product cards`);
    
    // List all product names
    for (let i = 0; i < Math.min(count, 10); i++) {
      const card = productCards.nth(i);
      const name = await card.locator('p.text-base.font-bold').first().textContent();
      console.log(`Product ${i + 1}: ${name}`);
    }
    
    expect(count).toBeGreaterThan(0);
  });

  test('Should find BLS102030 or 2023596165 products', async ({ page }) => {
    await page.goto('http://localhost:5174/produtos');
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load
    await page.waitForSelector('[data-product-id]', { timeout: 15000 });
    
    // Try to find BLS102030
    const bls102030 = page.locator('[data-product-id]').filter({ 
      has: page.locator('text=/Anne/i') 
    });
    const bls102030Count = await bls102030.count();
    console.log(`Found ${bls102030Count} cards matching "Anne"`);
    
    // Try to find 2023596165
    const jessica = page.locator('[data-product-id]').filter({ 
      has: page.locator('text=/Jéssica/i') 
    });
    const jessicaCount = await jessica.count();
    console.log(`Found ${jessicaCount} cards matching "Jéssica"`);
    
    // At least one should exist
    expect(bls102030Count + jessicaCount).toBeGreaterThan(0);
  });
});
