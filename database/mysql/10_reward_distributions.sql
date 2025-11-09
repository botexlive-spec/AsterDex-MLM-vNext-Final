/**
 * Create reward_distributions table
 * Tracks monthly reward payouts to users
 */

CREATE TABLE IF NOT EXISTS reward_distributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reward_id INT NOT NULL,
  reward_amount DECIMAL(15,6) NOT NULL,
  business_volume DECIMAL(15,6) NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  distributed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_user_id (user_id),
  KEY idx_reward_id (reward_id),
  KEY idx_period (period_month, period_year),
  KEY idx_status (status),
  UNIQUE KEY idx_unique_distribution (user_id, reward_id, period_month, period_year),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
