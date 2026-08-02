import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { APIError } from '@anthropic-ai/sdk'
import { AppError } from '../errors.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.flatten(),
    })
    return
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('AppError:', err)
    }
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    })
    return
  }

  if (err instanceof APIError) {
    console.error('Anthropic error:', err)
    res.status(500).json({
      error: 'Failed to get a response. Please try again.',
    })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
