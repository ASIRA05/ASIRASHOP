// ========================================
// ASIRASHOP SUPABASE
// ========================================

const SUPABASE_URL =
  "https://izlwohwttnqyhqaceswu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Lbhr1nsVHHnLtHNS642UgQ_cTrnEtm-";


const { createClient } = window.supabase;


// ========================================
// CREATE CLIENT
// ========================================

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: window.localStorage,
      storageKey: "asirashop-auth"
    }
  }
);


// ========================================
// GLOBAL
// ========================================

window.supabaseClient = supabaseClient;

console.log(
  "ASIRASHOP Supabase connected"
);
