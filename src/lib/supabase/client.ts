import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://72.60.248.214:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLXRvcG1laSIsImlhdCI6MTc2MTE4ODQwMCwiZXhwIjoxOTE4OTU0ODAwfQ.bZ6-mLwAkz_-bBvBCOshcnLdkWFjpnCAITuvJk_P5ww';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
