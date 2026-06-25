-- Trust & QA Center — run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS qa_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT NOT NULL DEFAULT 'technical_error',
  severity TEXT NOT NULL DEFAULT 'medium',
  affected_area TEXT,
  affected_url TEXT,
  content_id TEXT,
  suggested_fix TEXT,
  assigned_to TEXT,
  quick_fix BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'detected',
  resolution_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_issues_severity ON qa_issues(severity);
CREATE INDEX IF NOT EXISTS idx_qa_issues_status ON qa_issues(status);
CREATE INDEX IF NOT EXISTS idx_qa_issues_created_at ON qa_issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_issues_updated_at ON qa_issues(updated_at DESC);
