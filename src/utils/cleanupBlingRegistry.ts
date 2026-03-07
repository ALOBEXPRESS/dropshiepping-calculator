/**
 * Utility to clean up localStorage entries for Bling products that no longer exist
 * in the products_bling table or were not saved to the products table.
 * 
 * This should be called manually by the user when they notice products
 * showing as "Cadastrado" (registered) but they're not actually in the products table.
 */

export const cleanupBlingRegistry = () => {
  try {
    // Clear all Bling-related localStorage entries
    localStorage.removeItem('registeredBlingIds');
    localStorage.removeItem('registeredBlingBySku');
    
    console.log('✅ Bling registry cleaned up successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clean up Bling registry:', error);
    return false;
  }
};

/**
 * Remove specific Bling product IDs from the registry
 */
export const removeFromBlingRegistry = (idsToRemove: string[]) => {
  try {
    // Get current registered IDs
    const storedIds = localStorage.getItem('registeredBlingIds');
    if (!storedIds) return true;
    
    const registeredIds = new Set<string>(JSON.parse(storedIds));
    
    // Remove specified IDs
    idsToRemove.forEach((id) => registeredIds.delete(id));
    
    // Save back to localStorage
    localStorage.setItem('registeredBlingIds', JSON.stringify(Array.from(registeredIds)));
    
    // Also clean up registeredBlingBySku
    const storedBySku = localStorage.getItem('registeredBlingBySku');
    if (storedBySku) {
      const registeredBySku = JSON.parse(storedBySku) as Record<string, string[]>;
      const cleanedBySku: Record<string, string[]> = {};
      
      Object.entries(registeredBySku).forEach(([sku, ids]) => {
        const validIds = ids.filter((id) => !idsToRemove.includes(id));
        if (validIds.length > 0) {
          cleanedBySku[sku] = validIds;
        }
      });
      
      localStorage.setItem('registeredBlingBySku', JSON.stringify(cleanedBySku));
    }
    
    console.log(`✅ Removed ${idsToRemove.length} IDs from Bling registry`);
    return true;
  } catch (error) {
    console.error('❌ Failed to remove IDs from Bling registry:', error);
    return false;
  }
};
