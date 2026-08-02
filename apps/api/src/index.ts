import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { AppError } from './errors.js'
import { chatRequestSchema } from './schemas.js'
import { validateBody } from './middleware/validate.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = 3001

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/chat', validateBody(chatRequestSchema), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set')
    throw new AppError(500, 'Server is not configured for chat')
  }

  const { message } = req.body

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  })

  const reply = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  res.json({ reply })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
