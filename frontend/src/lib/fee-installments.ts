/** Must match backend MIN_INSTALLMENT_AMOUNT default (₹10,000). */
export const MIN_INSTALLMENT_AMOUNT = 10_000;

export function defaultPayAmount(pendingAmount: number): number {
  if (pendingAmount <= 0) return 0;
  if (pendingAmount <= MIN_INSTALLMENT_AMOUNT) return pendingAmount;
  return MIN_INSTALLMENT_AMOUNT;
}

export function validateInstallmentAmount(
  pendingAmount: number,
  amount: number,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Invalid payment amount";
  if (pendingAmount <= 0) return "This fee is already fully paid";
  if (amount > pendingAmount) return "Amount cannot be more than pending fee";
  if (pendingAmount > MIN_INSTALLMENT_AMOUNT && amount < MIN_INSTALLMENT_AMOUNT) {
    return "Minimum installment amount is ₹10,000";
  }
  return null;
}

export function isValidInstallmentAmount(pendingAmount: number, amount: number): boolean {
  return validateInstallmentAmount(pendingAmount, amount) === null;
}

export function paymentProgressPercent(paid: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}
