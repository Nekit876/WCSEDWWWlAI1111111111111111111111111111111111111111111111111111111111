import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nzvmahezuigattdmuhws.supabase.co'
const supabaseKey = 'sb_publishable_lqTHdX7ixippn6AyW-hZOA_KpomeTr6'

export const supabase = createClient(supabaseUrl, supabaseKey)
