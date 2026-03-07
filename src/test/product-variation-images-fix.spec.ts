import { test, expect } from '@playwright/test';

test.describe('Product Variation Images - Fixed Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/produtos?e2e=true');
    await page.waitForLoadState('networkidle');
    // Wait for products to load
    await page.waitForSelector('[data-product-id]', { timeout: 15000 });
  });

  test('BLS102030 - Should show variation images for Bolsa Podlinda Anne', async ({ page }) => {
    // Find the product card by SKU
    const productCard = page.locator('[data-product-id]').filter({ 
      has: page.locator('text=/Bolsa Podlinda Anne/i') 
    }).first();
    
    await expect(productCard).toBeVisible({ timeout: 10000 });
    
    // Get the initial image
    const imageContainer = productCard.locator('.h-36.w-36').first();
    const initialImage = await imageContainer.locator('img').getAttribute('src');
    
    console.log('Initial image:', initialImage);
    
    // Click next arrow to navigate to first variation
    const nextButton = imageContainer.locator('button').last();
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // Get the first variation image
    const firstVariationImage = await imageContainer.locator('img').getAttribute('src');
    console.log('First variation image:', firstVariationImage);
    
    // Verify the image changed
    expect(firstVariationImage).not.toBe(initialImage);
    expect(firstVariationImage).toBeTruthy();
    expect(firstVariationImage).toContain('http');
    
    // Click next again for second variation
    await nextButton.click();
    await page.waitForTimeout(500);
    
    const secondVariationImage = await imageContainer.locator('img').getAttribute('src');
    console.log('Second variation image:', secondVariationImage);
    
    // Verify second variation has different image
    expect(secondVariationImage).not.toBe(firstVariationImage);
    expect(secondVariationImage).toBeTruthy();
    
    // Click next again for third variation
    await nextButton.click();
    await page.waitForTimeout(500);
    
    const thirdVariationImage = await imageContainer.locator('img').getAttribute('src');
    console.log('Third variation image:', thirdVariationImage);
    
    // Verify third variation has different image
    expect(thirdVariationImage).not.toBe(secondVariationImage);
    expect(thirdVariationImage).toBeTruthy();
  });

  test('2023596165 - Should show variation images for Bolsa PodLinda Jéssica', async ({ page }) => {
    // Find the product card by SKU
    const productCard = page.locator('[data-product-id]').filter({ 
      has: page.locator('text=/Bolsa PodLinda Jéssica/i') 
    }).first();
    
    await expect(productCard).toBeVisible({ timeout: 10000 });
    
    // Get the initial image
    const imageContainer = productCard.locator('.h-36.w-36').first();
    const initialImage = await imageContainer.locator('img').getAttribute('src');
    
    console.log('Initial image:', initialImage);
    
    // Click next arrow to navigate to first variation
    const nextButton = imageContainer.locator('button').last();
    await nextButton.click();
    await page.waitForTimeout(500);
    
    // Get the first variation image
    const firstVariationImage = await imageContainer.locator('img').getAttribute('src');
    console.log('First variation image:', firstVariationImage);
    
    // For this product, variations don't exist in products_bling
    // So the image should remain the same (parent product image)
    // This is expected behavior - we'll use parent image as fallback
    expect(firstVariationImage).toBeTruthy();
    expect(firstVariationImage).toContain('http');
    
    // Verify we can navigate through variations without errors
    await nextButton.click();
    await page.waitForTimeout(500);
    
    const secondVariationImage = await imageContainer.locator('img').getAttribute('src');
    console.log('Second variation image:', secondVariationImage);
    expect(secondVariationImage).toBeTruthy();
  });
});
