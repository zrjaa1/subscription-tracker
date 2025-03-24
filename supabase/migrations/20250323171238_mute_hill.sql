/*
  # Add notes and cancellation reminder

  1. Changes
    - Add `notes` column for free-text comments
    - Add `cancellation_date` for optional cancellation reminders
    
  2. Security
    - Text sanitization is handled at the application level
    - Existing RLS policies will cover the new columns
*/

-- Add new columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS cancellation_date date;