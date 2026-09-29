const SUPABASE_URL = "https://izlwohwttnqyhqaceswu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Lbhr1nsVHHnLtHNS642UgQ_cTrnEtm-";

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;
