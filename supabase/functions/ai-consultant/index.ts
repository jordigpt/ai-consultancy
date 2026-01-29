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
    const totalConsultingRevenue = activeStudentsRevenue + graduatedRevenue;
    const totalRevenueGlobal = totalConsultingRevenue + gumroadRevenue + agencyRevenue;
    
    // --- RESÚMENES DE TEXTO PARA LA IA ---
    
    const studentsSummary = students?.map((s: any) => {
        const isPaid = s.amount_owed <= 0;
        const paidStatus = isPaid ? "TOTALMENTE PAGADO" : "TIENE DEUDA";
        const startDate = s.start_date ? s.start_date.split('T')[0] : 'N/A';
        
        // Crear un string claro del mes de facturación para la IA
        let billingMonth = "DESCONOCIDO";
        if (s.start_date) {
            const dateObj = new Date(s.start_date);
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            billingMonth = `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        }
        
        return `• [${s.status?.toUpperCase() || 'ACTIVO'}] ${s.first_name} ${s.last_name}
           >>> FACTURACIÓN: $${s.amount_paid} (Corresponde a: ${billingMonth})
           - Fecha Inicio: ${startDate}
           - Deuda Pendiente: $${s.amount_owed} (${paidStatus})
           - Modelo: ${s.business_model} | Nivel IA: ${s.ai_level}/10
           - Contexto: ${s.context || 'Sin contexto'}`;
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
Tu objetivo es analizar la salud financiera y operativa del negocio.

CONTEXTO DE PERSONALIDAD DEFINIDO POR EL USUARIO:
"""
${customSystemPrompt || "Sé directo, prioriza cashflow y análisis de datos."}
"""

==================================================
📊 DATOS FINANCIEROS MACRO
==================================================
- Ingresos Totales Consultoría (Activos + Egresados): $${totalConsultingRevenue}
- Ingresos Agencia: $${agencyRevenue}
- Ingresos Productos: $${gumroadRevenue}
- META MENSUAL: $${monthlyGoal}
==================================================

LISTADO DETALLADO DE ALUMNOS (FUENTE DE VERDAD PARA ANÁLISIS MENSUAL):
${studentsSummary || "Sin alumnos registrados."}

PIPELINE DE VENTAS (LEADS):
${leadsSummary || "Sin leads activos."}

TAREAS OPERATIVAS:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Al día."}

!!! REGLA DE ORO PARA CÁLCULO DE INGRESOS MENSUALES !!!
Para calcular cuánto se facturó en un mes específico (ej. "Enero", "Febrero"), NO uses la fecha actual.
DEBES SUMAR el valor que aparece en la línea ">>> FACTURACIÓN: $X (Corresponde a: MES AÑO)" de cada alumno.

Ejemplo: Si el usuario pregunta "¿Cuánto facturamos en Enero?", tú debes:
1. Buscar en la lista de alumnos todos los que digan "(Corresponde a: Enero 202X)".
2. Sumar sus montos de facturación.
3. Responder con ese total.
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