import type { RecommendRequest } from '../schemas/recommend.js'

export function buildUserPrompt(req: RecommendRequest): string {
  const lines: string[] = []

  lines.push(`菜系:${req.cuisine}`)

  if (req.dietary.length > 0) {
    lines.push(`忌口:${req.dietary.join('、')}`)
  }

  const soupText = req.includeSoup ? '包含' : '不包含'
  const dessertText = req.includeDessert ? '包含' : '不包含'
  lines.push(`本餐${soupText}汤,${dessertText}甜点`)

  if (req.notes !== undefined) {
    lines.push(`额外备注:${req.notes}`)
  }

  lines.push('请根据以上偏好生成推荐。')

  return lines.join('\n')
}
