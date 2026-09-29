const SUPABASE_URL =
  "https://izlwohwttnqyhqaceswu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bHdvaHd0dG5xeWhhcWNlc3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjQxNDAsImV4cCI6MjEwNjI0MDE0MH0.Oy01VB9J9YDoex7b6zpwGvFQ5Rd0jIZj5pakBPL3UP8";

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
    },
    global: {
      headers: {
        'x-client-info': 'asirashop-admin'
      }
    }
  }
);

window.supabaseClient = supabaseClient;

console.log("ASIRASHOP Supabase connected");
