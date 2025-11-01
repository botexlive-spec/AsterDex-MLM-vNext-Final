-- ═══════════════════════════════════════════════════════════════
-- FIX #4: FIX DUPLICATE BINARY POSITIONS
-- ═══════════════════════════════════════════════════════════════
-- Issue: 100 users placed in same 'left' position under one parent
-- Impact: Binary tree structure is incorrect
-- Fix: Delete all binary tree entries and recreate properly
-- ═══════════════════════════════════════════════════════════════
-- Note: This is a simpler fix - just delete all and let the app recreate
-- or set all to NULL parent for manual placement
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT parent_id, position, COUNT(*) as cnt
        FROM public.binary_tree
        WHERE parent_id IS NOT NULL
        GROUP BY parent_id, position
        HAVING COUNT(*) > 1
    ) AS dups;

    RAISE NOTICE 'Found % duplicate binary position groups', duplicate_count;

    IF duplicate_count > 0 THEN
        -- For this fix, we'll keep the first occurrence and set others to NULL parent
        -- This effectively "orphans" them for manual re-placement

        -- Identify all nodes that are duplicates (except the first one)
        WITH duplicates AS (
            SELECT bt.id, bt.user_id,
                   ROW_NUMBER() OVER (PARTITION BY bt.parent_id, bt.position ORDER BY bt.created_at) as rn
            FROM public.binary_tree bt
            WHERE bt.parent_id IS NOT NULL
        )
        UPDATE public.binary_tree
        SET parent_id = NULL,
            left_child_id = NULL,
            right_child_id = NULL,
            position = NULL
        WHERE id IN (
            SELECT id FROM duplicates WHERE rn > 1
        );

        GET DIAGNOSTICS duplicate_count = ROW_COUNT;
        RAISE NOTICE 'Reset % duplicate nodes to NULL parent for manual placement', duplicate_count;

        -- Update users table
        UPDATE public.users u
        SET placement_id = NULL,
            position = NULL
        WHERE id IN (
            SELECT user_id FROM public.binary_tree WHERE parent_id IS NULL
        )
        AND u.id != (SELECT id FROM public.users WHERE role = 'admin' ORDER BY created_at LIMIT 1);

    END IF;
END $$;

-- Verify
DO $$
DECLARE
    duplicate_count INTEGER;
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT parent_id, position, COUNT(*) as cnt
        FROM public.binary_tree
        WHERE parent_id IS NOT NULL
        GROUP BY parent_id, position
        HAVING COUNT(*) > 1
    ) AS dups;

    SELECT COUNT(*) INTO orphaned_count
    FROM public.binary_tree
    WHERE parent_id IS NULL;

    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE 'Duplicate binary positions: %', duplicate_count;
    RAISE NOTICE 'Orphaned nodes (NULL parent): %', orphaned_count;

    IF duplicate_count = 0 THEN
        RAISE NOTICE 'SUCCESS: No duplicate binary positions!';
    ELSE
        RAISE WARNING 'FAILED: % duplicate positions remain', duplicate_count;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════';
END $$;
