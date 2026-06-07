export function computeNetSalary(base: number, bonus: number, deductions: number): number {
  const baseN = Number(base) || 0;
  const bonusN = Number(bonus) || 0;
  const deductionsN = Number(deductions) || 0;
  return Math.max(0, Math.round((baseN + bonusN - deductionsN) * 100) / 100);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
}));
