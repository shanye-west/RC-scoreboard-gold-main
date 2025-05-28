-- Add unique constraint to scores table to prevent duplicate scores for same match and hole
-- This will prevent the primary key constraint violations we've been seeing

-- First, remove any duplicate entries that might exist
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY match_id, hole_number ORDER BY id) as rn
  FROM scores
)
DELETE FROM scores 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add the unique constraint
ALTER TABLE scores 
ADD CONSTRAINT unique_match_hole UNIQUE (match_id, hole_number);
