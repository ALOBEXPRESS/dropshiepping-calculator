export const formatCurrency = (value: string | number): string => {
  if (value === '' || value === undefined || value === null) return '';
  
  const num = typeof value === 'string' ? parseCurrency(value) : value;

  if (isNaN(num)) return '';

  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrency = (value: string | number): number => {
  if (value === undefined || value === null || value === '') return 0;
  
  if (typeof value === 'number') return value;
  
  // If value has dot but no comma, treat dot as decimal separator (English format or user typo)
  // This prevents "1.5" from becoming "15"
  if (value.includes('.') && !value.includes(',')) {
    // Check if it looks like thousands separator (e.g. 1.000) -> 3 digits after dot
    const parts = value.split('.');
    const lastPart = parts[parts.length - 1];
    // If multiple dots or last part is 3 digits, assume thousands separator
    if (parts.length > 2 || (parts.length === 2 && lastPart.length === 3)) {
        // Assume thousands separator, fall through to standard logic
    } else {
        return parseFloat(value);
    }
  }

  // Remove dots (thousands) and replace comma with dot
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper for input onChange events
export const handleCurrencyChange = (
  e: React.ChangeEvent<HTMLInputElement>, 
  setter: (val: string) => void
) => {
  let value = e.target.value;
  
  // Remove non-digit and non-comma characters
  value = value.replace(/[^\d,]/g, '');
  
  // Ensure only one comma
  const parts = value.split(',');
  if (parts.length > 2) {
    value = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (value.includes(',')) {
    const [integer, decimal] = value.split(',');
    if (decimal.length > 2) {
        value = `${integer},${decimal.substring(0, 2)}`;
    }
  }

  setter(value);
};

// Format on blur to add thousands separators and fix decimals
export const handleCurrencyBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    setter: (val: string) => void
) => {
    const value = e.target.value;
    if (!value) return;
    
    const num = parseCurrency(value);
    setter(formatCurrency(num));
};

export const formatCompactCurrency = (value: number): string => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
  }
  return formatCurrency(value);
};
