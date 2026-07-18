import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { ZodSchema } from 'zod';
import { sendError } from '../api-response';

export function withValidation(schema: ZodSchema, handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      return handler(req, res);
    } catch (error: any) {
      if (error.errors) {
        const errorMessage = error.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return sendError(res, errorMessage, 400);
      }
      return sendError(res, 'Validation error', 400);
    }
  };
}
