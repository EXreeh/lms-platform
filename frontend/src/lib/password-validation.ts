export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  valid: boolean;
} {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const valid = passed === PASSWORD_RULES.length;

  if (!password) return { score: 0, label: "Enter a password", valid: false };
  if (passed <= 2) return { score: 25, label: "Weak", valid: false };
  if (passed <= 4) return { score: 60, label: "Fair", valid: false };
  if (!valid) return { score: 80, label: "Almost there", valid: false };
  return { score: 100, label: "Strong", valid: true };
}
