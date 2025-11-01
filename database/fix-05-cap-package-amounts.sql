-- ═══════════════════════════════════════════════════════════════
-- FIX #5: CAP PACKAGE AMOUNTS AT MAXIMUM
-- ═══════════════════════════════════════════════════════════════
-- Issue: 55 user packages with amounts exceeding maximum investment
-- Impact: Invalid data, could cause errors in calculations
-- Fix: Cap amounts at package maximum investment limit
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Capping package amounts at maximum limits...';

    -- Cap amounts that exceed maximum
    UPDATE public.user_packages up
    SET amount = p.max_investment
    FROM public.packages p
    WHERE up.package_id = p.id
      AND up.amount > p.max_investment;

    GET DIAGNOSTICS fixed_count = ROW_COUNT;

    RAISE NOTICE 'Capped % packages at maximum investment limit', fixed_count;

    -- Also ensure no amounts are below minimum
    UPDATE public.user_packages up
    SET amount = p.min_investment
    FROM public.packages p
    WHERE up.package_id = p.id
      AND up.amount < p.min_investment;

    GET DIAGNOSTICS fixed_count = ROW_COUNT;

    IF fixed_count > 0 THEN
        RAISE NOTICE 'Raised % packages to minimum investment limit', fixed_count;
    END IF;
END $$;

-- Verify
DO $$
DECLARE
    invalid_amounts INTEGER;
    total_packages INTEGER;
    amount_range RECORD;
BEGIN
    -- Check for invalid amounts
    SELECT COUNT(*) INTO invalid_amounts
    FROM public.user_packages up
    JOIN public.packages p ON up.package_id = p.id
    WHERE up.amount < p.min_investment OR up.amount > p.max_investment;

    SELECT COUNT(*) INTO total_packages
    FROM public.user_packages;

    -- Get amount distribution
    SELECT
        MIN(amount) as min_amt,
        MAX(amount) as max_amt,
        AVG(amount) as avg_amt
    INTO amount_range
    FROM public.user_packages;

    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE 'Total user packages: %', total_packages;
    RAISE NOTICE 'Invalid amounts: %', invalid_amounts;
    RAISE NOTICE 'Amount range: $% - $%', amount_range.min_amt, amount_range.max_amt;
    RAISE NOTICE 'Average amount: $%', amount_range.avg_amt;

    IF invalid_amounts = 0 THEN
        RAISE NOTICE 'SUCCESS: All package amounts within valid ranges!';
    ELSE
        RAISE WARNING 'FAILED: % invalid amounts remain', invalid_amounts;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════';
END $$;
