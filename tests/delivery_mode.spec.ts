import { test, expect } from '@playwright/test';

test('Verify Delivery Mode auto-selection and disabled state', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('domcontentloaded');

  // Find all comboboxes
  const comboboxes = page.getByRole('combobox');
  
  // Using indices based on stable DOM order in "Armazém Alob" mode:
  // 0: Operation Mode
  // 1: Delivery Mode
  // 2: Markup
  // 3: Marketplace
  
  const operationMode = comboboxes.nth(0);
  const deliveryMode = comboboxes.nth(1);
  const marketplace = comboboxes.nth(3);

  // Initial Checks
  await expect(operationMode).toBeVisible();
  await expect(operationMode).toHaveText(/Armazém Alob/);

  await expect(marketplace).toBeVisible();
  await expect(marketplace).toHaveText(/Mercado Livre/);

  await expect(deliveryMode).toBeVisible();
  await expect(deliveryMode).toHaveText(/Mercado Envios/);
  await expect(deliveryMode).toBeDisabled();

  // CHANGE MARKETPLACE to Shopee
  await marketplace.click();
  await page.getByRole('option', { name: 'Shopee', exact: true }).click();

  // CHECK: Delivery Mode should be "Shopee Envios" and disabled
  await expect(deliveryMode).toHaveText(/Shopee Envios/);
  await expect(deliveryMode).toBeDisabled();

  // CHANGE MARKETPLACE to Tiktok
  await marketplace.click();
  await page.getByRole('option', { name: 'Tiktok Shop' }).click();

  // CHECK: Delivery Mode should be "Tiktokshop" and disabled
  await expect(deliveryMode).toHaveText(/Tiktokshop/);
  await expect(deliveryMode).toBeDisabled();

  // CHANGE MARKETPLACE to Wordpress
  await marketplace.click();
  await page.getByRole('option', { name: 'Wordpress (Site)' }).click();

  // CHECK: Delivery Mode should be "AliExpress Standard Ship" and disabled
  await expect(deliveryMode).toHaveText(/AliExpress Standard Ship/);
  await expect(deliveryMode).toBeDisabled();
});
