import { ZodError } from 'zod'
import {
  recommendRequestSchema,
  recommendResponseSchema,
} from '@mealdice/shared'
import { buildUserPrompt } from '../src/prompt/user.js'
import { systemPrompt } from '../src/prompt/system.js'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn()
    console.error(`❌ ${message}`)
    process.exit(1)
  } catch {
    // expected
  }
}

function assertThrowsZod(fn: () => unknown, message: string): void {
  try {
    fn()
    console.error(`❌ ${message}`)
    process.exit(1)
  } catch (err) {
    if (!(err instanceof ZodError)) {
      console.error(`❌ ${message} (expected ZodError, got ${err})`)
      process.exit(1)
    }
  }
}

const sampleIngredient = { name: '葱', amount: 2, unit: '个' as const }
const sampleDish = {
  name: '番茄炒蛋',
  description: '家常下饭菜',
  ingredients: [sampleIngredient],
  instructions: ['切葱', '打蛋', '炒蛋', '加番茄', '出锅'],
}
const sampleCourses = { main: sampleDish, side: sampleDish, staple: sampleDish }
const sampleShoppingList = [sampleIngredient]

recommendRequestSchema.parse({
  cuisine: '中餐',
  includeSoup: true,
  includeDessert: false,
})

assertThrows(
  () =>
    recommendRequestSchema.parse({
      cuisine: '法餐',
      includeSoup: true,
      includeDessert: false,
    }),
  'Expected invalid cuisine to throw',
)

assertThrows(
  () =>
    recommendRequestSchema.parse({
      cuisine: '中餐',
      notes: 'a'.repeat(501),
      includeSoup: true,
      includeDessert: false,
    }),
  'Expected notes exceeding max length to throw',
)

const fullPrompt = buildUserPrompt({
  cuisine: '中餐',
  dietary: ['素食'],
  includeSoup: true,
  includeDessert: false,
  notes: '孩子不吃辣',
})

assert(fullPrompt.includes('菜系:中餐'), 'Full prompt should include cuisine line')
assert(fullPrompt.includes('忌口:素食'), 'Full prompt should include dietary line')
assert(
  fullPrompt.includes('额外备注:孩子不吃辣'),
  'Full prompt should include notes line',
)
assert(
  fullPrompt.includes('请根据以上偏好生成推荐。'),
  'Full prompt should include closing line',
)

const minimalPrompt = buildUserPrompt({
  cuisine: '任意',
  dietary: [],
  includeSoup: false,
  includeDessert: false,
})

assert(
  minimalPrompt.includes('菜系:任意'),
  'Minimal prompt should include cuisine line',
)
assert(
  minimalPrompt.includes('本餐不包含汤,不包含甜点'),
  'Minimal prompt should include soup/dessert line',
)
assert(!minimalPrompt.includes('忌口'), 'Minimal prompt should not include dietary line')
assert(
  !minimalPrompt.includes('额外备注'),
  'Minimal prompt should not include notes line',
)

assert(systemPrompt.includes('Role'), 'System prompt should include Role section')
assert(systemPrompt.includes('Task'), 'System prompt should include Task section')
assert(
  systemPrompt.includes('Constraints'),
  'System prompt should include Constraints section',
)
assert(
  systemPrompt.includes('Guidelines'),
  'System prompt should include Guidelines section',
)

const successResult = recommendResponseSchema.parse({
  status: 'success',
  courses: sampleCourses,
  shoppingList: sampleShoppingList,
})
assert(successResult.status === 'success', 'Success branch should parse')

const refusalResult = recommendResponseSchema.parse({
  status: 'refusal',
  code: 'CONSTRAINTS_UNSATISFIABLE',
  message: '无法满足全部忌口',
})
assert(refusalResult.status === 'refusal', 'Refusal branch should parse')

const partialResult = recommendResponseSchema.parse({
  status: 'partial',
  courses: sampleCourses,
  shoppingList: sampleShoppingList,
  missing: [{ course: 'soup', reason: '无合适汤品' }],
})
assert(partialResult.status === 'partial', 'Partial branch should parse')

assertThrowsZod(
  () =>
    recommendResponseSchema.parse({
      status: 'unknown',
      courses: sampleCourses,
      shoppingList: [],
    }),
  'Expected unknown status to throw ZodError',
)

console.log('✅ Phase 4 verify passed')
