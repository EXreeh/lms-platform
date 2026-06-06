import type { Prisma, SalaryStatus } from "@lms/database";

export const salaryInclude = {
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.TeacherSalaryInclude;

export function toSalaryNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function computeNetSalary(base: number, bonus: number, deductions: number) {
  return Math.max(0, Math.round((base + bonus - deductions) * 100) / 100);
}

export function salaryStatusLabel(status: SalaryStatus): string {
  switch (status) {
    case "PAID":
      return "Paid";
    case "HOLD":
      return "On hold";
    default:
      return "Pending";
  }
}

export function mapTeacherSalary(
  row: Prisma.TeacherSalaryGetPayload<{ include: typeof salaryInclude }>,
) {
  const status = row.status as SalaryStatus;
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: `${row.teacher.firstName} ${row.teacher.lastName}`.trim(),
    teacherEmail: row.teacher.email,
    month: row.month,
    year: row.year,
    baseSalary: toSalaryNumber(row.baseSalary),
    bonus: toSalaryNumber(row.bonus),
    deductions: toSalaryNumber(row.deductions),
    netSalary: toSalaryNumber(row.netSalary),
    status,
    statusLabel: salaryStatusLabel(status),
    paidAt: row.paidAt?.toISOString() ?? null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
