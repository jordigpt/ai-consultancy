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
    // Antes filtraba por mes de inicio. Ahora suma el amount_paid de TODOS los alumnos activos.
    // Esto representa el valor de la cartera activa mensual.
    const activeStudentsRevenue = students
        ? students
            .filter((s: any) => s.status === 'active' || !s.status) // Consideramos active o null como activos
            .reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0)
        : 0;

    let totalDebt = 0;
    
    // Calculamos deuda total aparte
    if (students) {
        students.forEach((s: any) => {
            totalDebt += Number(s.amount_owed) || 0;
        });
    }

    // Total Facturación "Mensual" (Cartera Activa + Extras)
    // Se compone de: Valor de alumnos activos + Ingresos manuales (Gumroad/Agencia)
    const totalRevenueThisMonth = activeStudentsRevenue + gumroadRevenue + agencyRevenue;
    
    const goalProgress = ((totalRevenueThisMonth / monthlyGoal) * 100).toFixed(1);

    // --- RESÚMENES DE TEXTO ---
    const studentsSummary = students?.map((s: any) => {
        return `- ${s.first_name} ${s.last_name} [${s.business_model}]: Estado ${s.status || 'active'} | Salud ${s.health_score?.toUpperCase()} | Pagado: $${s.amount_paid} | Debe: $${s.amount_owed}`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => {
        let nextCallInfo = 'SIN FECHA';
        if (l.next_call_date) {
            nextCallInfo = l.next_call_date.split('T')[0];
        }
        return `- ${l.name} (${l.interest_level.toUpperCase()}): Estado ${l.status} | Call: ${nextCallInfo}`;
    }).join('\n');

    const customSystemPrompt = settings?.system_prompt || "";

    // --- PROMPT EXPERTO ---
    const expertSystemPrompt = `
FECHA ACTUAL: ${now.toISOString().split('T')[0]}

ERES UN CONSULTOR DE NEGOCIOS SENIOR.
Utiliza el siguiente "System Prompt" del usuario como guía de personalidad:
"""
${customSystemPrompt || "Sé directo, prioriza cashflow y desbloqueo operativo."}
"""

----------------------------------
ESTADO FINANCIERO MENSUAL (ACTUALIZADO):
----------------------------------
La facturación mensual se calcula sumando la cartera de alumnos activos + ingresos extra.

1. Ingresos Agencia (Manual): $${agencyRevenue}
2. Ingresos Gumroad/Info (Manual): $${gumroadRevenue}
3. Cartera de Alumnos Activos: $${activeStudentsRevenue}

>>> TOTAL FACTURACIÓN MENSUAL: $${totalRevenueThisMonth} <<<
META MENSUAL: $${monthlyGoal}
PROGRESO: ${goalProgress}%

(Deuda total pendiente de cobro: $${totalDebt}).
----------------------------------

ALUMNOS (${students?.length || 0}):
${studentsSummary || "Sin alumnos."}

LEADS ACTIVOS:
${leadsSummary || "Sin leads."}

TAREAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Sin tareas."}

INSTRUCCIONES:
1. Si te preguntan cuánto hemos facturado, responde con el TOTAL FACTURACIÓN MENSUAL ($${totalRevenueThisMonth}).
2. Analiza los alumnos activos y sus deudas.
3. Si el progreso es bajo, sugiere acciones para cerrar los leads listados arriba.
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