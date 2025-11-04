-- Fix RLS policies for packages table to allow users to view active packages
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to view active packages" ON packages;
DROP POLICY IF EXISTS "Allow admins full access to packages" ON packages;

-- Enable RLS on packages table
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ALL users (authenticated and anon) to view active packages
CREATE POLICY "Allow users to view active packages"
ON packages
FOR SELECT
TO public
USING (status = 'active');

-- Policy 2: Allow admins full access (all operations)
CREATE POLICY "Allow admins full access to packages"
ON packages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'packages';

-- Test query as user (should return active packages)
SELECT id, name, status FROM packages WHERE status = 'active';
