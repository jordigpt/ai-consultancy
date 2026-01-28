// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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

    // Cliente Admin para leer toda la data sin restricciones RLS (pero filtrando por user_id manualmente)
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch Paralelo de Datos Enriquecidos
    const [
        { data: settings },
        { data: students },
        { data: leads },
        { data: mentorTasks },
        { data: globalNotes }
    ] = await Promise.all([
        // 1. Settings & Prompt
        supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).single(),
        
        // 2. Alumnos con Tareas, Llamadas y Notas
        supabaseAdmin
            .from('students')
            .select(`
                first_name, last_name, occupation, status, health_score, 
                paid_in_full, amount_owed, ai_level, context, business_model, amount_paid,
                tasks(title, completed, priority),
                calls(date, completed, notes),
                student_notes(content, created_at)
            `)
            .eq('user_id', user.id),

        // 3. Leads con Llamadas
        supabaseAdmin
            .from('leads')
            .select(`
                name, status, interest_level, notes, next_call_date, created_at, email,
                calls(date, completed, notes)
            `)
            .eq('user_id', user.id)
            .not('status', 'in', '("won","lost")'), // Solo leads activos

        // 4. Mis Tareas (Mentor)
        supabaseAdmin
            .from('mentor_tasks')
            .select('title, priority, completed, description')
            .eq('user_id', user.id)
            .eq('completed', false),

        // 5. Note Bank Global
        supabaseAdmin
            .from('notes')
            .select('title, content, category')
            .eq('user_id', user.id)
            .limit(10)
    ]);

    // Procesamiento de Datos para reducir tokens y limpiar formato
    const studentsSummary = students?.map((s: any) => {
        const pendingTasks = s.tasks?.filter((t: any) => !t.completed).length || 0;
        const lastNote = s.student_notes?.[0]?.content || "Sin notas recientes";
        const recentCalls = s.calls?.slice(0, 3).map((c: any) => `${c.date.split('T')[0]} (${c.completed ? 'Asistió' : 'Pendiente'})`).join(', ');
        
        return `- ${s.first_name} ${s.last_name} (${s.status}): 
          Salud: ${s.health_score} | Deuda: $${s.amount_owed} | Nivel IA: ${s.ai_level}
          Ctx: ${s.context || 'N/A'}
          Tareas Pendientes: ${pendingTasks}
          Últimas Llamadas: ${recentCalls || 'Ninguna'}
          Última Nota Bitácora: ${lastNote}`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => 
        `- ${l.name} (${l.status} - ${l.interest_level}):
          Nota: ${l.notes || 'N/A'}
          Próx. Llamada: ${l.next_call_date ? l.next_call_date.split('T')[0] : 'Sin agendar'}
          Historial: ${l.calls?.length || 0} llamadas registradas.`
    ).join('\n');

    // Finanzas
    const studentsRevenue = students?.reduce((acc: number, curr: any) => acc + (curr.amount_paid || 0), 0) || 0;
    const totalDebt = students?.reduce((acc: number, curr: any) => acc + (curr.amount_owed || 0), 0) || 0;
    const totalRevenue = studentsRevenue + (settings?.gumroad_revenue || 0);
    const monthlyGoal = settings?.monthly_goal || 10000;
    const goalProgress = ((totalRevenue / monthlyGoal) * 100).toFixed(1);

    // Construcción del Prompt
    const systemPrompt = settings?.system_prompt || "Eres un consultor experto en negocios digitales. Ayúdame a escalar.";
    
    const context = `
    [[ ESTADO DEL NEGOCIO EN TIEMPO REAL ]]
    
    💰 FINANZAS
    - Meta: $${monthlyGoal} | Actual: $${totalRevenue} (${goalProgress}%)
    - Deuda por cobrar: $${totalDebt}
    
    🎓 ALUMNOS (${students?.length || 0})
    ${studentsSummary}

    🎯 PIPELINE LEADS (${leads?.length || 0})
    ${leadsSummary}

    📝 MIS TAREAS PRIORITARIAS
    ${mentorTasks?.map((t: any) => `[${t.priority}] ${t.title}`).join(', ')}
    
    🧠 NOTE BANK (Ideas recientes)
    ${globalNotes?.map((n: any) => `[${n.category}] ${n.title}`).join(', ')}
    `;

    // Call OpenAI
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("OpenAI API Key not configured");

    const payload = {
        model: "gpt-4o", 
        messages: [
            { role: "system", content: `${systemPrompt}\n\n${context}` },
            ...messages
        ],
        temperature: 0.7,
    };

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify(payload)
    });

    const aiData = await response.json();
    
    if (aiData.error) throw new Error(aiData.error.message);

    return new Response(JSON.stringify({ reply: aiData.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});