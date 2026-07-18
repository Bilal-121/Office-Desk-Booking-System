import { NextApiResponse } from 'next';
import { ApiResponse } from '@/types';

export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: NextApiResponse,
  error: string,
  statusCode: number = 400
) {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
