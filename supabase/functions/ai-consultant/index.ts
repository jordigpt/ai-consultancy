// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { messages } = await req.json();

    // --- RECOPILACIÓN DE DATOS (ADMIN) ---
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [
        { data: settings },
        { data: students },
        { data: leads },
        { data: mentorTasks }
    ] = await Promise.all([
        supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabaseAdmin.from('students').select(`
            first_name, last_name, occupation, status, health_score, 
            paid_in_full, amount_owed, ai_level, context, business_model, amount_paid,
            start_date,
            tasks(title, completed, priority)
        `).eq('user_id', user.id),
        supabaseAdmin.from('leads').select(`
            name, status, interest_level, notes, next_call_date, created_at, email, phone
        `).eq('user_id', user.id).not('status', 'in', '("won","lost")'),
        supabaseAdmin.from('mentor_tasks').select('title, priority, completed, description').eq('user_id', user.id).eq('completed', false)
    ]);

    // --- PROCESAMIENTO DE DATOS FINANCIEROS ---
    const now = new Date();

    // Variables Financieras
    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    const monthlyGoal = Number(settings?.monthly_goal || 10000);

    // CÁLCULO DE INGRESOS DE ALUMNOS (LÓGICA CORREGIDA)
    // Sumamos amount_paid de TODOS los alumnos marcados como activos (o null)
    const activeStudents = students 
        ? students.filter((s: any) => s.status === 'active' || !s.status)
        : [];

    const activeStudentsRevenue = activeStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0);
    
    // Deuda solo de alumnos activos
    const activeStudentsDebt = activeStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_owed) || 0), 0);

    // Total Facturación "Mensual" (Cartera Activa + Extras)
    const totalRevenueThisMonth = activeStudentsRevenue + gumroadRevenue + agencyRevenue;
    
    const goalProgress = monthlyGoal > 0 ? ((totalRevenueThisMonth / monthlyGoal) * 100).toFixed(1) : 0;

    // --- RESÚMENES DE TEXTO PARA LA IA ---
    
    // Lista detallada de alumnos con su aporte financiero explícito
    const studentsSummary = students?.map((s: any) => {
        const isPaid = s.amount_owed <= 0;
        const paidStatus = isPaid ? "PAGADO" : "DEUDA";
        return `• [${s.status?.toUpperCase() || 'ACTIVO'}] ${s.first_name} ${s.last_name} (${s.business_model})
           - Facturado: $${s.amount_paid} | Restante: $${s.amount_owed} (${paidStatus})
           - Salud: ${s.health_score?.toUpperCase()} | Nivel IA: ${s.ai_level}/10`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => {
        let nextCallInfo = 'SIN FECHA';
        if (l.next_call_date) {
            nextCallInfo = l.next_call_date.split('T')[0];
        }
        return `• ${l.name} [${l.interest_level.toUpperCase()}] - Estado: ${l.status} (Call: ${nextCallInfo})`;
    }).join('\n');

    const customSystemPrompt = settings?.system_prompt || "";

    // --- PROMPT EXPERTO CON DATOS FINANCIEROS INCRUSTADOS ---
    const expertSystemPrompt = `
FECHA ACTUAL: ${now.toISOString().split('T')[0]}

ERES UN SOCIO ESTRATÉGICO DE NEGOCIOS (COO/CFO).
Tu objetivo es maximizar la facturación y la eficiencia operativa.

CONTEXTO DE PERSONALIDAD DEL USUARIO:
"""
${customSystemPrompt || "Sé directo, prioriza cashflow, retención de clientes y cierre de ventas."}
"""

==================================================
📊 REPORTE FINANCIERO EN TIEMPO REAL
==================================================

1. INGRESOS CONSULTORÍA (ALUMNOS ACTIVOS): $${activeStudentsRevenue}
   (Calculado sumando lo cobrado a ${activeStudents.length} alumnos activos).

2. INGRESOS AGENCIA: $${agencyRevenue}

3. INGRESOS PRODUCTOS/GUMROAD: $${gumroadRevenue}

>>> FACTURACIÓN TOTAL ACUMULADA: $${totalRevenueThisMonth} <<<
>>> META MENSUAL: $${monthlyGoal} (Progreso: ${goalProgress}%) <<<

⚠️ DEUDA PENDIENTE POR COBRAR (Cartera Activa): $${activeStudentsDebt}
==================================================

DETALLE DE CARTERA DE ALUMNOS:
${studentsSummary || "Sin alumnos registrados."}

PIPELINE DE VENTAS (LEADS):
${leadsSummary || "Sin leads activos."}

TAREAS OPERATIVAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Al día."}

INSTRUCCIONES PARA TU RESPUESTA:
1. Ten MUY en cuenta la "FACTURACIÓN TOTAL ACUMULADA" ($${totalRevenueThisMonth}) al dar consejos.
2. Si hay "Deuda Pendiente", sugiere acciones de cobro.
3. Si el progreso de la meta es bajo, enfócate en cerrar los Leads listados.
4. Analiza la salud de los alumnos. Si alguno está en rojo, es prioridad salvarlo (Churn risk).
`;

    // --- OPENAI CALL ---
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("Falta configurar OPENAI_API_KEY");

    const recentMessages = messages.slice(-10); 

    const payload = {
        model: "gpt-4o",
        messages: [
            { role: "system", content: expertSystemPrompt },
            ...recentMessages
        ],
        temperature: 0.7,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
        console.error("OpenAI Error:", data.error);
        throw new Error(data.error.message);
    }

    const reply = data.choices?.[0]?.message?.content || "Sin respuesta.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});