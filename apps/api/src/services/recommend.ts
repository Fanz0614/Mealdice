import { z, toJSONSchema } from 'zod'
import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages.js'
import { anthropicClient } from '../clients/anthropic.js'
import { systemPrompt } from '../prompt/system.js'
import { buildUserPrompt } from '../prompt/user.js'
import { create, findByUserId, type Recommendation } from '../repositories/recommendations.js'
import {
  recommendResponseSchema,
  type RecommendRequest,
  type RecommendResponse,
} from '@mealdice/shared'

const TOOL_NAME = 'submit_recommendation'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_SAVE_ATTEMPTS = 3
const RETRY_DELAY_MS = 100

export async function generateRecommendation(
  request: RecommendRequest,
): Promise<RecommendResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const response = await anthropicClient.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildUserPrompt(request) }],
    tools: [
      {
        name: TOOL_NAME,
        description:
          'Submit structured dinner recommendation as success, refusal, or partial result',
        input_schema: {
          type: 'object' as const,
          properties: {
            result: toJSONSchema(recommendResponseSchema),
          },
          required: ['result'],
        } as Tool['input_schema'],
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
  })

  const toolBlock = response.content.find((block) => block.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('No tool_use block in Anthropic response')
  }

  const parsed = z.object({ result: recommendResponseSchema }).parse(toolBlock.input)
  return parsed.result
}

export async function saveRecommendation(
  userId: string,
  request: RecommendRequest,
  result: RecommendResponse,
): Promise<{ id: string | null }> {
  for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
    try {
      const { id } = await create({
        userId,
        cuisine: request.cuisine,
        servings: request.servings,
        dietary: request.dietary,
        result,
      })
      return { id }
    } catch (err) {
      if (attempt === MAX_SAVE_ATTEMPTS - 1) {
        console.error('Failed to save recommendation:', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        })
        return { id: null }
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }

  return { id: null }
}

type GetRecommendationsResult = {
  data: Recommendation[]
  hasMore: boolean
  limit: number
  count: number
}

export async function getRecommendations(
  userId: string,
  limit: number,
): Promise<GetRecommendationsResult> {
  const rows = await findByUserId(userId, limit + 1)
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows

  return {
    data,
    hasMore,
    limit,
    count: data.length,
  }
}
