-- Live research run schema for ScoutBeyond
-- Firecrawl Search → Batch Scrape → webhook → per-source analysis → Realtime UI

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- research_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  structured_problem JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN (
      'queued',
      'searching',
      'scraping',
      'analysing',
      'counter_checking',
      'synthesising',
      'completed',
      'failed'
    )),
  phase TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  sources_found INTEGER NOT NULL DEFAULT 0,
  sources_scraped INTEGER NOT NULL DEFAULT 0,
  sources_analysed INTEGER NOT NULL DEFAULT 0,
  sources_failed INTEGER NOT NULL DEFAULT 0,
  candidates_count INTEGER NOT NULL DEFAULT 0,
  search_queries JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_runs_owner_id ON public.research_runs (owner_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_status ON public.research_runs (status);
CREATE INDEX IF NOT EXISTS idx_research_runs_created_at ON public.research_runs (created_at DESC);

-- ---------------------------------------------------------------------------
-- research_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  search_dimension TEXT,
  search_query TEXT,
  status TEXT NOT NULL DEFAULT 'discovered'
    CHECK (status IN (
      'discovered',
      'scraping',
      'scraped',
      'analysing',
      'analysed',
      'failed'
    )),
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN (
      'pending',
      'queued',
      'running',
      'completed',
      'failed',
      'skipped'
    )),
  scrape_id TEXT,
  markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  scraped_at TIMESTAMPTZ,
  analysed_at TIMESTAMPTZ,
  UNIQUE (research_run_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS idx_research_sources_run_id ON public.research_sources (research_run_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_status ON public.research_sources (research_run_id, status);
CREATE INDEX IF NOT EXISTS idx_research_sources_analysis ON public.research_sources (research_run_id, analysis_status);

-- ---------------------------------------------------------------------------
-- scrape_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  firecrawl_job_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'initial_research'
    CHECK (phase IN ('initial_research', 'counter_check')),
  candidate_id UUID,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'started', 'completed', 'failed')),
  urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  UNIQUE (firecrawl_job_id)
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_run_id ON public.scrape_jobs (research_run_id);

-- ---------------------------------------------------------------------------
-- research_events (user-visible progress timeline)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_research_events_run_id
  ON public.research_events (research_run_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- webhook_deliveries (idempotency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  delivery_key TEXT PRIMARY KEY,
  research_run_id UUID REFERENCES public.research_runs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  firecrawl_job_id TEXT,
  payload_hash TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_run_id
  ON public.webhook_deliveries (research_run_id);

-- ---------------------------------------------------------------------------
-- live_candidates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  principle TEXT NOT NULL,
  normalized_principle TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('established', 'adjacent', 'exploratory')),
  summary TEXT NOT NULL DEFAULT '',
  relevance TEXT NOT NULL DEFAULT '',
  classification_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  applicability JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  evidence_quality TEXT CHECK (evidence_quality IN ('strong', 'moderate', 'weak')),
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  uncertainties JSONB NOT NULL DEFAULT '[]'::jsonb,
  maturity JSONB NOT NULL DEFAULT '{}'::jsonb,
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  physical_mechanisms JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_state TEXT NOT NULL DEFAULT 'provisional'
    CHECK (verification_state IN ('provisional', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (research_run_id, normalized_principle)
);

CREATE INDEX IF NOT EXISTS idx_live_candidates_run_id ON public.live_candidates (research_run_id);
CREATE INDEX IF NOT EXISTS idx_live_candidates_category ON public.live_candidates (research_run_id, category);

-- ---------------------------------------------------------------------------
-- live_evidence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.live_candidates(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.research_sources(id) ON DELETE CASCADE,
  finding TEXT NOT NULL,
  relevance TEXT NOT NULL DEFAULT '',
  stance TEXT NOT NULL DEFAULT 'supports'
    CHECK (stance IN ('supports', 'contradicts', 'neutral')),
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  exact_excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_live_evidence_run_id ON public.live_evidence (research_run_id);
CREATE INDEX IF NOT EXISTS idx_live_evidence_candidate_id ON public.live_evidence (candidate_id);
CREATE INDEX IF NOT EXISTS idx_live_evidence_source_id ON public.live_evidence (source_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_research_runs_updated_at ON public.research_runs;
CREATE TRIGGER trg_research_runs_updated_at
BEFORE UPDATE ON public.research_runs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_research_sources_updated_at ON public.research_sources;
CREATE TRIGGER trg_research_sources_updated_at
BEFORE UPDATE ON public.research_sources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_scrape_jobs_updated_at ON public.scrape_jobs;
CREATE TRIGGER trg_scrape_jobs_updated_at
BEFORE UPDATE ON public.scrape_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_live_candidates_updated_at ON public.live_candidates;
CREATE TRIGGER trg_live_candidates_updated_at
BEFORE UPDATE ON public.live_candidates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: owner-scoped via auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS research_runs_select_own ON public.research_runs;
CREATE POLICY research_runs_select_own ON public.research_runs
  FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS research_runs_insert_own ON public.research_runs;
CREATE POLICY research_runs_insert_own ON public.research_runs
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS research_runs_update_own ON public.research_runs;
CREATE POLICY research_runs_update_own ON public.research_runs
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS research_sources_select_own ON public.research_sources;
CREATE POLICY research_sources_select_own ON public.research_sources
  FOR SELECT TO authenticated
  USING (
    research_run_id IN (
      SELECT id FROM public.research_runs WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS scrape_jobs_select_own ON public.scrape_jobs;
CREATE POLICY scrape_jobs_select_own ON public.scrape_jobs
  FOR SELECT TO authenticated
  USING (
    research_run_id IN (
      SELECT id FROM public.research_runs WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS research_events_select_own ON public.research_events;
CREATE POLICY research_events_select_own ON public.research_events
  FOR SELECT TO authenticated
  USING (
    research_run_id IN (
      SELECT id FROM public.research_runs WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS live_candidates_select_own ON public.live_candidates;
CREATE POLICY live_candidates_select_own ON public.live_candidates
  FOR SELECT TO authenticated
  USING (
    research_run_id IN (
      SELECT id FROM public.research_runs WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS live_evidence_select_own ON public.live_evidence;
CREATE POLICY live_evidence_select_own ON public.live_evidence
  FOR SELECT TO authenticated
  USING (
    research_run_id IN (
      SELECT id FROM public.research_runs WHERE owner_id = (SELECT auth.uid())
    )
  );

-- webhook_deliveries: service role only (no client policies)

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.research_runs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.research_sources;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.research_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_candidates;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
