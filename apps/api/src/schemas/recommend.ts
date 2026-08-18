import { z } from 'zod'

export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.union([z.number(), z.string()]),
  unit: z.enum(['个', '少许', '适量']),
})

export type Ingredient = z.infer<typeof ingredientSchema>

export const dishSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(30),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
})

export type Dish = z.infer<typeof dishSchema>

export const recommendRequestSchema = z.object({
  cuisine: z.enum(['中餐', '日料', '意餐', '泰餐', '任意']),
  dietary: z
    .array(z.enum(['素食', '无麸质', '无海鲜']))
    .default([]),
  includeSoup: z.boolean(),
  includeDessert: z.boolean(),
  notes: z.string().max(500).optional(),
})

export type RecommendRequest = z.infer<typeof recommendRequestSchema>

const coursesSchema = z.object({
  main: dishSchema,
  side: dishSchema,
  staple: dishSchema,
  soup: dishSchema.optional(),
  dessert: dishSchema.optional(),
})

const refusalCodeSchema = z.enum([
  'CONSTRAINTS_UNSATISFIABLE',
  'POLICY_BLOCKED',
  'INSUFFICIENT_INFO',
  'OTHER',
])

const missingItemSchema = z.object({
  course: z.string(),
  reason: z.string(),
})

const recommendResponseSuccessSchema = z.object({
  status: z.literal('success'),
  courses: coursesSchema,
  shoppingList: z.array(ingredientSchema),
})

const recommendResponseRefusalSchema = z.object({
  status: z.literal('refusal'),
  code: refusalCodeSchema,
  message: z.string(),
})

const recommendResponsePartialSchema = z.object({
  status: z.literal('partial'),
  courses: coursesSchema,
  shoppingList: z.array(ingredientSchema),
  missing: z.array(missingItemSchema).min(1),
})

export const recommendResponseSchema = z.discriminatedUnion('status', [
  recommendResponseSuccessSchema,
  recommendResponseRefusalSchema,
  recommendResponsePartialSchema,
])

export type RecommendResponse = z.infer<typeof recommendResponseSchema>
