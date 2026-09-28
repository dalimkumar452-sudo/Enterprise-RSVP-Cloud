import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vkxaswcrbnmgpuibagpi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGFzd2NyYm5tZ3B1aWJhZ3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjI4NjMsImV4cCI6MjEwNjA5ODg2M30.SRIDizySPT0Pohsof_9qkvAE_yuyH_HBCYTHW23W9S0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)