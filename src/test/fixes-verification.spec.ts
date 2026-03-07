import { test, expect } from '@playwright/test';

test.describe('Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console log listening
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    await page.goto('/?e2e=true');
    await page.waitForTimeout(2000);
  });

  test('Organic Traffic should NOT include Paid Traffic Gateway Fees', async ({ page }) => {
    // 1. Ensure Organic Mode is selected (default)
    const organicBtn = page.locator('button:has-text("Tráfego Orgânico")');
    await expect(organicBtn).toHaveClass(/bg-/);

    // 2. Set some values that would trigger calculations
    await page.fill('#costPrice', '100');
    await page.waitForTimeout(1000);

    // 3. Verify Paid Traffic Gateway Fee is NOT visible
    // The element is "Taxa de Gateway -> Tráfego Pago"
    // It should NOT be present.
    const feeElement = page.locator('text=Taxa de Gateway -> Tráfego Pago');
    const count = await feeElement.count();
    console.log(`Found ${count} fee elements`);
    if (count > 0) {
        for(let i=0; i<count; i++) {
             const text = await feeElement.nth(i).textContent();
             const visible = await feeElement.nth(i).isVisible();
             console.log(`Element ${i} text: "${text}", visible: ${visible}`);
             // Also log the parent text to see context
             const parentText = await feeElement.nth(i).locator('..').textContent();
             console.log(`Element ${i} parent text: "${parentText}"`);
        }
    }
    await expect(feeElement).toHaveCount(0);
  });

  test('Enjoei Inactivity Fee Logic', async ({ page }) => {
    // 1. Select Enjoei Marketplace
    // Use data-testid if available, or role
    const trigger = page.locator('button[data-testid="marketplace-select-trigger"]').first();
    // If testid not found (maybe not in built code if I didn't build after adding it?), fallback
    const fallbackTrigger = page.locator('button[role="combobox"]').first();
    
    if (await trigger.isVisible()) {
        await trigger.click();
        console.log('Clicked trigger');
    } else {
        await fallbackTrigger.click();
        console.log('Clicked fallback trigger');
    }
    
    await page.waitForTimeout(1000); // Wait for animation

    // DEBUG: List all options
    const options = page.locator('div[role="option"]');
    const count = await options.count();
    console.log(`Found ${count} options`);
    for(let i=0; i<count; i++) {
        console.log(`Option ${i}: ${await options.nth(i).textContent()}`);
    }
    
    // Select Enjoei option
    // Try getByRole which is standard
    const option = page.getByRole('option', { name: 'Enjoei' });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();

    // 2. Set Cost Price to a stable value
    await page.fill('#costPrice', '100');

    // 3. Verify Enjoei Specific Inputs are visible
    await expect(page.locator('text=Configurações Enjoei')).toBeVisible({ timeout: 5000 });

    // 4. Test Inactivity Fee Threshold (>= 2 months)
    await page.fill('#enjoeiInactivity', '1');
    await page.waitForTimeout(1000);
    
    const fixedFeeLocator = page.locator('text=Taxa Fixa').locator('..').locator('span').last();
    const feeText1 = await fixedFeeLocator.textContent();
    const fee1 = parseFloat((feeText1 || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    console.log(`Fee 1 Month: ${feeText1} -> ${fee1}`);

    await page.fill('#enjoeiInactivity', '2');
    await page.waitForTimeout(1000);
    
    const fixedFeeLocator2 = page.locator('text=Taxa Fixa').locator('..').locator('span').last();
    const feeText2 = await fixedFeeLocator2.textContent();
    const fee2 = parseFloat((feeText2 || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    console.log(`Fee 2 Months: ${feeText2} -> ${fee2}`);

    // Difference should be approx 22 (11 * 2) if fee1 had 0 inactivity.
    expect(fee2 - fee1).toBeCloseTo(22, 1);
  });

  test('PicPay Installment Fee Calculation', async ({ page }) => {
    // 1. Select PicPay Bank using test id
    const picpayBtn = page.locator('button[data-testid="gateway-bank-picpay"]');
    await expect(picpayBtn).toBeVisible({ timeout: 5000 });
    await picpayBtn.click();

    // 2. Select Method (Pix Credit) using test id
    const methodBtn = page.locator('button[data-testid="gateway-method-pix-credit"]');
    await expect(methodBtn).toBeVisible({ timeout: 5000 });
    await methodBtn.click();

    // 3. Set Installments to 2
    const installmentsInput = page.locator('input[type="number"][min="1"][max="12"]');
    await expect(installmentsInput).toBeVisible();
    await installmentsInput.fill('2');

    // 4. Set Cost Price to trigger calc
    await page.fill('#costPrice', '100');
    await page.waitForTimeout(1500);

    // 5. Verify Gateway Fee Display
    const gatewayFeeLabel = page.locator('text=Taxa de Gateway - Compra');
    await expect(gatewayFeeLabel).toBeVisible();
    
    const gatewayFeeValueLocator = gatewayFeeLabel.locator('..').locator('span').last();
    const text = await gatewayFeeValueLocator.textContent();
    console.log(`Gateway Fee Text: ${text}`);
    
    expect(text).not.toBeNull();
    expect(text).toMatch(/- R\$ \d+,\d{2}/);
  });
});
