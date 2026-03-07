import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('Animation and UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Collapsible sections toggle correctly', async ({ page }) => {
    // Check if body is empty (debug)
    await expect(page.locator('body')).not.toBeEmpty();
    
    // Check if main title exists
    await expect(page.getByText('Calculadora de Precificação')).toBeVisible();

    // Check Shopee Table Header
    // Find the header text that we click
    const shopeeHeader = page.getByText('Tabela de Margem Recomendada por Faixa de Preço (Shopee)');
    await expect(shopeeHeader).toBeVisible({ timeout: 10000 });
    
    // Initial state: Content should be hidden
    // Check the wrapper div style or size
    const contentWrapper = page.locator('.collapsible-content').first();
    await expect(contentWrapper).toHaveCSS('height', '0px');
    
    // Click to open
    await shopeeHeader.click();
    
    // Wait for animation
    await page.waitForTimeout(1000);
    
    // Content should be visible (height not 0)
    await expect(contentWrapper).not.toHaveCSS('height', '0px');
    
    // Click to close
    await shopeeHeader.click();
    await page.waitForTimeout(1000);
    
    // Should be hidden again
    await expect(contentWrapper).toHaveCSS('height', '0px');
  });

  test('Results Panel Colors and Fonts', async ({ page }) => {
    // Wait a bit for animations
    await page.waitForTimeout(1000);

    // Fill minimum data to get a result
    await page.fill('#productName', 'Produto Teste');
    await page.fill('#costPrice', '50');

    // Select markup to get a result
    // Use ID directly if available, checking code...
    // <Select ... onValueChange={setMarkupMultiplier}> ... <SelectTrigger id="markupMultiplier">
    // Shadcn Select uses a hidden input or we click the trigger.
    // Playwright interacting with Radix UI Select:
    // Click trigger, then click option.
    
    // Find the trigger
    await page.locator('button[role="combobox"]').filter({ hasText: /1.5|Markup/ }).first();
    // Or finding by label
    // The SelectTrigger might not have the ID, the Label has htmlFor.
    
    // Let's try finding the trigger by the label
    // <Label htmlFor="markupMultiplier">...
    // <Select> <SelectTrigger id="markupMultiplier">
    
    await page.click('#markupMultiplier');
    await page.getByRole('option', { name: '1.5x' }).click();

    // Check Suggested Price Panel
    page.locator('text=Preço de Venda Sugerido').locator('..').locator('..').locator('..');
    
    // Check for correct background class (default/good should be light green #DCFCE7 or similar)
    // Since we used dynamic classes, we can check for the presence of the class or computed style.
    // Our code: 'bg-[#DCFCE7] border-green-200'
    // Playwright interacting with Radix UI Select:
    // Click trigger, then click option.
    
    // Check Profit/Margin Panel
    const profitLabel = page.locator('text=Lucro Líquido');
    await expect(profitLabel).toHaveClass(/font-bold/);
    await expect(profitLabel).toHaveClass(/text-xl/); // We added text-xl
    
    page.locator('text=R$').nth(1); // Approximate
    // Better locator:
    const profitContainer = page.locator('text=Lucro Líquido').locator('..');
    await expect(profitContainer).toHaveClass(/animate-on-scroll/);
    
    // Check High Contrast (Black text on Light Green)
    // We can't easily check computed color without eval, but we can check the class 'text-black' is present if not negative.
    // Default margin 50% is "Good" (usually), so it should be text-black.
    await expect(profitContainer.locator('span').first()).toHaveClass(/text-black/);
  });
});
