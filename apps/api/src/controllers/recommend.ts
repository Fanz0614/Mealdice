import type { Request, Response } from 'express'
import { recommendRequestSchema } from '@mealdice/shared'
import { TEMP_HARDCODED_USER_ID } from '../constants/temp-auth.js'
import {
  generateRecommendation,
  getRecommendations,
  saveRecommendation,
} from '../services/recommend.js'

function parseLimit(raw: unknown): number {
  if (raw === undefined) return 20
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 20
  return n
}

export async function recommendController(req: Request, res: Response) {
  const parsed = recommendRequestSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten(),
    })
    return
  }

  const result = await generateRecommendation(parsed.data)

  const { id } = await saveRecommendation(
    TEMP_HARDCODED_USER_ID,
    parsed.data,
    result,
  )

  res.status(200).json({
    meta: { id },
    ...result,
  })
}

export async function listRecommendationsController(req: Request, res: Response) {
  const limit = parseLimit(req.query.limit)
  const result = await getRecommendations(TEMP_HARDCODED_USER_ID, limit)

  res.status(200).json({
    meta: {
      count: result.count,
      limit: result.limit,
      hasMore: result.hasMore,
    },
    data: result.data,
  })
}
