/**
 * Binary Matching Engine Schema Updates
 * Adds tracking for unmatched volumes and matched history
 */

USE finaster_mlm;

-- Add unmatched volume tracking to binary_tree
ALTER TABLE binary_tree
ADD COLUMN left_unmatched DECIMAL(15, 6) DEFAULT 0.00 AFTER left_volume,
ADD COLUMN right_unmatched DECIMAL(15, 6) DEFAULT 0.00 AFTER right_volume,
ADD COLUMN matched_to_date DECIMAL(15, 6) DEFAULT 0.00 AFTER right_unmatched,
ADD COLUMN last_matched_at TIMESTAMP NULL AFTER matched_to_date;

-- Initialize unmatched volumes from existing volumes
UPDATE binary_tree
SET left_unmatched = left_volume,
    right_unmatched = right_volume;

-- Create binary_matches table for tracking matching history
CREATE TABLE IF NOT EXISTS binary_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  matched_volume DECIMAL(15, 6) NOT NULL,
  left_volume_before DECIMAL(15, 6) NOT NULL,
  right_volume_before DECIMAL(15, 6) NOT NULL,
  left_volume_after DECIMAL(15, 6) NOT NULL,
  right_volume_after DECIMAL(15, 6) NOT NULL,
  payout_amount DECIMAL(15, 6) NOT NULL,
  payout_percentage DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add binary matching config to plan_settings if not exists
INSERT IGNORE INTO plan_settings (feature_key, feature_name, is_active, payload, description)
VALUES (
  'binary_matching',
  'Binary Matching Plan',
  TRUE,
  '{
    "payout_percentage": 10,
    "min_match_amount": 100,
    "max_daily_match": 10000,
    "matching_ratio": "1:1",
    "cycle_payout": true
  }',
  'Binary tree matching configuration - pays percentage of matched volume'
);

SELECT '✅ Binary matching schema updates completed!' AS status;
