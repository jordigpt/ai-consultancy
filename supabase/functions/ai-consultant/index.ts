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
    const currentDateString = now.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Finanzas - Lógica corregida
    let studentsRevenueMonth = 0;
    let studentsRevenueTotal = 0;
    let totalDebt = 0;

    if (students) {
        students.forEach((s: any) => {
            const paid = Number(s.amount_paid) || 0;
            const owed = Number(s.amount_owed) || 0;
            
            // Ingreso Total Histórico
            studentsRevenueTotal += paid;

            // Deuda Total
            totalDebt += owed;

            // Ingreso Mensual (Aproximación basada en start_date para este mes)
            // NOTA: Idealmente tendríamos una tabla de 'pagos', pero usaremos start_date como proxy de 'nuevo ingreso' este mes
            const startDate = new Date(s.start_date);
            if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
                studentsRevenueMonth += paid;
            }
        });
    }

    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    
    // Ingreso Total Mes (Students This Month + Manual Revenues)
    // Asumimos que los ingresos manuales son mensuales.
    const totalRevenueMonth = studentsRevenueMonth + gumroadRevenue + agencyRevenue;
    
    const monthlyGoal = Number(settings?.monthly_goal || 10000);
    const goalProgress = ((totalRevenueMonth / monthlyGoal) * 100).toFixed(1);

    // 2. Resúmenes de texto
    const studentsSummary = students?.map((s: any) => {
        return `- ${s.first_name} ${s.last_name} [${s.business_model}]: Salud ${s.health_score?.toUpperCase()} | Pagado Total: $${s.amount_paid} | Debe: $${s.amount_owed} | Nivel IA: ${s.ai_level}/10.`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => {
        let nextCallInfo = 'SIN FECHA';
        let isOverdue = false;
        
        if (l.next_call_date) {
            const callDate = new Date(l.next_call_date);
            nextCallInfo = callDate.toLocaleDateString("es-ES");
            // Check if overdue (call date was before today)
            if (callDate < now) {
                isOverdue = true;
                nextCallInfo += " (VENCIDA)";
            }
        }
        
        return `- ${l.name} (${l.interest_level.toUpperCase()} interest): Estado ${l.status} | Próx. llamada: ${nextCallInfo} ${isOverdue ? '⚠️' : ''} | Nota: "${l.notes || 'N/A'}"`;
    }).join('\n');

    const customSystemPrompt = settings?.system_prompt || "";

    // --- PROMPT EXPERTO ---
    const expertSystemPrompt = `
HOY ES: ${currentDateString}

ERES UN CONSULTOR DE NEGOCIOS SENIOR.
Utiliza el siguiente "System Prompt" definido por el usuario como tu guía principal de personalidad y enfoque:
"""
${customSystemPrompt || "Actúa como un estratega de negocios experto. Sé directo, prioriza cashflow y desbloqueo operativo."}
"""

DATOS DEL NEGOCIO (TIEMPO REAL):
----------------------------------
💰 FINANZAS MENSUALES (Mes Actual):
- Meta: $${monthlyGoal}
- Recaudado ESTE MES (Alumnos Nuevos + Otros): $${totalRevenueMonth}
  (Desglose: Alumnos Nuevos Mes: $${studentsRevenueMonth} | Agencia: $${agencyRevenue} | Productos: $${gumroadRevenue})
- Progreso: ${goalProgress}%

💰 FINANZAS GLOBALES:
- Total Histórico Alumnos (Cash Collected): $${studentsRevenueTotal}
- Deuda Total por Cobrar (Cashflow Latente): $${totalDebt}

👥 ALUMNOS (${students?.length || 0}):
${studentsSummary || "No hay alumnos registrados."}

🎯 PIPELINE / LEADS (${leads?.length || 0}):
${leadsSummary || "No hay leads activos."}

📝 TAREAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Sin tareas pendientes."}
----------------------------------

REGLAS CRÍTICAS:
1. Usa la fecha "HOY ES" para juzgar si una llamada está vencida o es futura. Si una llamada es en 2026, indícalo como un error grave de agenda.
2. Distingue entre Ingreso del Mes vs Ingreso Total Histórico.
3. Si la deuda es alta, sugiera cobranzas.
4. Responde con formato Markdown limpio.
`;

    // --- OPENAI CALL ---
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("Falta configurar OPENAI_API_KEY");

    // Recortar historial para no exceder tokens, manteniendo el system prompt
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