import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  next_billing_date: string | null;
  notification_days: number;
  email_sender: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  cancellation_date: string | null;
};