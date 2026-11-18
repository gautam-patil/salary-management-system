import type { RequestHandler } from "express";
import type { ZodType } from "zod";

// Express 5 makes req.query read-only, so the parsed values go on res.locals
export function validateQuery(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    res.locals.query = result.data;
    next();
  };
}
