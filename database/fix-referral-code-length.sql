-- ============================================================================
-- FIX REFERRAL_CODE COLUMN LENGTH
-- ============================================================================
-- Issue: referral_code was VARCHAR(20) but generated codes are 21 characters
-- Format: REF${Date.now()}${5-char-random} = REF + 13 digits + 5 chars = 21 chars
-- Solution: Increase to VARCHAR(255) to accommodate current and future formats
-- ============================================================================

USE finaster_mlm;

ALTER TABLE users MODIFY COLUMN referral_code VARCHAR(255) NULL;

SELECT 'Referral code column updated successfully!' AS message;

-- Verify the change
DESCRIBE users;
