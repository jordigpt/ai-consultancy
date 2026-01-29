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

    // --- PROCESAMIENTO DE DATOS ---
    const now = new Date();
    // Forzamos formato ISO simple para evitar confusiones de zona horaria en la IA
    const currentDateString = now.toISOString().split('T')[0]; 
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Finanzas
    let studentsRevenueMonth = 0;
    let studentsRevenueTotal = 0;
    let totalDebt = 0;
    let paidStudentsCount = 0;

    if (students) {
        students.forEach((s: any) => {
            const paid = Number(s.amount_paid) || 0;
            const owed = Number(s.amount_owed) || 0;
            
            // Ingreso Total Histórico (Cash Collected Real de Alumnos)
            studentsRevenueTotal += paid;

            // Deuda Total
            totalDebt += owed;

            if (s.paid_in_full || owed <= 0) {
                paidStudentsCount++;
            }

            // Ingreso "Nuevos Alumnos" este mes (Start Date match)
            const startDate = new Date(s.start_date);
            if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                studentsRevenueMonth += paid;
            }
        });
    }

    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    const monthlyGoal = Number(settings?.monthly_goal || 10000);
    
    // Total Global Recaudado (La suma de TODO el dinero entrante registrado)
    // Esto es lo que el usuario probablemente busca como "Total Recaudado" si no usa cortes mensuales estrictos
    const totalRevenueGlobal = studentsRevenueTotal + gumroadRevenue + agencyRevenue;

    // Ingreso "Mes Actual" (Estimado: Nuevos alumnos + ingresos recurrentes manuales)
    const totalRevenueNewBusiness = studentsRevenueMonth + gumroadRevenue + agencyRevenue;
    
    const goalProgress = ((totalRevenueNewBusiness / monthlyGoal) * 100).toFixed(1);

    // 2. Resúmenes de texto
    const studentsSummary = students?.map((s: any) => {
        return `- ${s.first_name} ${s.last_name} [${s.business_model}]: Salud ${s.health_score?.toUpperCase()} | Pagado: $${s.amount_paid} | Debe: $${s.amount_owed} | Inicio: ${s.start_date}`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => {
        let nextCallInfo = 'SIN FECHA';
        let isOverdue = false;
        
        if (l.next_call_date) {
            const callDate = new Date(l.next_call_date);
            // Formato YYYY-MM-DD para claridad total
            nextCallInfo = callDate.toISOString().split('T')[0];
            
            // Check estricto de fecha vencida
            if (callDate < now) {
                isOverdue = true;
                nextCallInfo += " (VENCIDA/PASADA)";
            } else {
                nextCallInfo += " (FUTURA)";
            }
        }
        
        return `- ${l.name} (${l.interest_level.toUpperCase()} interest): Estado ${l.status} | Call: ${nextCallInfo} | Nota: "${l.notes || ''}"`;
    }).join('\n');

    const customSystemPrompt = settings?.system_prompt || "";

    // --- PROMPT EXPERTO ---
    const expertSystemPrompt = `
FECHA ACTUAL: ${currentDateString} (YYYY-MM-DD).
Usa esta fecha EXACTA para determinar si una llamada o evento es pasado o futuro. Si una fecha es anterior a ${currentDateString}, YA PASÓ. Si es posterior, AÚN NO OCURRE.

ERES UN CONSULTOR DE NEGOCIOS SENIOR.
Utiliza el siguiente "System Prompt" definido por el usuario como tu guía principal de personalidad y enfoque:
"""
${customSystemPrompt || "Actúa como un estratega de negocios experto. Sé directo, prioriza cashflow y desbloqueo operativo."}
"""

DATOS FINANCIEROS (IMPORTANTÍSIMO):
----------------------------------
1. TOTAL RECAUDADO (GLOBAL/ACUMULADO): $${totalRevenueGlobal}
   (Suma de TODOS los pagos de alumnos históricos + Ingresos Agencia + Gumroad).
   *Si el usuario pregunta "cuánto recaudé", usa ESTE número o aclara la diferencia.*

2. NUEVOS NEGOCIOS (MES ACTUAL): $${totalRevenueNewBusiness}
   (Solo alumnos iniciados este mes + Ingresos mensuales recurrentes).
   - Meta Mensual: $${monthlyGoal}
   - Progreso Meta: ${goalProgress}%

3. DEUDA PENDIENTE (Cashflow Latente): $${totalDebt}
   (Dinero que los alumnos deben pagar).
----------------------------------

ALUMNOS (${students?.length || 0}):
${studentsSummary || "Sin alumnos."}

PIPELINE / LEADS (${leads?.length || 0}):
${leadsSummary || "Sin leads."}

TAREAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Sin tareas."}

REGLAS CRÍTICAS:
1. FECHAS: Compara SIEMPRE las fechas de los leads con ${currentDateString}. Si dice 2026, advierte que está mal agendado. Si dice una fecha pasada, alerta de seguimiento perdido.
2. DINERO: Si el "Total Recaudado Global" ($${totalRevenueGlobal}) es distinto a "Nuevos Negocios" ($${totalRevenueNewBusiness}), explica que uno es el acumulado total y el otro es la producción de este mes.
3. ALUMNOS PAGOS: Tienes ${paidStudentsCount} alumnos que han pagado o no tienen deuda. Valora eso.
`;

    // --- OPENAI CALL ---
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("Falta configurar OPENAI_API_KEY");

    // Recortar historial
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