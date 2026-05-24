import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.query = schema.parse(req.query) as Request["query"];
    next();
  };
}
