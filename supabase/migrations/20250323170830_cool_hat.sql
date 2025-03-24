/*
  # Update RLS Policies for Subscriptions Table

  This migration safely updates the RLS policies for the subscriptions table.
  It handles cases where the table and policies may already exist.

  1. Changes
    - Ensures RLS is enabled
    - Updates all CRUD policies for proper user_id checks
    
  2. Security
    - Reinforces RLS policies for authenticated users
    - Ensures consistent auth.uid() checks across all policies
*/

-- Enable RLS (safe to run multiple times)
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;

-- Recreate policies with correct user_id check
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
    ON subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);