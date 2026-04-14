const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL e SUPABASE_SERVICE_KEY não configurados. Configure as variáveis de ambiente.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: { persistSession: false }
});

module.exports = { supabase };
