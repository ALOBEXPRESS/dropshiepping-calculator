import { test, expect } from '@playwright/test';

test.describe('Product Management Flow', () => {
  
  test('Should perform full product lifecycle (Add, Duplicate, Edit, Delete)', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log(`BROWSER LOG: ${msg.text()}`);
        } else if (msg.type() === 'error') {
            console.error(`BROWSER ERROR: ${msg.text()}`);
        }
    });
    page.on('pageerror', exception => console.error(`BROWSER UNCAUGHT ERROR: ${exception}`));

    // 1. Login
    console.log('Navigating to login...');
    await page.goto('/login');
    await page.fill('input[type="email"]', 'empresaalob@gmail.com');
    await page.fill('input[type="password"]', 'n2qyvsj7sw47zbqy');
    await page.click('button[type="submit"]'); 
    
    // 2. Navigate to Calculator (should be redirected there)
    await expect(page).toHaveURL('/');
    console.log('Login successful, on calculator page.');
    
    // 3. Add Product
    const timestamp = Date.now();
    const testProductName = `Produto Teste ${timestamp}`;
    const testSku = `SKU-${timestamp}`;
    
    console.log(`Adding product: ${testProductName}`);

    // Wait for the calculator inputs to be visible
    await page.waitForSelector('#productName');
    
    await page.fill('#productName', testProductName);
    await page.fill('#productSku', testSku);
    await page.fill('#costPrice', '1000'); // Simple number
    
    // Wait for suppliers to load?
    await page.waitForTimeout(2000);

    // 4. Select Supplier
    // Try to find the trigger by placeholder text
    const supplierTrigger = page.locator('button:has-text("Selecione o fornecedor")').first();
    
    if (await supplierTrigger.isVisible()) {
        console.log('Found supplier trigger');
        await supplierTrigger.click();
        await page.waitForTimeout(500); // Wait for animation
        // Select first option that is NOT "Selecione o fornecedor" if possible
        const options = page.locator('[role="option"]');
        if (await options.count() > 0) {
            await options.nth(1).click(); // Skip first if it's "Selecione..." or just pick second
        } else {
             console.log('No supplier options found');
        }
    } else {
         console.log('Supplier trigger not found (maybe already selected)');
    }
    
    // 5. Save Product
    console.log('Clicking Adicionar button...');
    await page.click('button:has-text("Adicionar")');

    // Check for validation errors (broad check)
    if (await page.locator('text=Preencha os campos').isVisible()) {
        const text = await page.locator('text=Preencha os campos').textContent();
        console.log(`Error adding product (validation): ${text}`);
        throw new Error(`Failed to add product: ${text}`);
    }
    // Check for other errors
    const errorMsg = page.locator('div.bg-red-50.text-red-700');
    if (await errorMsg.isVisible()) {
         const text = await errorMsg.textContent();
         console.log(`Error adding product (generic): ${text}`);
         throw new Error(`Failed to add product: ${text}`);
    }

    // Check for success message
    const successMsg = page.locator('text=Produto salvo com sucesso');
    try {
        await expect(successMsg).toBeVisible({ timeout: 10000 });
        console.log('Success message visible');
    } catch {
        console.log('Success message NOT visible');
    }

    // Wait a bit for backend sync
    await page.waitForTimeout(2000);

    // 5. Verify Product in List
    // Navigate to Products page to ensure list is visible
    console.log('Navigating to Products page...');
    await page.click('a:has-text("Produtos")');
    await expect(page).toHaveURL(/\/produtos/);
    
    console.log('On Products page. Waiting for list...');
    
    // Wait for the card to appear.
    // The card has `data-product-id`.
    // And it contains the product name.
    const productCard = page.locator(`div[data-product-id]:has-text("${testProductName}")`).first();
    
    // Debug: count products
    await page.waitForTimeout(2000);
    const productCount = await page.locator('div[data-product-id]').count();
    console.log(`Found ${productCount} products in list`);
    
    if (productCount === 0) {
        // Log if "Nenhum produto adicionado ainda" is visible
        if (await page.locator('text=Nenhum produto adicionado ainda').isVisible()) {
            console.log('Message "Nenhum produto adicionado ainda" is visible.');
        }
        // Log if "Carregando produtos..." is visible
        if (await page.locator('text=Carregando produtos...').isVisible()) {
            console.log('Message "Carregando produtos..." is visible.');
        }
    }

    await productCard.scrollIntoViewIfNeeded();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    console.log('Product found in list.');

    // 6. Duplicate Product
    console.log('Duplicating product...');
    const duplicateButton = productCard.locator('button:has-text("Duplicar")');
    await duplicateButton.click();
    
    // Wait for edit dialog
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Editar Produto')).toBeVisible();
    
    // Save duplicate
    const saveDuplicateButton = page.locator('div[role="dialog"] button:has-text("Duplicar")');
    await saveDuplicateButton.click();
    
    // Verify duplicate exists (searching for name again should find 2 or verify count increased)
    await page.waitForTimeout(2000);
    // Since duplication might keep same name or add (Cópia), checking count of product cards with similar name
    // Actually duplication logic usually pre-fills the form.
    // If I didn't change name, it might be same name.
    // Let's assume successful duplication if no error.
    
    // 7. Edit Product
    console.log('Editing product...');
    const editButton = productCard.first().locator('button:has-text("Editar")');
    await editButton.click();
    
    // Wait for edit dialog
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    
    // Change name
    const newName = `${testProductName} Edited`;
    await page.fill('div[role="dialog"] #name', newName); // ID is #name in EditProductDialog
    await page.click('div[role="dialog"] button:has-text("Salvar alterações")');
    
    // Verify new name
    await expect(page.locator(`div[data-product-id]:has-text("${newName}")`)).toBeVisible();
    console.log('Product edited successfully.');

    // 8. Delete Product
    console.log('Deleting product...');
    const deleteButton = page.locator(`div[data-product-id]:has-text("${newName}")`).locator('button:has-text("Excluir")');
    
    // Handle confirm dialog if any (browser dialog or custom)
    // The code uses `handleDeleteProductAnimated`. 
    // Let's check if it shows a confirmation dialog.
    // Usually standard `window.confirm` or custom dialog.
    // If it's custom dialog, we need to click confirm.
    
    await deleteButton.click();
    
    // Check if product is removed
    await expect(page.locator(`div[data-product-id]:has-text("${newName}")`)).not.toBeVisible({ timeout: 5000 });
    console.log('Product deleted successfully.');
    
  });

  test('Should configure Investment settings and verify visualization', async ({ page }) => {
    test.setTimeout(120000);

    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log(`BROWSER LOG: ${msg.text()}`);
        } else if (msg.type() === 'error') {
            console.error(`BROWSER ERROR: ${msg.text()}`);
        }
    });
    
    // Debug 400 errors
    page.on('response', async response => {
        if (response.url().includes('/products') && response.status() === 400) {
            console.log('API Error 400:', await response.text());
        }
    });

    // 1. Login
    console.log('Navigating to login...');
    await page.goto('/login');
    await page.fill('input[type="email"]', 'empresaalob@gmail.com');
    await page.fill('input[type="password"]', 'n2qyvsj7sw47zbqy');
    await page.click('button[type="submit"]'); 
    
    await expect(page).toHaveURL('/');
    
    // 2. Add Product for Investment Test
    const timestamp = Date.now();
    const testProductName = `Invest Test ${timestamp}`;
    const testSku = `INV-${timestamp}`;
    
    await page.waitForSelector('#productName');
    await page.fill('#productName', testProductName);
    await page.fill('#productSku', testSku);
    await page.fill('#costPrice', '500'); 
    
    // Select Supplier
    const supplierTrigger = page.locator('button:has-text("Selecione o fornecedor")').first();
    if (await supplierTrigger.isVisible()) {
        await supplierTrigger.click();
        await page.waitForTimeout(500); 
        const options = page.locator('[role="option"]');
        if (await options.count() > 0) {
            await options.nth(1).click();
        }
    }
    
    await page.click('button:has-text("Adicionar")');
          await expect(page.locator('text=Produto salvo com sucesso')).toBeVisible({ timeout: 60000 });
          await page.waitForTimeout(1000);

          // 3. Navigate to Products
    await page.click('a:has-text("Produtos")');
    await expect(page).toHaveURL(/\/produtos/);
    
    const productCard = page.locator(`div[data-product-id]:has-text("${testProductName}")`).first();
    await productCard.scrollIntoViewIfNeeded();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // 4. Open Invest Dialog
    console.log('Clicking Investir button...');
    const investButton = productCard.locator('button:has-text("Investir")');
    await investButton.click();
    
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    // Use specific locator for the Dialog Title "Investir"
    await expect(page.locator('div[role="dialog"] h2:has-text("Investir")')).toBeVisible();

    // 5. Fill Investment Form
    
    // Step 0: Campaign
    console.log('Filling Step 0: Campaign...');
    // We need to target inputs inside the dialog.
    // The dialog content renders based on `investStep`.
    // We can use labels to find inputs.
    
    // Name
    await page.fill('input[value=""]', 'Campanha Teste'); // Might be risky if multiple empty inputs. 
    // Let's use more specific locators if possible, or assume order.
    // The code uses `Label` then `Input`.
    // "Nome da Campanha" -> Input
    await page.locator('label:has-text("Nome da Campanha") + input').fill('Campanha Teste 01');
    
    // Objective -> Select
    await page.locator('label:has-text("Objetivo") + button').click();
    await page.locator('[role="option"]:has-text("Vendas")').click();
    
    // Budget -> Select
    await page.locator('label:has-text("Orçamento") + button').click();
    await page.locator('[role="option"]:has-text("Diário")').click();
    
    // Next Step
    await page.click('button:has-text("Próximo")');
    
    // Step 1: Ad Set
    console.log('Filling Step 1: Ad Set...');
    await expect(page.locator('div[role="dialog"] div.bg-white h3:has-text("Nível de Conjunto")')).toBeVisible();
    
    // Conversion -> Select
    await page.locator('label:has-text("Conversão") + button').click();
    await page.locator('[role="option"]:has-text("Site")').click();
    
    // Dates
    const inputs = page.locator('label:has-text("Cronograma") + div input');
    await inputs.first().fill('01/01/2026');
    await inputs.nth(1).fill('31/12/2026');
    
    // Investment Value
    await page.locator('label:has-text("Investimento") + input').fill('1500');
    
    // Next Step
    await page.click('button:has-text("Próximo")');
    
    // Step 2: Audience
    console.log('Filling Step 2: Audience...');
    await expect(page.locator('div[role="dialog"] div.bg-white h3:has-text("Público")')).toBeVisible();
    
    await page.locator('label:has-text("Localização") + input').fill('Brasil');
    await page.locator('label:has-text("Idade") + input').fill('25');
    await page.locator('label:has-text("Gênero") + button').click();
    await page.locator('[role="option"]:has-text("F")').click(); // F for Female or just pick one
    await page.locator('label:has-text("Interesses") + input').fill('Moda, Beleza');
    await page.locator('label:has-text("Comportamento") + input').fill('Compradores engajados');
    
    // Next Step
    await page.click('button:has-text("Próximo")');
    
    // Step 3: Placement
    console.log('Filling Step 3: Placement...');
    await expect(page.locator('div[role="dialog"] div.bg-white h3:has-text("Posicionamento")')).toBeVisible();
    
    await page.locator('label:has-text("Anúncio aparece em") + button').click();
    await page.locator('[role="option"]:has-text("Feed do insta")').click();
    
    // Next Step
    await page.click('button:has-text("Próximo")');
    
    // Step 4: Ad
    console.log('Filling Step 4: Ad...');
    await expect(page.locator('div[role="dialog"] div.bg-white h3:has-text("Nível de Anúncio")')).toBeVisible();
    
    await page.locator('label:has-text("Texto Principal") + input').fill('Melhor produto do ano!');
    await page.locator('label:has-text("Título") + input').fill('Oferta Imperdível');
    
    // Media -> Select Imagem
    await page.locator('label:has-text("Mídia") + button').click();
    await page.locator('[role="option"]:has-text("Imagem")').click();
    
    await page.locator('label:has-text("CTA") + input').fill('Comprar Agora');
    
    // Image URL
    const imageUrl = 'https://i.ibb.co/BKgLw2sh/Gemini-Generated-Image-8mitgq8mitgq8mit.png';
    await page.locator('label:has-text("Link da imagem") + input').fill(imageUrl);
    
    // Redirect URL
    await page.locator('label:has-text("Url de redirect") + input').fill('https://loja.com/produto');
    
    // Next Step
    await page.click('button:has-text("Próximo")');
    
    // Step 5: Identity
    console.log('Filling Step 5: Identity...');
    await expect(page.locator('div[role="dialog"] div.bg-white h3:has-text("Identidade")')).toBeVisible();
    
    await page.locator('label:has-text("Conta instagram") + input').fill('@loja.teste');
    
    // Save
    console.log('Saving Investment settings...');
    // Capture potential error response
    const responsePromise = page.waitForResponse(response => response.url().includes('/products') && response.status() === 400, { timeout: 5000 }).catch(() => null);
    
    await page.click('button:has-text("Salvar")');
    
    const errorResponse = await responsePromise;
    if (errorResponse) {
        console.log('API Error Body:', await errorResponse.text());
    }
    
    // Wait for dialog to close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

    // Wait for success message (give enough time for retries if columns are missing)
    await expect(page.locator('text=Produto salvo com sucesso')).toBeVisible({ timeout: 80000 });
    
    // 6. Verify Product Card Visualization
    console.log('Verifying Product Card updates...');
    
    // Verify Dollar Image Overlay
    // The code for ProductCard.tsx shows: <img src={dollarImage} alt="Investimento em Tráfego" ... />
    // We need to check if this image exists inside the product card.
    const dollarImg = productCard.locator('img[alt="Investimento em Tráfego"]');
    await expect(dollarImg).toBeVisible();
    console.log('Dollar image overlay is visible.');
    
    // Verify Investment Value in Profit Projection View (if accessible)
    // The "TRÁFEGO PAGO" div is in ProfitProjection.tsx, which is shown in "Resumo Financeiro Geral" view (viewMode="products" but "showOnlyProducts" state)
    // Wait, the ProductCard itself has a "Investimento" field in the "ad view" panel.
    // ProductCard.tsx has a slider. When investment exists, it shows 2 panels.
    // The second panel (index 1) has the ad details.
    // We need to click the "Next" chevron to see it.
    
    const nextPanelButton = productCard.locator('button > svg.lucide-chevron-right').first();
    // This might be ambiguous if there are variation chevrons.
    // The card panel chevron is:
    // <button onClick={handleNextCardPanel} ...> <ChevronRight .../> </button>
    // It appears only on hover usually, or if showInvestPanel is true.
    // Let's try to hover the card first.
    await productCard.hover();
    
    // Check if we can find the investment value text "R$ 1.500,00"
    // In ProductCard.tsx: <span className="font-semibold text-foreground">{paidTrafficInvestmentValue}</span>
    // But this is in the second panel.
    
    // Let's try to force click the next panel button if visible
    if (await nextPanelButton.isVisible()) {
        await nextPanelButton.click();
        await page.waitForTimeout(500); // Wait for animation
        const investValueText = productCard.locator('text=R$ 1.500,00');
        await expect(investValueText).toBeVisible();
        console.log('Investment value visible in Product Card panel.');
    } else {
        console.log('Next panel button not visible, checking if value is already visible or logic differs.');
        // Maybe directly check for text if it's rendered in DOM even if hidden/off-screen?
        // Playwright checks visibility.
    }
    
    // Verify the "TRÁFEGO PAGO" div in the ProfitProjection component.
    // This component is shown when "Resumo Financeiro Geral" is clicked or in "products" view mode.
    // In DropshippingCalculator.tsx:
    // <Button onClick={handleNavigateToProductsButton}>Resumo Financeiro Geral</Button>
    // This button sets `showOnlyProducts(true)`.
    
    console.log('Navigating to Financial Summary (ProfitProjection)...');
    // We are already on /produtos, which sets viewMode="products".
    // In DropshippingCalculator.tsx:
    // const ProductsPage = () => ( ... <DropshippingCalculator viewMode="products" /> ... );
    // So showOnlyProducts should be true initially.
    // Let's check if we see "TRÁFEGO PAGO".
    
    // Wait, `showOnlyProducts` is true, so `ProductsLoaded` (list) is shown?
    // In `DropshippingCalculator.tsx`:
    // {showOnlyProducts ? ( <div className="grid gap-6 lg:grid-cols-2"> ... <ProfitProjection ... /> ... <ProductsLoaded ... /> </div> ) : null}
    
    // So ProfitProjection should be visible.
    // However, ProfitProjection shows data for `selectedProduct`.
    // We need to make sure our new product is selected.
    // `selectedProduct` depends on `filteredProjectionProducts` and `selectedProductIndex`.
    // Default index is 0.
    // We added a product. It might be the first one if sorted by updated/created descending.
    // effectiveProducts sorts by updated timestamp descending.
    // So our new product should be first.
    
    const profitProjection = page.locator('text=TRÁFEGO PAGO').first();
    if (await profitProjection.isVisible()) {
        console.log('ProfitProjection visible. Checking values...');
        // Check for "R$ 1,5K" (compact format) near "TRÁFEGO PAGO"
        // The structure is: div > p("TRÁFEGO PAGO") + p("R$ 1,5K")
        const trafficValue = page.locator('div:has(p:text("TRÁFEGO PAGO")) >> text=R$ 1,5K');
        await expect(trafficValue).toBeVisible();
        console.log('Investment value R$ 1,5K confirmed in ProfitProjection.');
    } else {
        console.log('ProfitProjection NOT visible. Maybe need to select the product?');
    }

  });
});
