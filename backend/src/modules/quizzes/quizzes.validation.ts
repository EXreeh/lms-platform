import { z } from "zod";

export const questionTypeEnum = z.enum(["MCQ"]);

export const createQuizSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  lessonId: z.string().min(1),
  timeLimit: z.coerce.number().int().min(60).max(7200).optional().nullable(),
  passingScore: z.coerce.number().min(0).max(100).default(70),
});

export const updateQuizSchema = createQuizSchema.partial().omit({ lessonId: true });

export const createQuestionSchema = z.object({
  question: z.string().min(5).max(2000),
  type: questionTypeEnum.default("MCQ"),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correctAnswer: z.string().min(1).max(500),
  points: z.coerce.number().int().min(1).max(100).default(1),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.string().min(1).max(500),
    }),
  ),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
