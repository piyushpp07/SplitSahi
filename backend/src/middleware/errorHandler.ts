import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError || (err as any).statusCode) {
    const statusCode = (err as any).statusCode || 500;
    return res.status(statusCode).json({
      error: err.message,
      code: (err as any).code,
    });
  }
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
