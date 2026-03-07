import { test, expect } from '@playwright/test';

test('UI Colors and Video', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 1. Verify Video Background Source
  const video = page.locator('video source');
  await expect(video).toHaveAttribute('src', /dollar%20animate%20real.mp4/);
  
  // 2. Verify Video Opacity
  const videoElement = page.locator('video');
  await expect(videoElement).toHaveClass(/opacity-30/);

  // 3. Verify Gradient Overlay
  // The div preceding the video should have the gradient class
  const gradientOverlay = page.locator('.bg-gradient-to-b');
  await expect(gradientOverlay).toBeVisible();

  // 4. Verify Profit/Margin Colors
  // Need to calculate to show results first
  await page.fill('input[id="costPrice"]', '50');
  
  const profitLabel = page.getByText('Lucro Líquido', { exact: true });
  const profitContainer = profitLabel.locator('..');
  // Check for light green #DCFCE7
  await expect(profitContainer).toHaveClass(/bg-\[#DCFCE7\]/);

  const marginLabel = page.getByText('Margem de Lucro', { exact: true });
  const marginContainer = marginLabel.locator('..');
  // Check for light green #DCFCE7
  await expect(marginContainer).toHaveClass(/bg-\[#DCFCE7\]/);
});
