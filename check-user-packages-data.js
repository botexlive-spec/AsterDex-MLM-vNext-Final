import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dsgtyrwtlpnckvcozfbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3R5cnd0bHBuY2t2Y296ZmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg0MTQwNywiZXhwIjoyMDc3NDE3NDA3fQ.O6HLc6lQHgFkYpb1scfBGa2iaWwfo3yXIxHlbGEyOxg'
);

const { count, error } = await supabase
  .from('user_packages')
  .select('*', { count: 'exact', head: true });

console.log(`user_packages row count: ${count || 0}`);
if (error) console.log('Error:', error.message);
