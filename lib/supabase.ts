// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service Role Key används här eftersom Server Actions körs på servern.
// Det ger rättigheter att skriva till Storage utan att brottas med RLS-regler direkt.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
