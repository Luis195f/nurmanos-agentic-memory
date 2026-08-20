-- Upgrade tables created before the synthetic metadata constraint was hardened.
-- Run each ALTER TABLE statement as its own transaction in CockroachDB Cloud.
-- Adding the stricter constraint first prevents a gap in enforcement.
ALTER TABLE public.h1_supervisor_memories
  ADD CONSTRAINT h1_synthetic_required
  CHECK (((metadata->>'synthetic')::BOOL) IS TRUE);

ALTER TABLE public.h1_supervisor_memories
  ALTER COLUMN metadata DROP DEFAULT;

ALTER TABLE public.h1_supervisor_memories
  DROP CONSTRAINT h1_synthetic_only;
