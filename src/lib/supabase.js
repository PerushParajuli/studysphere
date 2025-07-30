import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hnxdxskbdmiomjlyryxh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueGR4c2tiZG1pb21qbHlyeXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDc1ODIsImV4cCI6MjA2OTE4MzU4Mn0.739GE4m22FPMi4vurdl_E3b6gm_MgTHm-ANpFv1Jl14"

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
