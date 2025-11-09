/**
 * Extend level_unlocks table to support 30 levels
 * Add level_16_unlocked through level_30_unlocked
 */

ALTER TABLE level_unlocks
ADD COLUMN level_16_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_17_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_18_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_19_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_20_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_21_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_22_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_23_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_24_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_25_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_26_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_27_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_28_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_29_unlocked TINYINT(1) DEFAULT 0,
ADD COLUMN level_30_unlocked TINYINT(1) DEFAULT 0;
