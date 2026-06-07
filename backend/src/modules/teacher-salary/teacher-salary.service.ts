import type { Prisma, SalaryStatus } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { logPrismaRouteError } from "../../utils/prisma-safe.js";
import {
  computeNetSalary,
  computeSalarySummary,
  mapTeacherSalary,
  salaryInclude,
} from "./teacher-salary.helpers.js";

export async function listSalaries(filters: {
  teacherId?: string;
  month?: number;
  year?: number;
  status?: SalaryStatus;
  search?: string;
}) {
  const where: Prisma.TeacherSalaryWhereInput = {};
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.month) where.month = filters.month;
  if (filters.year) where.year = filters.year;
  if (filters.status) where.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    where.teacher = {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const rows = await prisma.teacherSalary.findMany({
    where,
    include: salaryInclude,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return rows.map(mapTeacherSalary);
}

export async function listSalariesWithSummary(filters: {
  teacherId?: string;
  month?: number;
  year?: number;
  status?: SalaryStatus;
  search?: string;
}) {
  const data = await listSalaries(filters);
  const now = new Date();
  const summaryMonth = filters.month ?? now.getMonth() + 1;
  const summaryYear = filters.year ?? now.getFullYear();
  const summary = computeSalarySummary(data, summaryMonth, summaryYear);
  return { data, summary };
}

export async function getSalaryById(id: string) {
  const row = await prisma.teacherSalary.findUnique({
    where: { id },
    include: salaryInclude,
  });
  if (!row) throw ApiError.notFound("Salary record not found");
  return mapTeacherSalary(row);
}

export async function createSalary(input: {
  teacherId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
  note?: string;
}) {
  const teacher = await prisma.user.findFirst({
    where: { id: input.teacherId, role: "TEACHER", suspended: false },
  });
  if (!teacher) throw ApiError.badRequest("Teacher not found");

  const bonus = input.bonus ?? 0;
  const deductions = input.deductions ?? 0;
  const netSalary = computeNetSalary(input.baseSalary, bonus, deductions);

  try {
    const row = await prisma.teacherSalary.create({
      data: {
        teacherId: input.teacherId,
        month: input.month,
        year: input.year,
        baseSalary: input.baseSalary,
        bonus,
        deductions,
        netSalary,
        note: input.note,
      },
      include: salaryInclude,
    });
    return mapTeacherSalary(row);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw ApiError.conflict(
        "A salary record already exists for this teacher and month",
        "SALARY_EXISTS",
      );
    }
    throw error;
  }
}

export async function updateSalary(
  id: string,
  input: Partial<{
    baseSalary: number;
    bonus: number;
    deductions: number;
    status: SalaryStatus;
    note: string | null;
  }>,
) {
  const existing = await prisma.teacherSalary.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Salary record not found");

  const baseSalary =
    input.baseSalary !== undefined ? input.baseSalary : Number(existing.baseSalary);
  const bonus = input.bonus !== undefined ? input.bonus : Number(existing.bonus);
  const deductions =
    input.deductions !== undefined ? input.deductions : Number(existing.deductions);
  const netSalary = computeNetSalary(baseSalary, bonus, deductions);

  let paidAt = existing.paidAt;
  if (input.status === "PAID" && existing.status !== "PAID") {
    paidAt = new Date();
  } else if (input.status && input.status !== "PAID") {
    paidAt = null;
  }

  const row = await prisma.teacherSalary.update({
    where: { id },
    data: {
      baseSalary: input.baseSalary,
      bonus: input.bonus,
      deductions: input.deductions,
      netSalary,
      status: input.status,
      note: input.note,
      paidAt,
    },
    include: salaryInclude,
  });

  return mapTeacherSalary(row);
}

export async function markSalaryPaid(id: string) {
  return updateSalary(id, { status: "PAID" });
}

export async function markSalaryHold(id: string) {
  return updateSalary(id, { status: "HOLD" });
}

export async function getTeacherSalaryDashboard(teacherId: string) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const current = await prisma.teacherSalary.findUnique({
      where: { teacherId_month_year: { teacherId, month, year } },
      include: salaryInclude,
    });

    const history = await prisma.teacherSalary.findMany({
      where: { teacherId },
      include: salaryInclude,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 24,
    });

    return {
      currentMonth: current ? mapTeacherSalary(current) : null,
      history: history.map(mapTeacherSalary),
    };
  } catch (error) {
    logPrismaRouteError("/api/teacher-salaries/me", error, "getTeacherSalaryDashboard");
    return { currentMonth: null, history: [] };
  }
}
