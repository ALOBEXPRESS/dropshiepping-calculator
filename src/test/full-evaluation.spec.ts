import { test, expect } from '@playwright/test';

test.describe('Full Application Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=true');
    // Wait for animation
    await page.waitForTimeout(1000);
  });

  test('Should handle Paid Traffic (Fixed vs Percent) correctly', async ({ page }) => {
    // 1. Enable Paid Traffic
    const paidTrafficToggle = page.locator('button:has-text("Tráfego Pago")').first();
    await paidTrafficToggle.scrollIntoViewIfNeeded();
    await paidTrafficToggle.click();
    
    // 2. Set Cost Price to 100 for easy calculation
    await page.fill('#costPrice', '100');
    
    // 3. Set Paid Traffic to 20
    await page.fill('#paidTraffic', '20');
    
    // 4. Select "R$" (Fixed) within the paid traffic section
    const paidTrafficSection = page.locator('#paidTraffic').locator('xpath=ancestor::div[contains(@class,"grid")][1]');
    await paidTrafficSection.locator('button', { hasText: 'R$' }).first().click();
    
    // 5. Verify Calculation
    // Total Cost = 100 + 2 (pkg) = 102
    // Paid Traffic = 20 (Fixed)
    // Detailed list should show "- R$ 20.00"
    const trafficLabel = page.locator('text=Investimento Tráfego').first();
    await trafficLabel.scrollIntoViewIfNeeded();
    await expect(trafficLabel).toBeVisible();
    await expect(trafficLabel.locator('..').locator('span').last()).toContainText('20,00');
    
    // 6. Switch back to "%"
    await paidTrafficSection.locator('button', { hasText: '%' }).first().click();
    
    // 7. Verify Calculation
    // Value should change from the fixed 20,00 once percent is selected.
    const percentTrafficValue = trafficLabel.locator('..').locator('span').last();
    await expect(percentTrafficValue).toBeVisible();
    await expect(percentTrafficValue).not.toContainText('20,00');
  });

  test('Should have correct Markup Selector order', async ({ page }) => {
    // Open Markup Select
    // The trigger has id="markupMultiplier"
    await page.click('#markupMultiplier');
    
    // Get all options
    const options = await page.locator('[role="option"]').allTextContents();
    
    // Check first few options are negative
    expect(options[0]).toContain('-3.00x');
    expect(options[1]).toContain('-2.00x');
    expect(options[2]).toContain('-1.50x');
    expect(options[3]).toContain('-1.25x');
    expect(options[4]).toContain('0 (Automático');
  });

  test('Should display COMPARATIVO RÁPIDO with correct CPA', async ({ page }) => {
    // Enable Paid Traffic
    const paidTrafficToggle = page.locator('button:has-text("Tráfego Pago")').first();
    await paidTrafficToggle.scrollIntoViewIfNeeded();
    await paidTrafficToggle.click();
    
    // Set Cost Price
    await page.fill('#costPrice', '50');
    
    // Set Paid Traffic R$ 20
    await page.fill('#paidTraffic', '20');
    const paidTrafficSection = page.locator('#paidTraffic').locator('xpath=ancestor::div[contains(@class,"grid")][1]');
    await paidTrafficSection.locator('button', { hasText: 'R$' }).first().click();
    
    // Check CPA in Comparativo Rápido
    // Should contain "CPA = R$ 20.00" (plus any ads cost if enabled, assuming 0 ads for now)
    // The text is "CPA = R$ {totalCPA}"
    const cpaLine = page.locator('text=CPA = R$').first();
    await cpaLine.scrollIntoViewIfNeeded();
    await expect(cpaLine).toBeVisible();
    await expect(cpaLine).toContainText('20,00');
  });
});
