import { test, expect } from '@playwright/test';

test('UI Color Logic and Video Opacity', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Verify Video Opacity (should be 30% and mix-blend-overlay)
  const videoElement = page.locator('video');
  await expect(videoElement).toHaveClass(/opacity-30/);
  await expect(videoElement).toHaveClass(/mix-blend-overlay/);

  // 2. Setup inputs for color testing
  await page.fill('input[id="costPrice"]', '50');
  
  // Wait for calculations
  const profitLabel = page.getByText('Lucro Líquido', { exact: true });
  await expect(profitLabel).toBeVisible();

  // Test Case 1: Default (Auto Calc) -> Should be Green (Good/Default)
  // We need to set Markup to '0' (Automatic) to ensure it targets the recommended margin.
  // First, find the Markup Select Trigger (it defaults to 1.5x)
  const markupTrigger = page.locator('button[role="combobox"]').filter({ hasText: '1.5x' });
  // If not found by text (maybe loaded differently), try by label proximity
  // But let's assume default is 1.5x.
  await markupTrigger.click();
  // Select option '0'
  await page.getByRole('option', { name: '0 (Automático / Margem Recomendada)' }).click();

  // Now Suggested Price should be auto-calculated to give ~25% margin.
  // Check Suggested Price Box Color
  const suggestedPriceBox = page.locator('div.rounded-xl.p-5.border.shadow-sm').first();
  await expect(suggestedPriceBox).toHaveClass(/bg-\[#DCFCE7\]/); // Green

  // Check Profit Box Color
  const profitContainer = profitLabel.locator('..');
  // Should be Green because margin is ~25% (Good)
  await expect(profitContainer).toHaveClass(/bg-\[#DCFCE7\]/);

  // Test Case 2: Manual Price High (Excellent Margin)
  await page.fill('input[id="manualSellingPrice"]', '200'); // High price -> High margin
  // Should turn Blue (#25f4ee)
  await expect(suggestedPriceBox).toHaveClass(/bg-\[#25f4ee\]/);
  await expect(profitContainer).toHaveClass(/bg-\[#25f4ee\]/);

  // Test Case 3: Manual Price Low (Low Margin but Positive)
  // Cost 50. Rec Margin 25%. Target Price ~90.
  // Set Price 75.
  // Fees (ML): ~12% + Fixed(0 if >79? No, 75 < 79 so Fixed applies)
  // If < 79, Fixed = 6.
  // Fees = 75*0.12 + 6 + 75*0.05 = 9 + 6 + 3.75 = 18.75.
  // Net = 75 - 18.75 - 50 = 6.25.
  // Margin = 6.25/75 = 8.3%.
  // 8.3% < 24.5% -> Low (Yellow).
  await page.fill('input[id="manualSellingPrice"]', '75'); 
  // Should turn Yellow
  await expect(suggestedPriceBox).toHaveClass(/bg-yellow-400/);
  // Profit box: If margin is low (but positive), it should be default green (bg-green-600)
  // Logic: negative? Red. excellent? Blue. else Green.
  // So Yellow status -> Green box.
  await expect(profitContainer).toHaveClass(/bg-\[#DCFCE7\]/);

  // Test Case 4: Manual Price Very Low (Negative Profit)
  await page.fill('input[id="manualSellingPrice"]', '40'); // Below cost (50)
  // Should turn Red
  await expect(suggestedPriceBox).toHaveClass(/bg-red-600/);
  await expect(profitContainer).toHaveClass(/bg-red-600/);
});
