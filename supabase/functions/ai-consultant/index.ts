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
        { data: mentorTasks },
        { data: globalNotes }
    ] = await Promise.all([
        supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabaseAdmin.from('students').select(`
            first_name, last_name, occupation, status, health_score, 
            paid_in_full, amount_owed, ai_level, context, business_model, amount_paid,
            tasks(title, completed, priority),
            calls(date, completed, notes),
            student_notes(content, created_at)
        `).eq('user_id', user.id),
        supabaseAdmin.from('leads').select(`
            name, status, interest_level, notes, next_call_date, created_at, email, phone,
            calls(date, completed, notes)
        `).eq('user_id', user.id).not('status', 'in', '("won","lost")'),
        supabaseAdmin.from('mentor_tasks').select('title, priority, completed, description').eq('user_id', user.id).eq('completed', false),
        supabaseAdmin.from('notes').select('title, content, category').eq('user_id', user.id).limit(10)
    ]);

    // --- PROCESAMIENTO DE DATOS ---
    
    // 1. Finanzas (FIX: Asegurar que son números)
    // Filtramos solo alumnos activos o egresados para la suma, o todos según prefieras. 
    // Generalmente es el total recaudado.
    const studentsRevenue = students?.reduce((acc: number, curr: any) => {
        const val = Number(curr.amount_paid);
        return acc + (isNaN(val) ? 0 : val);
    }, 0) || 0;

    const totalDebt = students?.reduce((acc: number, curr: any) => {
        const val = Number(curr.amount_owed);
        return acc + (isNaN(val) ? 0 : val);
    }, 0) || 0;

    const gumroadRevenue = Number(settings?.gumroad_revenue || 0);
    const agencyRevenue = Number(settings?.agency_revenue || 0);
    const totalRevenue = studentsRevenue + gumroadRevenue + agencyRevenue;
    const monthlyGoal = Number(settings?.monthly_goal || 10000);
    const goalProgress = ((totalRevenue / monthlyGoal) * 100).toFixed(1);

    // 2. Resúmenes de texto
    const studentsSummary = students?.map((s: any) => {
        const pendingTasks = s.tasks?.filter((t: any) => !t.completed).length || 0;
        return `- ${s.first_name} ${s.last_name} [${s.business_model}]: Salud ${s.health_score.toUpperCase()} | Pagado: $${s.amount_paid} | Debe: $${s.amount_owed} | Nivel IA: ${s.ai_level}/10.`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => {
        const nextCall = l.next_call_date ? l.next_call_date.split('T')[0] : 'SIN FECHA';
        return `- ${l.name} (${l.interest_level.toUpperCase()} interest): Estado ${l.status} | Próx. llamada: ${nextCall} | Nota: "${l.notes || 'N/A'}"`;
    }).join('\n');

    // --- PROMPT EXPERTO ---
    const expertSystemPrompt = `
Eres un Consultor de Negocios Senior especializado en escalar agencias, consultorías y productos digitales de alto ticket.
Tu tono es: Directo, Estratégico, Analítico y Orientado a la Acción. "No BS" (Sin rodeos).

OBJETIVOS:
1. Maximizar el Cashflow inmediato.
2. Desbloquear cuellos de botella operativos.
3. Aumentar la retención y el LTV (Lifetime Value) de los alumnos.

INSTRUCCIONES DE RESPUESTA:
- Usa Markdown para estructurar tu respuesta (Negritas para métricas clave, Listas para acciones).
- NO saludes genéricamente. Ve al grano.
- Si ves deudas cobrables ($${totalDebt}), priorízalas como alerta roja.
- Si ves leads con interés ALTO (high) sin fecha de llamada próxima o fechas lejanas, márcado como "Pérdida de Dinero".
- Analiza la brecha financiera: Estamos al ${goalProgress}% de la meta ($${monthlyGoal}). Si es bajo, sugiere tácticas agresivas.

DATOS DEL NEGOCIO (TIEMPO REAL):
----------------------------------
💰 FINANZAS:
- Total Recaudado: $${totalRevenue} (Consultoría: $${studentsRevenue} | Agencia: $${agencyRevenue} | Productos: $${gumroadRevenue})
- Deuda por Cobrar (Cashflow Latente): $${totalDebt}
- Meta Mensual: $${monthlyGoal}

👥 ALUMNOS (${students?.length || 0}):
${studentsSummary || "No hay alumnos registrados."}

🎯 PIPELINE / LEADS (${leads?.length || 0}):
${leadsSummary || "No hay leads activos."}

📝 TAREAS PENDIENTES:
${mentorTasks?.map((t: any) => `[${t.priority.toUpperCase()}] ${t.title}`).join(', ') || "Sin tareas pendientes."}
----------------------------------

Basado en estos datos, responde a la última entrada del usuario priorizando la rentabilidad.
`;

    // --- OPENAI CALL ---
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("Falta configurar OPENAI_API_KEY");

    const payload = {
        model: "gpt-4o",
        messages: [
            { role: "system", content: expertSystemPrompt },
            ...messages
        ],
        temperature: 0.6, // Un poco más bajo para ser más analítico y preciso
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