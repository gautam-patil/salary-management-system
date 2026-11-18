import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors.js";

const MESSAGES = { body: "Invalid request body", query: "Invalid query parameters" };

// the parsed values go on res.locals, because Express 5 makes req.query read-only
function validate(source: "body" | "query", schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
      next(new AppError(400, MESSAGES[source], details));
      return;
    }

    res.locals[source] = result.data;
    next();
  };
}

export const validateBody = (schema: ZodType) => validate("body", schema);
export const validateQuery = (schema: ZodType) => validate("query", schema);
