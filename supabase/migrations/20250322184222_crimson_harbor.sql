/*
  # Initial Schema Setup for Subscription Tracker

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Name of the subscription
      - `amount` (decimal) - Cost of subscription
      - `frequency` (text) - Billing frequency (monthly, yearly, etc.)
      - `category` (text) - Category of subscription
      - `next_billing_date` (date) - Next billing date
      - `notification_days` (int) - Days before billing to notify
      - `email_sender` (text) - Email address of subscription sender
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for authenticated users to manage their own subscriptions
*/

CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    name text NOT NULL,
    amount decimal(10,2) NOT NULL,
    frequency text NOT NULL,
    category text NOT NULL,
    next_billing_date date,
    notification_days integer DEFAULT 7,
    email_sender text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
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