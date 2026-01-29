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

    // Corregido: Desestructuración correcta de las 5 promesas
    const [
        { data: settings },
        { data: students },
        { data: leads },         // Leads activos
        { data: wonLeadsData },  // Leads ganados (Historial)
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
            name, status, interest_level, notes, next_call_date, created_at, email, phone, value
        `).eq('user_id', user.id).not('status', 'in', '("won","lost")'), 
        supabaseAdmin.from('leads').select(`
             name, status, value, created_at
        `).eq('user_id', user.id).eq('status', 'won'), 
        supabaseAdmin.from('mentor_tasks').select('title, priority, completed, description').eq('user_id', user.id).eq('completed', false)
    ]);

    const wonLeads = wonLeadsData || [];

    // --- PROCESAMIENTO DE DATOS FINANCIEROS ---
    const now = new Date();

    // Variables Financieras
    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    const monthlyGoal = Number(settings?.monthly_goal || 10000);

    // CÁLCULO DE INGRESOS (Solo referencial global, la IA hará el mensual)
    const activeStudents = students 
        ? students.filter((s: any) => s.status === 'active' || !s.status)
        : [];
    const activeStudentsRevenue = activeStudents.reduce((sum: number, s: any) => sum + (Number(s.amount_paid) || 0), 0);
    
    // Total Facturación ACUMULADA 
    const totalConsultingRevenue = activeStudentsRevenue; // Simplificado
    const totalRevenueGlobal = totalConsultingRevenue + gumroadRevenue + agencyRevenue;
    
    // --- RESÚMENES DE TEXTO PARA LA IA ---
    
    // Resumen de Alumnos (Enfoque operativo)
    const studentsSummary = students?.map((s: any) => {
        const isPaid = s.amount_owed <= 0;
        const paidStatus = isPaid ? "TOTALMENTE PAGADO" : "TIENE DEUDA";
        return `• [${s.status?.toUpperCase() || 'ACTIVO'}] ${s.first_name} ${s.last_name}
           - Modelo: ${s.business_model} | Nivel IA: ${s.ai_level}/10
           - Deuda: $${s.amount_owed} (${paidStatus})`;
    }).join('\n');

    // Pipeline Activo (Leads no cerrados)
    const activeLeadsSummary = leads?.map((l: any) => {
        let nextCallInfo = 'SIN FECHA';
        if (l.next_call_date) {
            nextCallInfo = l.next_call_date.split('T')[0];
        }
        return `• ${l.name} [${l.interest_level.toUpperCase()}] - Valor Est: $${l.value || 0} - Estado: ${l.status} (Call: ${nextCallInfo})`;
    }).join('\n');

    // HISTORIAL DE VENTAS (Fuente de Verdad Financiera)
    const salesHistorySummary = wonLeads?.map((l: any) => {
        const dateObj = new Date(l.created_at);
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const saleMonth = `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        return `• VENTA CERRADA: ${l.name}
           >>> MONTO: $${l.value || 0}
           >>> FECHA DE CIERRE: ${l.created_at.split('T')[0]} (Mes: ${saleMonth})`;
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
📊 DATOS FINANCIEROS GLOBALES
==================================================
- Ingresos Totales Globales Estimados: $${totalRevenueGlobal}
- META MENSUAL: $${monthlyGoal}
==================================================

💰 HISTORIAL DE VENTAS Y CIERRES (FUENTE DE VERDAD PARA INGRESOS):
Usa esta lista para calcular cuánto se facturó en cada mes.
${salesHistorySummary || "No hay ventas registradas aún."}

📋 PIPELINE DE VENTAS (LEADS ACTIVOS):
${activeLeadsSummary || "Sin leads activos."}

👥 ALUMNOS ACTIVOS (ESTADO OPERATIVO):
${studentsSummary || "Sin alumnos registrados."}

TAREAS OPERATIVAS:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Al día."}

!!! REGLA DE ORO PARA CÁLCULO DE INGRESOS !!!
Para responder preguntas como "¿Cuánto facturamos en Enero?", DEBES SUMAR EXCLUSIVAMENTE los montos de la sección "HISTORIAL DE VENTAS Y CIERRES" que correspondan a ese mes. No uses la fecha actual.
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