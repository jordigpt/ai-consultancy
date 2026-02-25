// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Init Supabase Client (Admin context)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Business Data
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // "YYYY-MM"

    // Execute queries in parallel for speed
    const [
      { count: activeStudents }, 
      { count: hotLeads }, 
      { count: newLeads },
      { data: financialData },
      { count: pendingTasks }
    ] = await Promise.all([
      // Count Active Students
      supabaseClient.from('students').select('*', { count: 'exact', head: true }).or('status.eq.active,status.is.null'),
      
      // Count Hot Leads
      supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('interest_level', 'high'),
      
      // Count New Leads
      supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),

      // Get Revenue Data
      supabaseClient.from('monthly_revenues').select('agency_revenue, gumroad_revenue').eq('month_key', currentMonthKey).maybeSingle(),
      
      // Count Pending Admin Tasks
      supabaseClient.from('mentor_tasks').select('*', { count: 'exact', head: true }).eq('completed', false)
    ]);

    // Calculate Totals
    const agencyRev = Number(financialData?.agency_revenue || 0);
    const gumroadRev = Number(financialData?.gumroad_revenue || 0);
    // Note: Consulting revenue calculation is complex in SQL, sending approximated 0 if not calculated here or
    // we can assume the agent has historical data. For now, let's send what we have quickly.
    const knownMonthlyRevenue = agencyRev + gumroadRev;

    // 3. Construct Payload for Oracle Agent
    const payload = {
      "jobs": [
        {
          "source_id": "dyad_consulting_sync",
          "title": "Business KPIs Sync",
          "schedule": "manual", 
          "tz": "America/Argentina/Buenos_Aires",
          "enabled": true,
          "next_run_at": null,
          "last_run_at": now.toISOString(),
          "status": "ok"
        }
      ],
      "runs": [
        {
          "job_source_id": "dyad_consulting_sync",
          "status": "ok",
          "summary": `Sync triggered manually. Active Students: ${activeStudents}`,
          "ran_at": now.toISOString()
        }
      ],
      "metrics": [
        { "key": "kpi_active_students", "value_numeric": activeStudents || 0 },
        { "key": "kpi_hot_leads", "value_numeric": hotLeads || 0 },
        { "key": "kpi_new_leads", "value_numeric": newLeads || 0 },
        { "key": "kpi_pending_tasks", "value_numeric": pendingTasks || 0 },
        { "key": "kpi_ext_revenue_agency", "value_numeric": agencyRev },
        { "key": "kpi_ext_revenue_gumroad", "value_numeric": gumroadRev },
        { "key": "kpi_known_monthly_revenue", "value_numeric": knownMonthlyRevenue }
      ]
    };

    // 4. Send to Oracle Agent
    // IMPORTANT: User needs to set these secrets in Supabase Dashboard
    const AGENT_URL = Deno.env.get('ORACLE_AGENT_URL');
    const AGENT_SECRET = Deno.env.get('ORACLE_AGENT_SECRET');

    if (!AGENT_URL) {
      console.log("Mocking send (Secrets not set). Payload:", JSON.stringify(payload));
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Data processed but not sent (ORACLE_AGENT_URL missing). Check logs for payload.",
          payload_preview: payload 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGENT_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agent rejected data: ${response.status} - ${text}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Synced with Agent successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Sync Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})