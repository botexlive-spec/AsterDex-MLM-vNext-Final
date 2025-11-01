/**
 * SQL Seeding Script for 100 Test Users Across 30 MLM Levels
 *
 * INSTRUCTIONS:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to SQL Editor
 * 3. Create a new query
 * 4. Copy and paste this entire script
 * 5. Click "Run" to execute
 *
 * This will create:
 * - 1 Admin user
 * - 100 Test users in pyramid structure
 * - Package purchases
 * - Transactions
 * - KYC submissions
 */

-- ===== STEP 1: Create Admin User =====
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Generate a new UUID for admin if doesn't exist
  admin_user_id := 'a0000000-0000-0000-0000-000000000001'::UUID;

  -- Insert admin user (will skip if id already exists)
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'admin@finaster.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert admin profile
  INSERT INTO public.users (id, email, full_name, password_hash, role, is_active, wallet_balance, total_investment, total_earnings, current_rank, kyc_status, created_at)
  VALUES (
    admin_user_id,
    'admin@finaster.com',
    'System Administrator',
    crypt('Admin@123', gen_salt('bf')),
    'admin',
    true,
    1000000.00,
    0,
    0,
    'diamond'::rank_type,
    'approved'::kyc_status,
    NOW() - INTERVAL '365 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', current_rank = 'diamond'::rank_type, wallet_balance = 1000000.00, password_hash = crypt('Admin@123', gen_salt('bf'));

  RAISE NOTICE 'Admin user created: admin@finaster.com / Admin@123';
END $$;

-- ===== STEP 2: Create 100 Test Users =====
DO $$
DECLARE
  user_id UUID;
  user_count INT := 0;
  level INT;
  first_names TEXT[] := ARRAY['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Mary', 'Patricia', 'Jennifer', 'Linda',
                               'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Daniel', 'Matthew', 'Anthony', 'Mark'];
  last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];
  user_email TEXT;
  user_name TEXT;
  rank_name TEXT;
  kyc_status_val TEXT;
BEGIN
  FOR i IN 1..100 LOOP
    user_id := gen_random_uuid();

    -- Generate user details
    user_email := CONCAT(lower(first_names[1 + (i % array_length(first_names, 1))]), '.',
                         lower(last_names[1 + ((i / 2) % array_length(last_names, 1))]),
                         i, '@testuser.com');
    user_name := CONCAT(first_names[1 + (i % array_length(first_names, 1))], ' ',
                       last_names[1 + ((i / 2) % array_length(last_names, 1))]);

    -- Determine level (pyramid structure)
    level := LEAST(FLOOR(i / 3.5) + 1, 30);

    -- Determine rank based on level
    rank_name := CASE
      WHEN level > 25 THEN 'diamond'
      WHEN level > 20 THEN 'platinum'
      WHEN level > 15 THEN 'gold'
      WHEN level > 10 THEN 'silver'
      WHEN level > 5 THEN 'bronze'
      ELSE 'starter'
    END;

    -- Determine KYC status (60% approved, 20% pending, 10% rejected, 10% not submitted)
    kyc_status_val := CASE
      WHEN random() < 0.6 THEN 'approved'
      WHEN random() < 0.8 THEN 'pending'
      WHEN random() < 0.9 THEN 'rejected'
      ELSE 'not_submitted'
    END;

    -- Create auth user
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000'::UUID,
      user_email,
      crypt('Test@123', gen_salt('bf')),
      NOW(),
      NOW() - (random() * 365)::INT * INTERVAL '1 day',
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create user profile
    INSERT INTO public.users (
      id, email, full_name, password_hash, role, is_active,
      wallet_balance, total_investment, total_earnings,
      current_rank, kyc_status, created_at
    )
    VALUES (
      user_id,
      user_email,
      user_name,
      crypt('Test@123', gen_salt('bf')),
      'user',
      random() > 0.1,  -- 90% active
      (random() * 20000 + 100)::DECIMAL(12,2),
      (random() * 50000)::DECIMAL(12,2),
      (random() * 25000)::DECIMAL(12,2),
      rank_name::rank_type,
      kyc_status_val::kyc_status,
      NOW() - (random() * 365)::INT * INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;

    user_count := user_count + 1;

    IF user_count % 10 = 0 THEN
      RAISE NOTICE 'Created % users...', user_count;
    END IF;
  END LOOP;

  RAISE NOTICE 'Successfully created % test users', user_count;
END $$;

-- ===== STEP 3: Create Packages =====
INSERT INTO public.packages (name, tier, min_amount, max_amount, roi_percentage_min, roi_percentage_max, description, benefits, is_active)
VALUES
  ('Starter Pack', 'tier_1', 1000, 10000, 0.5, 1.0, 'Entry level package with basic returns', '["Daily ROI", "24/7 Support"]'::jsonb, true),
  ('Bronze Pack', 'tier_1', 5000, 50000, 0.6, 1.2, 'Bronze tier package with enhanced returns', '["Daily ROI", "Priority Support", "Weekly Bonus"]'::jsonb, true),
  ('Silver Pack', 'tier_2', 10000, 100000, 0.7, 1.5, 'Silver tier package with premium returns', '["Daily ROI", "Premium Support", "Weekly Bonus", "Monthly Rewards"]'::jsonb, true),
  ('Gold Pack', 'tier_2', 25000, 250000, 0.8, 2.0, 'Gold tier package with excellent returns', '["Daily ROI", "VIP Support", "Weekly Bonus", "Monthly Rewards", "Referral Bonus"]'::jsonb, true),
  ('Platinum Pack', 'tier_3', 50000, 500000, 1.0, 2.5, 'Platinum tier package with maximum returns', '["Daily ROI", "Dedicated Support", "Weekly Bonus", "Monthly Rewards", "Referral Bonus", "Leadership Pool"]'::jsonb, true)
ON CONFLICT (name) DO UPDATE
SET is_active = true;

-- ===== STEP 4: Create Package Purchases =====
DO $$
DECLARE
  user_rec RECORD;
  pkg_rec RECORD;
  pkg_count INT := 0;
  invest_amt DECIMAL(18,6);
  roi_pct DECIMAL(5,2);
  roi_earned_amt DECIMAL(18,6);
  pkg_is_active BOOLEAN;
BEGIN
  FOR user_rec IN SELECT * FROM public.users WHERE role = 'user' LOOP
    -- 70% of users have packages
    IF random() < 0.7 THEN
      -- Each user gets 1-3 packages
      FOR j IN 1..(FLOOR(random() * 3) + 1)::INT LOOP
        SELECT * INTO pkg_rec FROM public.packages ORDER BY random() LIMIT 1;

        -- Random investment amount between min and max
        invest_amt := (random() * (pkg_rec.max_amount - pkg_rec.min_amount) + pkg_rec.min_amount)::DECIMAL(18,6);

        -- Random ROI percentage between min and max
        roi_pct := (random() * (pkg_rec.roi_percentage_max - pkg_rec.roi_percentage_min) + pkg_rec.roi_percentage_min)::DECIMAL(5,2);

        -- Random ROI earned (0-60% of potential)
        roi_earned_amt := (random() * invest_amt * roi_pct / 100 * 0.6)::DECIMAL(18,6);

        -- 70% active, 30% inactive
        pkg_is_active := random() < 0.7;

        INSERT INTO public.user_packages (
          user_id, package_id, amount, roi_percentage, roi_earned, is_active, purchased_at
        )
        VALUES (
          user_rec.id, pkg_rec.id, invest_amt, roi_pct, roi_earned_amt, pkg_is_active,
          NOW() - (random() * 180)::INT * INTERVAL '1 day'
        );

        pkg_count := pkg_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % package purchases', pkg_count;
END $$;

-- ===== STEP 5: Create Transactions =====
DO $$
DECLARE
  user_rec RECORD;
  tx_count INT := 0;
  tx_types TEXT[] := ARRAY['deposit', 'withdrawal', 'package_investment', 'roi_income', 'direct_income', 'matching_bonus', 'level_income', 'rank_reward'];
  tx_type TEXT;
  tx_amount DECIMAL(18,6);
  tx_status TEXT;
BEGIN
  FOR user_rec IN SELECT * FROM public.users WHERE role = 'user' LOOP
    -- Each user gets 5-20 transactions
    FOR j IN 1..(FLOOR(random() * 16) + 5)::INT LOOP
      tx_type := tx_types[1 + FLOOR(random() * array_length(tx_types, 1))::INT];

      tx_amount := CASE tx_type
        WHEN 'deposit' THEN (random() * 10000 + 100)::DECIMAL(18,6)
        WHEN 'withdrawal' THEN -(random() * 5000 + 100)::DECIMAL(18,6)
        WHEN 'package_investment' THEN -(random() * 25000 + 1000)::DECIMAL(18,6)
        WHEN 'roi_income' THEN (random() * 500 + 10)::DECIMAL(18,6)
        WHEN 'direct_income' THEN (random() * 1000 + 50)::DECIMAL(18,6)
        WHEN 'matching_bonus' THEN (random() * 500 + 20)::DECIMAL(18,6)
        WHEN 'level_income' THEN (random() * 300 + 15)::DECIMAL(18,6)
        WHEN 'rank_reward' THEN (random() * 2000 + 100)::DECIMAL(18,6)
      END;

      tx_status := CASE
        WHEN tx_type = 'withdrawal' AND random() < 0.3 THEN 'pending'
        WHEN random() < 0.05 THEN 'failed'
        ELSE 'completed'
      END;

      INSERT INTO public.mlm_transactions (
        user_id, transaction_type, amount, status, metadata, created_at
      )
      VALUES (
        user_rec.id,
        tx_type::transaction_type,
        tx_amount,
        tx_status::transaction_status,
        jsonb_build_object('description', tx_type || ' transaction', 'auto_generated', true),
        NOW() - (random() * 180)::INT * INTERVAL '1 day'
      );

      tx_count := tx_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % transactions', tx_count;
END $$;

-- ===== STEP 6: KYC Submissions (Skipped - table not in schema) =====
-- The kyc_submissions table does not exist in this database schema

-- ===== Summary =====
DO $$
DECLARE
  total_users INT;
  total_packages INT;
  total_transactions INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.users WHERE role = 'user';
  SELECT COUNT(*) INTO total_packages FROM public.user_packages;
  SELECT COUNT(*) INTO total_transactions FROM public.mlm_transactions;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SEEDING COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users created: %', total_users;
  RAISE NOTICE 'Package purchases: %', total_packages;
  RAISE NOTICE 'Transactions: %', total_transactions;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Credentials:';
  RAISE NOTICE 'Admin: admin@finaster.com / Admin@123';
  RAISE NOTICE 'Users: [firstname].[lastname][1-100]@testuser.com / Test@123';
  RAISE NOTICE 'Example: james.smith1@testuser.com / Test@123';
END $$;
