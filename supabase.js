// ========================================
// ASIRASHOP - SUPABASE CONNECTION
// ========================================

const SUPABASE_URL = "https://izlwohwttnqyhqaceswu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Lbhr1nsVHHnLtHNS642UgQ_cTrnEtm-";

if (!window.supabase) {
  throw new Error("ไม่พบ Supabase JS Library");
}

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;

console.log("ASIRASHOP: Supabase connected");
