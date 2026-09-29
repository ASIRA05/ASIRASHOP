// แก้ไข Const เป็น const ตัวพิมพ์เล็ก
const SUPABASE_URL =
  "https://izlwohwttnqyhqaceswu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Lbhr1nsVHHnLtHNS642UgQ_cTrnEtm-";

if (!window.supabase) {
  throw new Error("ไม่พบ Supabase SDK กรุณาตรวจสอบสคริปต์ Supabase ใน HTML");
}

const { createClient } = window.supabase;

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

window.supabaseClient = supabaseClient;

console.log("ASIRASHOP Supabase connected");
