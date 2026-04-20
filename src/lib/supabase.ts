import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpawfssawmjkwhkqnqjj.supabase.co';
const supabaseKey = 'sb_publishable_SSWH9GUfoZDG6-1Bod8lyg_oAiKr_Ts';

export const supabase = createClient(supabaseUrl, supabaseKey);