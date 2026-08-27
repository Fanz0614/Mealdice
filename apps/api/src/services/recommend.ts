import { z, toJSONSchema } from 'zod'
import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages.js'
import { anthropicClient } from '../clients/anthropic.js'
import { systemPrompt } from '../prompt/system.js'
import { buildUserPrompt } from '../prompt/user.js'
import {
  recommendResponseSchema,
  type RecommendRequest,
  type RecommendResponse,
} from '@mealdice/shared'

const TOOL_NAME = 'submit_recommendation'
const MODEL = 'claude-haiku-4-5-20251001'

export async function recommendService(
  input: RecommendRequest,
): Promise<RecommendResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const response = await anthropicClient.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
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
