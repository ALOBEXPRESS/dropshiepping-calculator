import { test, expect } from '@playwright/test';

test.describe('Product Variation Images - C1172', () => {
  test('should display different images when navigating through variations', async ({ page }) => {
    // Go directly to produtos page (assuming user is already logged in via session)
    await page.goto('/produtos');
    
    // Wait for products to load
    await page.waitForSelector('[data-product-id]', { timeout: 20000 });
    
    // Find the product card for C1172
    const productCard = page.locator('[data-product-id="8b9c4f82-d809-4ba5-9015-c4e5be922948"]').first();
    
    if (await productCard.count() === 0) {
      console.log('Product C1172 not found, trying by text...');
      const cardByText = page.locator('[data-product-id]').filter({ 
        hasText: 'STITCH' 
      }).first();
      await expect(cardByText).toBeVisible({ timeout: 5000 });
    } else {
      await expect(productCard).toBeVisible();
    }
    
    // Get the image container
    const imageContainer = productCard.locator('.h-36.w-36').first();
    const image = imageContainer.locator('img');
    
    // Store the initial image URL
    const initialImageSrc = await image.getAttribute('src');
    console.log('Initial image:', initialImageSrc);
    
    // Find and click the next arrow button
    const nextButton = imageContainer.locator('button:has-text("›")').or(imageContainer.locator('button').last());
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Get the first variation image
    const firstVariationImageSrc = await image.getAttribute('src');
    console.log('First variation image:', firstVariationImageSrc);
    
    // Verify the image changed
    expect(firstVariationImageSrc).not.toBe(initialImageSrc);
    
    // Click next again
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Get the second variation image
    const secondVariationImageSrc = await image.getAttribute('src');
    console.log('Second variation image:', secondVariationImageSrc);
    
    // Verify the image changed again
    expect(secondVariationImageSrc).not.toBe(firstVariationImageSrc);
    
    // Click next one more time
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Get the third variation image
    const thirdVariationImageSrc = await image.getAttribute('src');
    console.log('Third variation image:', thirdVariationImageSrc);
    
    // Verify the image changed again
    expect(thirdVariationImageSrc).not.toBe(secondVariationImageSrc);
    
    console.log('All images:', {
      initial: initialImageSrc,
      first: firstVariationImageSrc,
      second: secondVariationImageSrc,
      third: thirdVariationImageSrc
    });
  });
});
