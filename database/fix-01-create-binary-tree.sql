-- ═══════════════════════════════════════════════════════════════
-- FIX #1: CREATE BINARY TREE ENTRIES FOR ALL USERS
-- ═══════════════════════════════════════════════════════════════
-- Issue: 103 users without binary tree entry
-- Impact: Binary matching bonuses won't work
-- Fix: Create binary tree entries for all users without one
-- ═══════════════════════════════════════════════════════════════

-- First, add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'binary_tree_user_id_unique'
    ) THEN
        ALTER TABLE public.binary_tree
        ADD CONSTRAINT binary_tree_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on binary_tree.user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on binary_tree.user_id already exists';
    END IF;
END $$;

-- Temporary function to find admin/root user
DO $$
DECLARE
    admin_user_id UUID;
    user_record RECORD;
    parent_user_id UUID;
    parent_left_child UUID;
    parent_right_child UUID;
    new_position VARCHAR(10);
BEGIN
    -- Find first admin user (root of tree)
    SELECT id INTO admin_user_id
    FROM public.users
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'No admin user found. Creating root binary tree entry for first user.';
        SELECT id INTO admin_user_id
        FROM public.users
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    RAISE NOTICE 'Root user ID: %', admin_user_id;

    -- Create binary tree entry for admin (root) if doesn't exist
    INSERT INTO public.binary_tree (
        user_id,
        parent_id,
        left_child_id,
        right_child_id,
        level,
        position,
        left_volume,
        right_volume,
        created_at,
        updated_at
    )
    VALUES (
        admin_user_id,
        NULL,  -- Root has no parent
        NULL,
        NULL,
        0,     -- Root is level 0
        'root',
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- For all users without binary tree entry
    FOR user_record IN
        SELECT u.id, u.email, u.sponsor_id, u.created_at
        FROM public.users u
        LEFT JOIN public.binary_tree bt ON u.id = bt.user_id
        WHERE bt.id IS NULL
          AND u.id != admin_user_id
        ORDER BY u.created_at ASC
    LOOP
        -- Determine parent (sponsor or root if no sponsor)
        parent_user_id := COALESCE(user_record.sponsor_id, admin_user_id);

        -- Get parent's current children
        SELECT left_child_id, right_child_id
        INTO parent_left_child, parent_right_child
        FROM public.binary_tree
        WHERE user_id = parent_user_id;

        -- Determine position (left or right)
        IF parent_left_child IS NULL THEN
            new_position := 'left';

            -- Update parent's left child
            UPDATE public.binary_tree
            SET left_child_id = user_record.id,
                updated_at = NOW()
            WHERE user_id = parent_user_id;

        ELSIF parent_right_child IS NULL THEN
            new_position := 'right';

            -- Update parent's right child
            UPDATE public.binary_tree
            SET right_child_id = user_record.id,
                updated_at = NOW()
            WHERE user_id = parent_user_id;
        ELSE
            -- Parent has both children, find next available position
            -- Use sponsor's left leg by default
            new_position := 'left';
            parent_user_id := parent_left_child;

            RAISE NOTICE 'Parent % already has both children, placing under left child %', parent_user_id, parent_left_child;
        END IF;

        -- Create binary tree entry for user
        INSERT INTO public.binary_tree (
            user_id,
            parent_id,
            left_child_id,
            right_child_id,
            level,
            position,
            left_volume,
            right_volume,
            created_at,
            updated_at
        )
        VALUES (
            user_record.id,
            parent_user_id,
            NULL,
            NULL,
            1,  -- Will update properly later
            new_position,
            0,
            0,
            user_record.created_at,
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;

        RAISE NOTICE 'Created binary tree entry for user % (%) in position % under parent %',
                     user_record.email, user_record.id, new_position, parent_user_id;
    END LOOP;

    -- Update all users' position field (except root)
    UPDATE public.users u
    SET position = bt.position
    FROM public.binary_tree bt
    WHERE u.id = bt.user_id
      AND bt.position IN ('left', 'right')
      AND (u.position IS NULL OR u.position != bt.position);

    -- Update all users' placement_id field
    UPDATE public.users u
    SET placement_id = bt.parent_id
    FROM public.binary_tree bt
    WHERE u.id = bt.user_id
      AND bt.parent_id IS NOT NULL
      AND (u.placement_id IS NULL OR u.placement_id != bt.parent_id);

    RAISE NOTICE 'Binary tree creation complete!';
END $$;

-- Verify results
DO $$
DECLARE
    users_without_tree INTEGER;
    total_users INTEGER;
    total_tree_nodes INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_without_tree
    FROM public.users u
    LEFT JOIN public.binary_tree bt ON u.id = bt.user_id
    WHERE bt.id IS NULL;

    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO total_tree_nodes FROM public.binary_tree;

    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Total binary tree nodes: %', total_tree_nodes;
    RAISE NOTICE 'Users without tree entry: %', users_without_tree;

    IF users_without_tree = 0 THEN
        RAISE NOTICE 'SUCCESS: All users have binary tree entries!';
    ELSE
        RAISE WARNING 'FAILED: % users still without tree entries', users_without_tree;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════';
END $$;
