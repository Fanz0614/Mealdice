import Anthropic from '@anthropic-ai/sdk'

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 30_000,
  maxRetries: 2,
})
