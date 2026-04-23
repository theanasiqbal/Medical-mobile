import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured errors on validation failure.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e: ZodError['errors'][number]) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    // Attach parsed & typed data to request
    req.body = result.data;
    next();
  };
}
