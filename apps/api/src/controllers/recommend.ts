import type { Request, Response } from 'express'
import { recommendRequestSchema } from '@mealdice/shared'
import { recommendService } from '../services/recommend.js'

export async function recommendController(req: Request, res: Response) {
  const parsed = recommendRequestSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten(),
    })
    return
  }

  try {
    const result = await recommendService(parsed.data)
    res.status(200).json(result)
  } catch (err) {
    console.error('Recommendation error:', err)
    res.status(500).json({ error: 'Recommendation failed' })
  }
}
