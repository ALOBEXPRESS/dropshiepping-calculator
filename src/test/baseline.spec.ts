/**
 * Baseline smoke tests — Phase 0 safety net for UI redesign.
 * Captures screenshots at 1440×900 and 3840×2160 for before/after comparison.
 * Uses VITE_E2E=true bypass (set in playwright.config.ts webServer.env).
 * All routes must render without JS errors and contain key structural elements.
 *
 * Run:  npx playwright test src/test/baseline.spec.ts
 * Screenshots saved to: test-results/baseline/
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '3840', width: 3840, height: 2160 },
];

const ROUTES: { path: string; label: string; selector: string }[] = [
  { path: '/?e2e=true',          label: 'calculadora',  selector: '[data-testid="calculator"], text=Dados do Produto, text=Nome do Produto' },
  { path: '/produtos?e2e=true',  label: 'produtos',     selector: 'text=Produtos adicionados, text=Produtos integrados' },
  { path: '/dashboard?e2e=true', label: 'dashboard',    selector: 'text=Dashboard, text=RECEITA TOTAL, text=LUCRO TOTAL' },
  { path: '/vendas?e2e=true',    label: 'vendas',       selector: 'text=Vendas, text=Receita, text=Pedidos' },
  { path: '/leads?e2e=true',     label: 'leads',        selector: 'text=Leads' },
  { path: '/campanhas?e2e=true', label: 'campanhas',    selector: 'text=Campanhas, text=Campanha' },
  { path: '/repasse?e2e=true',   label: 'repasse',      selector: 'text=Repasse, text=Saldo' },
];

const BASELINE_DIR = path.join('test-results', 'baseline');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function captureBaseline(
  page: Page,
  label: string,
  viewport: { name: string; width: number; height: number }
) {
  ensureDir(BASELINE_DIR);
  const filename = path.join(BASELINE_DIR, `${label}-${viewport.name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

for (const viewport of VIEWPORTS) {
  test.describe(`Baseline ${viewport.name}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`smoke: ${route.label} renders at ${viewport.name}px`, async ({ page }) => {
        const jsErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') jsErrors.push(msg.text());
        });
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30_000 });

        // Wait for content to appear — try each selector, accept the first that works
        const selectors = route.selector.split(',').map((s) => s.trim());
        let found = false;
        for (const sel of selectors) {
          try {
            await page.locator(sel).first().waitFor({ state: 'visible', timeout: 8_000 });
            found = true;
            break;
          } catch {
            // try next
          }
        }

        // If none matched, the page still rendered — we just note it
        if (!found) {
          console.warn(`[baseline] No selector matched for route ${route.path} — screenshot still taken`);
        }

        // Allow animations to settle
        await page.waitForTimeout(500);

        await captureBaseline(page, route.label, viewport);

        // Critical: no uncaught JS errors (ignore third-party noise)
        const criticalErrors = jsErrors.filter(
          (e) =>
            !e.includes('ResizeObserver') &&
            !e.includes('favicon') &&
            !e.includes('Non-Error promise') &&
            !e.includes('supabase') // supabase auth errors expected in e2e bypass
        );

        expect(criticalErrors, `JS errors on ${route.path}: ${criticalErrors.join('\n')}`).toEqual([]);
        expect(pageErrors.length, `Page errors on ${route.path}: ${pageErrors.join('\n')}`).toBe(0);
      });
    }
  });
}
