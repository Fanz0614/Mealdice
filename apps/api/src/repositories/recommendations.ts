import type { RecommendResponse } from '@mealdice/shared'
import { supabase } from '../clients/supabase.js'

export type Recommendation = {
  id: string
  userId: string
  cuisine: string
  servings: number
  dietary: string[]
  result: RecommendResponse
  createdAt: string
}

type CreateRecommendationInput = {
  userId: string
  cuisine: string
  servings: number
  dietary: string[]
  result: RecommendResponse
}

type RecommendationRow = {
  id: string
  user_id: string
  cuisine: string
  servings: number
  dietary: string[]
  result: RecommendResponse
  created_at: string
}

function mapRow(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    userId: row.user_id,
    cuisine: row.cuisine,
    servings: row.servings,
    dietary: row.dietary,
    result: row.result,
    createdAt: row.created_at,
  }
}

export async function create(
  input: CreateRecommendationInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      user_id: input.userId,
      cuisine: input.cuisine,
      servings: input.servings,
      dietary: input.dietary,
      result: input.result,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return { id: data.id }
}

export async function findByUserId(
  userId: string,
  limit: number = 20,
): Promise<Recommendation[]> {
  const cappedLimit = Math.min(limit, 100)

  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(cappedLimit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapRow)
}
