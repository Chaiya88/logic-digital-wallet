import { z } from 'zod';
import { AppError } from './errors';
export const PositiveInt = z.number().int().positive();
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if(!res.success){
    throw new AppError('VALIDATION', 'Validation failed', 400, res.error.flatten());
  }
  return res.data;
}
export { z };
