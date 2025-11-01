-- ═══════════════════════════════════════════════════════════════
-- FIX #2: MIGRATE INVALID PACKAGE REFERENCES
-- ═══════════════════════════════════════════════════════════════
-- Issue: 131 user_packages pointing to deleted packages
-- Impact: User packages cannot be displayed or processed
-- Fix: Migrate to current packages based on investment amount
-- ═══════════════════════════════════════════════════════════════

-- Get current package IDs
DO $$
DECLARE
    starter_package_id UUID;
    growth_package_id UUID;
    premium_package_id UUID;
    migrated_count INTEGER := 0;
BEGIN
    -- Find current active packages
    SELECT id INTO starter_package_id
    FROM public.packages
    WHERE name = 'Starter Package' AND status = 'active'
    LIMIT 1;

    SELECT id INTO growth_package_id
    FROM public.packages
    WHERE name = 'Growth Package' AND status = 'active'
    LIMIT 1;

    SELECT id INTO premium_package_id
    FROM public.packages
    WHERE name = 'Premium Package' AND status = 'active'
    LIMIT 1;

    RAISE NOTICE 'Current Package IDs:';
    RAISE NOTICE '  Starter: %', starter_package_id;
    RAISE NOTICE '  Growth: %', growth_package_id;
    RAISE NOTICE '  Premium: %', premium_package_id;

    -- Migrate orphaned packages based on amount
    -- Starter: $100 - $2,000
    UPDATE public.user_packages
    SET package_id = starter_package_id    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id)
      AND amount >= 100 AND amount <= 2000;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % packages to Starter Package', migrated_count;

    -- Growth: $2,001 - $5,000
    UPDATE public.user_packages
    SET package_id = growth_package_id    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id)
      AND amount > 2000 AND amount <= 5000;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % packages to Growth Package', migrated_count;

    -- Premium: $5,001+
    UPDATE public.user_packages
    SET package_id = premium_package_id    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id)
      AND amount > 5000;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % packages to Premium Package', migrated_count;

    -- Handle any remaining packages (amount < $100 or NULL)
    UPDATE public.user_packages
    SET package_id = starter_package_id,
        amount = GREATEST(amount, 100)  -- Ensure minimum $100
    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id);

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    IF migrated_count > 0 THEN
        RAISE NOTICE 'Migrated % remaining packages to Starter Package (adjusted amounts)', migrated_count;
    END IF;
END $$;

-- Verify results
DO $$
DECLARE
    invalid_packages INTEGER;
    total_packages INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_packages
    FROM public.user_packages up
    WHERE NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.id = up.package_id);

    SELECT COUNT(*) INTO total_packages FROM public.user_packages;

    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE 'Total user packages: %', total_packages;
    RAISE NOTICE 'Invalid package references: %', invalid_packages;

    IF invalid_packages = 0 THEN
        RAISE NOTICE 'SUCCESS: All user_packages now reference valid packages!';
    ELSE
        RAISE WARNING 'FAILED: % invalid package references remain', invalid_packages;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════';
END $$;
