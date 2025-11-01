-- ============================================
-- MLM Database Functions with Transaction Support
-- ============================================
-- These functions wrap MLM operations in transactions to ensure atomicity
-- Created: 2025-11-01

-- ============================================
-- 1. PACKAGE PURCHASE WITH TRANSACTION
-- ============================================

CREATE OR REPLACE FUNCTION purchase_package_atomic(
  p_user_id UUID,
  p_package_id UUID,
  p_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_package RECORD;
  v_user RECORD;
  v_user_package_id UUID;
  v_roi_percentage DECIMAL;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)

  -- 1. Get and validate package
  SELECT * INTO v_package
  FROM packages
  WHERE id = p_package_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;

  -- 2. Validate amount
  IF p_amount < v_package.min_amount THEN
    RAISE EXCEPTION 'Amount below minimum: %', v_package.min_amount;
  END IF;

  IF v_package.max_amount IS NOT NULL AND p_amount > v_package.max_amount THEN
    RAISE EXCEPTION 'Amount above maximum: %', v_package.max_amount;
  END IF;

  -- 3. Get and validate user
  SELECT * INTO v_user
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 4. Check robot subscription
  IF NOT v_user.robot_subscription_active THEN
    RAISE EXCEPTION 'Active robot subscription required';
  END IF;

  -- 5. Check balance
  IF v_user.wallet_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', v_user.wallet_balance, p_amount;
  END IF;

  -- 6. Calculate ROI percentage based on amount
  v_roi_percentage := v_package.roi_percentage_min +
    ((v_package.roi_percentage_max - v_package.roi_percentage_min) *
     (p_amount - v_package.min_amount) /
     NULLIF(COALESCE(v_package.max_amount, p_amount) - v_package.min_amount, 0));

  -- 7. Deduct balance and update investment
  UPDATE users
  SET wallet_balance = wallet_balance - p_amount,
      total_investment = total_investment + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 8. Create user package
  INSERT INTO user_packages (
    user_id,
    package_id,
    amount,
    roi_percentage,
    roi_earned,
    is_active,
    purchased_at
  ) VALUES (
    p_user_id,
    p_package_id,
    p_amount,
    v_roi_percentage,
    0,
    TRUE,
    NOW()
  ) RETURNING id INTO v_user_package_id;

  -- 9. Create transaction record
  INSERT INTO mlm_transactions (
    user_id,
    transaction_type,
    amount,
    status,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'package_investment',
    p_amount,
    'completed',
    'Package purchase: ' || v_package.name,
    jsonb_build_object(
      'package_id', p_package_id,
      'user_package_id', v_user_package_id,
      'roi_percentage', v_roi_percentage
    ),
    NOW()
  );

  -- 10. Return success result
  v_result := jsonb_build_object(
    'success', TRUE,
    'user_package_id', v_user_package_id,
    'amount', p_amount,
    'roi_percentage', v_roi_percentage,
    'message', 'Package purchased successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Package purchase failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. UPDATE BINARY TREE VOLUMES WITH TRANSACTION
-- ============================================

CREATE OR REPLACE FUNCTION update_binary_volumes_atomic(
  p_user_id UUID,
  p_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_tree_node RECORD;
  v_parent_id UUID;
  v_position TEXT;
  v_nodes_updated INTEGER := 0;
BEGIN
  -- Get user's position in tree
  SELECT parent_id, position INTO v_tree_node
  FROM binary_tree
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- User not in binary tree yet
    RETURN jsonb_build_object('nodes_updated', 0, 'message', 'User not in binary tree');
  END IF;

  v_parent_id := v_tree_node.parent_id;
  v_position := v_tree_node.position;

  -- Traverse up the tree and update volumes
  WHILE v_parent_id IS NOT NULL LOOP
    -- Update binary_tree table
    IF v_position = 'left' THEN
      UPDATE binary_tree
      SET left_volume = left_volume + p_amount,
          updated_at = NOW()
      WHERE user_id = v_parent_id;

      -- Also update users table
      UPDATE users
      SET left_volume = left_volume + p_amount,
          updated_at = NOW()
      WHERE id = v_parent_id;
    ELSE
      UPDATE binary_tree
      SET right_volume = right_volume + p_amount,
          updated_at = NOW()
      WHERE user_id = v_parent_id;

      -- Also update users table
      UPDATE users
      SET right_volume = right_volume + p_amount,
          updated_at = NOW()
      WHERE id = v_parent_id;
    END IF;

    v_nodes_updated := v_nodes_updated + 1;

    -- Get next parent
    SELECT parent_id, position INTO v_tree_node
    FROM binary_tree
    WHERE user_id = v_parent_id;

    EXIT WHEN NOT FOUND;

    v_parent_id := v_tree_node.parent_id;
    v_position := v_tree_node.position;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'nodes_updated', v_nodes_updated,
    'volume_added', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Binary volume update failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. PROCESS LEVEL INCOME WITH TRANSACTION
-- ============================================

CREATE OR REPLACE FUNCTION process_level_income_atomic(
  p_source_user_id UUID,
  p_amount DECIMAL,
  p_max_levels INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_current_user_id UUID;
  v_sponsor_id UUID;
  v_level INTEGER := 1;
  v_sponsor_data RECORD;
  v_income_amount DECIMAL;
  v_total_distributed DECIMAL := 0;
  v_recipients_count INTEGER := 0;
BEGIN
  v_current_user_id := p_source_user_id;

  -- Traverse up to 30 levels
  WHILE v_level <= p_max_levels LOOP
    -- Get sponsor
    SELECT sponsor_id, levels_unlocked INTO v_sponsor_id, v_sponsor_data
    FROM users
    WHERE id = v_current_user_id;

    EXIT WHEN v_sponsor_id IS NULL;

    -- Get sponsor's levels_unlocked
    SELECT levels_unlocked, wallet_balance, total_earnings INTO v_sponsor_data
    FROM users
    WHERE id = v_sponsor_id;

    -- Check if sponsor has this level unlocked
    IF v_sponsor_data.levels_unlocked >= v_level THEN
      -- Calculate income for this level
      -- Using simplified fixed amount per level (should be from config table)
      v_income_amount := CASE v_level
        WHEN 1 THEN p_amount * 0.10  -- 10% for level 1
        WHEN 2 THEN p_amount * 0.05  -- 5% for level 2
        WHEN 3 THEN p_amount * 0.03  -- 3% for level 3
        ELSE p_amount * 0.01          -- 1% for levels 4-30
      END;

      -- Credit income to sponsor
      UPDATE users
      SET wallet_balance = wallet_balance + v_income_amount,
          total_earnings = total_earnings + v_income_amount,
          updated_at = NOW()
      WHERE id = v_sponsor_id;

      -- Record level income
      INSERT INTO level_incomes (
        user_id,
        from_user_id,
        level,
        amount,
        income_type,
        created_at
      ) VALUES (
        v_sponsor_id,
        p_source_user_id,
        v_level,
        v_income_amount,
        'level_income',
        NOW()
      );

      -- Create transaction
      INSERT INTO mlm_transactions (
        user_id,
        from_user_id,
        transaction_type,
        amount,
        level,
        status,
        description,
        created_at
      ) VALUES (
        v_sponsor_id,
        p_source_user_id,
        'level_income',
        v_income_amount,
        v_level,
        'completed',
        'Level ' || v_level || ' income from package purchase',
        NOW()
      );

      v_total_distributed := v_total_distributed + v_income_amount;
      v_recipients_count := v_recipients_count + 1;
    END IF;

    v_current_user_id := v_sponsor_id;
    v_level := v_level + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'levels_processed', v_level - 1,
    'recipients', v_recipients_count,
    'total_distributed', v_total_distributed
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Level income processing failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. COMPLETE PACKAGE PURCHASE ORCHESTRATION
-- ============================================

CREATE OR REPLACE FUNCTION complete_package_purchase(
  p_user_id UUID,
  p_package_id UUID,
  p_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_purchase_result JSONB;
  v_volume_result JSONB;
  v_income_result JSONB;
  v_final_result JSONB;
BEGIN
  -- This function orchestrates all MLM operations in a single transaction

  -- Step 1: Purchase package (deduct balance, create package record)
  SELECT purchase_package_atomic(p_user_id, p_package_id, p_amount) INTO v_purchase_result;

  -- Step 2: Update binary tree volumes
  SELECT update_binary_volumes_atomic(p_user_id, p_amount) INTO v_volume_result;

  -- Step 3: Process level income for upline
  SELECT process_level_income_atomic(p_user_id, p_amount) INTO v_income_result;

  -- Note: Matching bonuses and rank checks should be called separately
  -- as they are less critical and can be eventually consistent

  -- Build final result
  v_final_result := jsonb_build_object(
    'success', TRUE,
    'purchase', v_purchase_result,
    'binary_volumes', v_volume_result,
    'level_income', v_income_result,
    'message', 'Package purchase completed successfully'
  );

  RETURN v_final_result;

EXCEPTION
  WHEN OTHERS THEN
    -- All operations will be rolled back
    RAISE EXCEPTION 'Complete package purchase failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION purchase_package_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION update_binary_volumes_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION process_level_income_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION complete_package_purchase TO authenticated;

-- Grant to service role for backend operations
GRANT EXECUTE ON FUNCTION purchase_package_atomic TO service_role;
GRANT EXECUTE ON FUNCTION update_binary_volumes_atomic TO service_role;
GRANT EXECUTE ON FUNCTION process_level_income_atomic TO service_role;
GRANT EXECUTE ON FUNCTION complete_package_purchase TO service_role;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

/*
-- Example 1: Purchase a package with full transaction support
SELECT complete_package_purchase(
  'user-uuid-here'::UUID,
  'package-uuid-here'::UUID,
  1000.00
);

-- Example 2: Just update binary volumes
SELECT update_binary_volumes_atomic(
  'user-uuid-here'::UUID,
  500.00
);

-- Example 3: Process level income only
SELECT process_level_income_atomic(
  'user-uuid-here'::UUID,
  1000.00,
  30  -- max levels
);

-- Example 4: Purchase package (basic operation)
SELECT purchase_package_atomic(
  'user-uuid-here'::UUID,
  'package-uuid-here'::UUID,
  1000.00
);
*/

-- ============================================
-- NOTES
-- ============================================

/*
Benefits of these functions:
1. ACID Compliance - All operations atomic
2. Rollback on Failure - No partial updates
3. Simplified Error Handling - Single point of failure
4. Performance - Fewer round trips
5. Data Integrity - Guaranteed consistency

Migration Strategy:
1. Deploy these functions to database
2. Update mlm.service.ts to call these functions via supabase.rpc()
3. Keep old logic as fallback during transition
4. Monitor and test thoroughly
5. Remove old logic once stable

Future Enhancements:
1. Move level income config to database table
2. Add matching bonus calculation here
3. Add rank achievement calculation here
4. Add booster income calculation here
5. Add detailed logging and audit trail
*/
