// ============================================================
//  supabaseClient.js — Inisialisasi Supabase Client
// ============================================================

const SUPABASE_URL = 'https://zzzilipuferbtqthyqnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6emlsaXB1ZmVyYnRxdGh5cW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTk3MDksImV4cCI6MjEwMTQ3NTcwOX0.5FymafZ1P2gdkw3ce8SOFIQyLwoBYWCsoYCzPza-ntY';

// Tempelkan langsung ke objek window agar bisa diakses global oleh auth.js
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);