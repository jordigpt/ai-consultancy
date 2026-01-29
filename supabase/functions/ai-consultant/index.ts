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
    const currentMonth = now.getMonth(); 
    const currentYear = now.getFullYear();

    // Variables Financieras
    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    const monthlyGoal = Number(settings?.monthly_goal || 10000);

    let studentsRevenueMonth = 0;
    let studentsRevenueTotal = 0;
    let totalDebt = 0;
    let paidStudentsCount = 0;

    if (students) {
        students.forEach((s: any) => {
            const paid = Number(s.amount_paid) || 0;
            const owed = Number(s.amount_owed) || 0;
            
            // 1. Total Histórico
            studentsRevenueTotal += paid;

            // 2. Deuda Total
            totalDebt += owed;

            if (s.paid_in_full || owed <= 0) {
                paidStudentsCount++;
            }

            // 3. Ingreso "Mes Actual" (Match Start Date)
            // Normalizamos la fecha para evitar errores de zona horaria
            if (s.start_date) {
                const startDate = new Date(s.start_date);
                // Comparamos mes y año
                if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                    studentsRevenueMonth += paid;
                }
            }
        });
    }

    // Cálculos Finales para la IA
    // Total Global Recaudado (Cash Collected Real de TODA la historia)
    const totalCashCollectedGlobal = studentsRevenueTotal + gumroadRevenue + agencyRevenue;

    // Total Facturación "Este Mes" (Lo que se muestra en el Widget de Objetivo)
    // Se compone de: Pagos de alumnos iniciados este mes + Ingresos manuales (Gumroad/Agencia)
    const totalRevenueThisMonth = studentsRevenueMonth + gumroadRevenue + agencyRevenue;
    
    const goalProgress = ((totalRevenueThisMonth / monthlyGoal) * 100).toFixed(1);

    // --- RESÚMENES DE TEXTO ---
    const studentsSummary = students?.map((s: any) => {
        return `- ${s.first_name} ${s.last_name} [${s.business_model}]: Salud ${s.health_score?.toUpperCase()} | Pagado: $${s.amount_paid} | Debe: $${s.amount_owed}`;
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
ESTADO FINANCIERO ACTUAL (CRÍTICO):
----------------------------------
La facturación de este mes se compone de tres fuentes:
1. Ingresos Agencia (Manual): $${agencyRevenue}
2. Ingresos Gumroad/Info (Manual): $${gumroadRevenue}
3. Alumnos Nuevos (Este mes): $${studentsRevenueMonth}

>>> TOTAL FACTURACIÓN ESTE MES: $${totalRevenueThisMonth} <<<
META MENSUAL: $${monthlyGoal}
PROGRESO: ${goalProgress}%

(Nota: El total histórico recaudado desde el inicio de los tiempos es $${totalCashCollectedGlobal}. La deuda pendiente por cobrar es $${totalDebt}).
----------------------------------

ALUMNOS (${students?.length || 0}):
${studentsSummary || "Sin alumnos."}

LEADS ACTIVOS:
${leadsSummary || "Sin leads."}

TAREAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Sin tareas."}

INSTRUCCIONES:
1. Si te preguntan cuánto hemos facturado, responde con el TOTAL FACTURACIÓN ESTE MES ($${totalRevenueThisMonth}).
2. Desglosa la facturación si es necesario (Agencia vs Alumnos).
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