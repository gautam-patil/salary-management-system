import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors.js";

// Express recognises an error handler by its four arguments, so _next must stay
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }

  // body-parser's error for a request body that is not valid JSON
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
