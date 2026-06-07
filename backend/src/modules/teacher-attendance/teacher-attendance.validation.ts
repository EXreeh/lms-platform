import { z } from "zod";

export const markAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "LEAVE"]),
  note: z.string().max(500).optional(),
});

export const adminUpdateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"]),
  note: z.string().max(500).optional().nullable(),
});

export const submitLeaveSchema = z.object({
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().min(3).max(2000),
});

export const listAttendanceQuerySchema = z.object({
  teacherId: z.string().optional(),
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"]).optional(),
});

export const markMissingAbsentSchema = z.object({
  date: z.string().optional(),
});
