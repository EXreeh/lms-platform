import { z } from "zod";

const meetingProviderSchema = z.enum(["ZOOM", "GOOGLE_MEET", "CUSTOM"]);
const optionalUrl = z.string().url().optional().or(z.literal(""));

export const liveClassListQuerySchema = z.object({
  batchId: z.string().optional(),
  courseId: z.string().optional(),
  teacherId: z.string().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

const meetingFieldsSchema = {
  meetingProvider: meetingProviderSchema.optional(),
  meetingUrl: optionalUrl,
  meetingId: z.string().max(120).optional().or(z.literal("")),
  meetingPassword: z.string().max(64).optional().or(z.literal("")),
  startUrl: optionalUrl,
  joinUrl: optionalUrl,
  /** @deprecated */
  liveUrl: optionalUrl,
};

export const createLiveClassSchema = z.object({
  batchId: z.string().min(1),
  courseId: z.string().optional(),
  teacherId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  ...meetingFieldsSchema,
});

export const updateLiveClassSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
  ...meetingFieldsSchema,
  meetingUrl: optionalUrl.nullable(),
  meetingId: z.string().max(120).optional().nullable().or(z.literal("")),
  meetingPassword: z.string().max(64).optional().nullable().or(z.literal("")),
  startUrl: optionalUrl.nullable(),
  joinUrl: optionalUrl.nullable(),
  liveUrl: optionalUrl.nullable(),
});

export const updateLiveClassStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]),
});

export const createRecordingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
});

export const recordingListQuerySchema = z.object({
  batchId: z.string().optional(),
  courseId: z.string().optional(),
  liveClassId: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DELETED"]).optional(),
});
