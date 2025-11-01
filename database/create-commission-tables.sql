-- Commission Settings Table
-- Stores all commission configuration (level, binary, ROI, rank, booster)
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_commissions JSONB NOT NULL DEFAULT '[]',
  binary_settings JSONB NOT NULL DEFAULT '{}',
  roi_settings JSONB NOT NULL DEFAULT '{}',
  rank_rewards JSONB NOT NULL DEFAULT '[]',
  booster_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission Runs Table
-- Tracks each commission processing run
CREATE TABLE IF NOT EXISTS commission_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'level', 'binary', 'roi', 'rank', 'booster'
  date_from DATE,
  date_to DATE,
  affected_users INTEGER DEFAULT 0,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for commission runs
CREATE INDEX IF NOT EXISTS idx_commission_runs_type ON commission_runs(type);
CREATE INDEX IF NOT EXISTS idx_commission_runs_status ON commission_runs(status);
CREATE INDEX IF NOT EXISTS idx_commission_runs_created_at ON commission_runs(created_at DESC);

-- Insert default commission settings if none exist
INSERT INTO commission_settings (
  level_commissions,
  binary_settings,
  roi_settings,
  rank_rewards,
  booster_settings
)
SELECT
  '[
    {"level": 1, "percentage": 5, "status": "active"},
    {"level": 2, "percentage": 4, "status": "active"},
    {"level": 3, "percentage": 3, "status": "active"},
    {"level": 4, "percentage": 2, "status": "active"},
    {"level": 5, "percentage": 1, "status": "active"},
    {"level": 6, "percentage": 2, "status": "active"},
    {"level": 7, "percentage": 2, "status": "active"},
    {"level": 8, "percentage": 2, "status": "active"},
    {"level": 9, "percentage": 2, "status": "active"},
    {"level": 10, "percentage": 2, "status": "active"},
    {"level": 11, "percentage": 1, "status": "active"},
    {"level": 12, "percentage": 1, "status": "active"},
    {"level": 13, "percentage": 1, "status": "active"},
    {"level": 14, "percentage": 1, "status": "active"},
    {"level": 15, "percentage": 1, "status": "active"},
    {"level": 16, "percentage": 1, "status": "active"},
    {"level": 17, "percentage": 1, "status": "active"},
    {"level": 18, "percentage": 1, "status": "active"},
    {"level": 19, "percentage": 1, "status": "active"},
    {"level": 20, "percentage": 1, "status": "active"},
    {"level": 21, "percentage": 1, "status": "active"},
    {"level": 22, "percentage": 1, "status": "active"},
    {"level": 23, "percentage": 1, "status": "active"},
    {"level": 24, "percentage": 1, "status": "active"},
    {"level": 25, "percentage": 1, "status": "active"},
    {"level": 26, "percentage": 1, "status": "active"},
    {"level": 27, "percentage": 1, "status": "active"},
    {"level": 28, "percentage": 1, "status": "active"},
    {"level": 29, "percentage": 1, "status": "active"},
    {"level": 30, "percentage": 1, "status": "active"}
  ]'::jsonb,
  '{
    "matchingPercentage": 10,
    "dailyCap": 1000,
    "weeklyCap": 5000,
    "monthlyCap": 20000,
    "matchingRatio": "1:1",
    "flushPeriod": "weekly"
  }'::jsonb,
  '{
    "starterMin": 5,
    "starterMax": 7,
    "growthMin": 7,
    "growthMax": 10,
    "premiumMin": 10,
    "premiumMax": 15,
    "distributionSchedule": "daily"
  }'::jsonb,
  '[
    {"rank": "Bronze", "reward": 500, "requirement": "5 directs"},
    {"rank": "Silver", "reward": 1500, "requirement": "10 directs + $5k team volume"},
    {"rank": "Gold", "reward": 5000, "requirement": "20 directs + $20k team volume"},
    {"rank": "Platinum", "reward": 15000, "requirement": "50 directs + $100k team volume"},
    {"rank": "Diamond", "reward": 50000, "requirement": "100 directs + $500k team volume"}
  ]'::jsonb,
  '{
    "percentage": 5,
    "conditions": "- Minimum 10 active directs\\n- Team volume $50,000+\\n- Active package required"
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM commission_settings LIMIT 1);

-- Add comment
COMMENT ON TABLE commission_settings IS 'Stores all MLM commission configurations';
COMMENT ON TABLE commission_runs IS 'Tracks commission processing runs and their results';
