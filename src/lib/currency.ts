export function formatCRC(amountInCents: number, options?: { showDecimals?: boolean }): string {
  const showDecimals = options?.showDecimals ?? false;
  const colones = amountInCents / 100;
  if (showDecimals) {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(colones);
  }
  // No decimals, display like ₡1,000
  const whole = Math.round(colones);
  return `₡${whole.toLocaleString('es-CR')}`;
}

export function parseCRCToCents(input: string): number | null {
  if (!input) return null;
  // Remove currency symbol and spaces
  const cleaned = input.replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return null;
  // Prefer dot as decimal separator for inputs; fallback to comma
  let normalized = cleaned;
  // If both separators present, assume dot is thousands and comma decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma present, treat as decimal separator
    normalized = cleaned.replace(',', '.');
  }
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}