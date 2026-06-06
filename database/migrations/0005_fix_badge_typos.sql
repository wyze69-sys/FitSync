-- Migration 0005: Fix badge name/description typos
-- Corrects "Roached" -> "Reached", "Startor" -> "Starter", "Buildor" -> "Builder"
-- in any achievement rows that were seeded with the wrong text.
-- This is idempotent: safe to run multiple times.

USE fitsync_db;

-- Fix any achievement whose description contains the misspelling "Roached"
UPDATE achievements
SET description = REPLACE(description, 'Roached', 'Reached')
WHERE description LIKE '%Roached%';

-- Fix any achievement whose name or description contains "Startor"
UPDATE achievements
SET name        = REPLACE(name, 'Startor', 'Starter'),
    description = REPLACE(description, 'Startor', 'Starter')
WHERE name LIKE '%Startor%' OR description LIKE '%Startor%';

-- Fix any achievement whose name or description contains "Buildor"
UPDATE achievements
SET name        = REPLACE(name, 'Buildor', 'Builder'),
    description = REPLACE(description, 'Buildor', 'Builder')
WHERE name LIKE '%Buildor%' OR description LIKE '%Buildor%';

-- Ensure correct canonical names for level badges (idempotent upserts)
INSERT INTO achievements (code, name, description, requirement_type, requirement_value, sort_order) VALUES
  ('level_1',  'Starter',    'Reached Starter.',    'level', 0, 100),
  ('level_2',  'Warm Up',    'Reached Warm Up.',    'level', 0, 100),
  ('level_3',  'Builder',    'Reached Builder.',    'level', 0, 100),
  ('level_4',  'Regular',    'Reached Regular.',    'level', 0, 100),
  ('level_5',  'Momentum',   'Reached Momentum.',   'level', 0, 100),
  ('level_6',  'Athlete',    'Reached Athlete.',    'level', 0, 100),
  ('level_7',  'Specialist', 'Reached Specialist.', 'level', 0, 100),
  ('level_8',  'Pro',        'Reached Pro.',        'level', 0, 100),
  ('level_9',  'Elite',      'Reached Elite.',      'level', 0, 100),
  ('level_10', 'Legend',     'Reached Legend.',     'level', 0, 100)
ON DUPLICATE KEY UPDATE
  name        = VALUES(name),
  description = VALUES(description);
