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
            start_date, created_at,
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

    // CÁLCULO DE INGRESOS
    // 1. Activos
    const activeStudents = students 
        ? students.filter((s: any) => s.status === 'active' || !s.status)
        : [];
    const activeStudentsRevenue = activeStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0);
    const activeStudentsDebt = activeStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_owed) || 0), 0);

    // 2. Egresados
    const graduatedStudents = students
        ? students.filter((s: any) => s.status === 'graduated')
        : [];
    const graduatedRevenue = graduatedStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0);

    // Total Facturación ACUMULADA (Activos + Egresados + Extras)
    // Nota: Esto asume que amount_paid es el total histórico.
    const totalConsultingRevenue = activeStudentsRevenue + graduatedRevenue;
    const totalRevenueGlobal = totalConsultingRevenue + gumroadRevenue + agencyRevenue;
    
    // Progreso de meta mensual (Usamos el total acumulado como proxy de rendimiento si no hay desglose mensual)
    const goalProgress = monthlyGoal > 0 ? ((totalRevenueGlobal / monthlyGoal) * 100).toFixed(1) : 0;

    // --- RESÚMENES DE TEXTO PARA LA IA ---
    
    // Lista detallada de TODOS los alumnos (Activos y Egresados)
    const studentsSummary = students?.map((s: any) => {
        const isPaid = s.amount_owed <= 0;
        const paidStatus = isPaid ? "PAGADO" : "DEUDA";
        const startDate = s.start_date ? s.start_date.split('T')[0] : 'N/A';
        const createdDate = s.created_at ? s.created_at.split('T')[0] : 'N/A';
        
        return `• [${s.status?.toUpperCase() || 'ACTIVO'}] ${s.first_name} ${s.last_name}
           - Modelo: ${s.business_model} | Ocupación: ${s.occupation}
           - Fechas: Inicio ${startDate} | Cargado ${createdDate}
           - $ Pagado: $${s.amount_paid} | $ Deuda: $${s.amount_owed} (${paidStatus})
           - Contexto: ${s.context || 'Sin contexto'}
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
📊 REPORTE FINANCIERO GLOBAL (HISTÓRICO + ACTUAL)
==================================================

1. INGRESOS CONSULTORÍA (ALUMNOS ACTIVOS): $${activeStudentsRevenue}
   (Cartera actual de ${activeStudents.length} alumnos).

2. INGRESOS CONSULTORÍA (EGRESADOS): $${graduatedRevenue}
   (Histórico de ${graduatedStudents.length} alumnos finalizados).

3. INGRESOS AGENCIA: $${agencyRevenue}
4. INGRESOS PRODUCTOS/GUMROAD: $${gumroadRevenue}

>>> FACTURACIÓN TOTAL DEL NEGOCIO: $${totalRevenueGlobal} <<<
>>> OBJETIVO MENSUAL CONFIGURADO: $${monthlyGoal} <<<

⚠️ DEUDA PENDIENTE (ACTIVOS): $${activeStudentsDebt}
==================================================

DETALLE COMPLETO DE ALUMNOS (ACTIVOS Y EGRESADOS):
${studentsSummary || "Sin alumnos registrados."}

PIPELINE DE VENTAS (LEADS):
${leadsSummary || "Sin leads activos."}

TAREAS OPERATIVAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Al día."}

INSTRUCCIONES:
1. Analiza el rendimiento histórico (Egresados) vs actual (Activos).
2. Usa las fechas de carga/inicio para identificar antigüedad y posibles estancamientos.
3. Ten MUY en cuenta la "FACTURACIÓN TOTAL DEL NEGOCIO" para dar contexto de crecimiento.
4. Si hay deuda en alumnos activos, prioriza estrategias de cobro.
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