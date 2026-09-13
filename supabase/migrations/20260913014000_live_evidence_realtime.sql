-- Keep evidence updates live and avoid duplicate counter-check dispatches.

DELETE FROM public.scrape_jobs duplicate
USING public.scrape_jobs keeper
WHERE duplicate.research_run_id = keeper.research_run_id
  AND duplicate.phase = 'counter_check'
  AND keeper.phase = 'counter_check'
  AND duplicate.candidate_id = keeper.candidate_id
  AND duplicate.candidate_id IS NOT NULL
  AND (
    duplicate.created_at > keeper.created_at
    OR (
      duplicate.created_at = keeper.created_at
      AND duplicate.id::text > keeper.id::text
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_scrape_jobs_counter_candidate
  ON public.scrape_jobs (research_run_id, phase, candidate_id)
  WHERE phase = 'counter_check' AND candidate_id IS NOT NULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_evidence;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
