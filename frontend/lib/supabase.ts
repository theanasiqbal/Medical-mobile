import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvinvxrsztdssnixikcw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aW52eHJzenRkc3NuaXhpa2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzU5NjQsImV4cCI6MjA5MTY1MTk2NH0.7VOvBLa6j216VJyQYVruzvUrxMSHjRdk3i--WgqJqnY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
