import type { Request, Response } from 'express'
import { recommendRequestSchema } from '@mealdice/shared'
import { TEMP_HARDCODED_USER_ID } from '../constants/temp-auth.js'
import {
  generateRecommendation,
  saveRecommendation,
} from '../services/recommend.js'

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
