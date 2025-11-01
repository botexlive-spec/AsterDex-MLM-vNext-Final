-- ═══════════════════════════════════════════════════════════════
-- FIX #3: FIX NEGATIVE PACKAGE INVESTMENT AMOUNTS
-- ═══════════════════════════════════════════════════════════════
-- Issue: 152 package_investment transactions with negative amounts
-- Impact: Incorrect transaction history and wallet calculations
-- Fix: Convert negative amounts to positive (they should be debits, not credits)
-- ═══════════════════════════════════════════════════════════════
-- Note: Withdrawals SHOULD be negative, so we don't touch those
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Fixing negative package_investment amounts...';

    -- Convert negative package_investment amounts to positive
    UPDATE public.mlm_transactions
    SET amount = ABS(amount)
    WHERE transaction_type = 'package_investment'
      AND amount < 0;

    GET DIAGNOSTICS fixed_count = ROW_COUNT;

    RAISE NOTICE 'Fixed % negative package_investment transactions', fixed_count;
END $$;

-- Verify results
DO $$
DECLARE
    negative_package_investments INTEGER;
    total_package_investments INTEGER;
    negative_non_withdrawals INTEGER;
BEGIN
    -- Check package investments
    SELECT COUNT(*) INTO negative_package_investments
    FROM public.mlm_transactions
    WHERE transaction_type = 'package_investment' AND amount < 0;

    SELECT COUNT(*) INTO total_package_investments
    FROM public.mlm_transactions
    WHERE transaction_type = 'package_investment';

    -- Check all non-withdrawal negatives
    SELECT COUNT(*) INTO negative_non_withdrawals
    FROM public.mlm_transactions
    WHERE amount < 0 AND transaction_type != 'withdrawal';

    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE 'Total package investments: %', total_package_investments;
    RAISE NOTICE 'Negative package investments: %', negative_package_investments;
    RAISE NOTICE 'Total negative non-withdrawals: %', negative_non_withdrawals;

    IF negative_package_investments = 0 THEN
        RAISE NOTICE 'SUCCESS: All package investments now have positive amounts!';
    ELSE
        RAISE WARNING 'FAILED: % negative package investments remain', negative_package_investments;
    END IF;

    IF negative_non_withdrawals = 0 THEN
        RAISE NOTICE 'SUCCESS: No invalid negative amounts found!';
    ELSE
        RAISE NOTICE 'INFO: % negative amounts remain (should all be withdrawals)', negative_non_withdrawals;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════';
END $$;
