CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  cuisine text NOT NULL,
  servings int NOT NULL,
  dietary text[] NOT NULL DEFAULT '{}',
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);