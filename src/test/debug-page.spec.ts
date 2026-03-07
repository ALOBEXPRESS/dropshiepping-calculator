import { test } from '@playwright/test';

test('Debug products page', async ({ page }) => {
  await page.goto('http://localhost:5174/produtos?e2e=true');
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-produtos-page-e2e.png', fullPage: true });
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get page URL
  console.log('Page URL:', page.url());
  
  // Check if there's any error message
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 1000 chars):', bodyText?.substring(0, 1000));
  
  // Check for product cards
  const productCards = page.locator('[data-product-id]');
  const count = await productCards.count();
  console.log('Product cards found:', count);
});
