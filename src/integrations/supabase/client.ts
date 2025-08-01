// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://edzkghvkcdmbouhcbltc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkemtnaHZrY2RtYm91aGNibHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjcyNTgsImV4cCI6MjA2OTA0MzI1OH0.m_6dRDbWAdNKxZJgoNTScmdaWAxkQdcFo2foMpTUFRQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});