/* ============================================================================
   ZhioLearns — Supabase connection settings (DRAFT)
   ----------------------------------------------------------------------------
   HOW TO FILL THIS IN (full walkthrough in SETUP.md):
     1. Create a free project at https://supabase.com
     2. Open Project Settings → API
     3. Copy "Project URL"        → paste below as SUPABASE_URL
     4. Copy the "anon public" key → paste below as SUPABASE_ANON_KEY

   SECURITY RULES — please read:
     • Frontend pages may ONLY use the "anon public" key. Row Level Security
       (see schema.sql) decides who can see or change what — not this file.
     • NEVER paste the "service_role" (secret) key into any file that is sent
       to browsers. It bypasses every security rule. It belongs only in
       trusted server code, which this project does not have.
   ========================================================================== */

const SUPABASE_URL = "https://aotpykfuetqhxyavoofv.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdHB5a2Z1ZXRxaHh5YXZvb2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMDgzMjksImV4cCI6MjEwNTg4NDMyOX0.7Snlb8rtj9llAKVGvVj9Lizhz6DoFr02neaVNAzpRss";
