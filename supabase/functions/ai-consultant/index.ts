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
    // 1. Verificar Autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // 2. Obtener Request Body
    const { messages } = await req.json();

    // 3. Recopilar Contexto del Negocio (En Paralelo para velocidad)
    // Usamos service role para asegurar lectura completa, pero filtrando por user_id siempre
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [
        { data: settings },
        { data: students },
        { data: leads },
        { data: tasks },
        { data: notes }
    ] = await Promise.all([
        supabaseAdmin.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabaseAdmin.from('students').select('first_name, last_name, occupation, status, health_score, paid_in_full, amount_owed, ai_level, context, business_model, amount_paid').eq('user_id', user.id),
        supabaseAdmin.from('leads').select('name, status, interest_level, notes, next_call_date, created_at').eq('user_id', user.id).not('status', 'in', '("won","lost")'),
        supabaseAdmin.from('mentor_tasks').select('title, priority, completed, description').eq('user_id', user.id).eq('completed', false),
        supabaseAdmin.from('notes').select('title, content, category').eq('user_id', user.id).limit(10)
    ]);

    // 4. Construir el Prompt del Sistema
    const userPrompt = settings?.system_prompt || `Eres un consultor experto en negocios digitales. Ayúdame a escalar.`;
    
    // Cálculo de Finanzas
    const studentsRevenue = students?.reduce((acc: number, curr: any) => acc + (curr.amount_paid || 0), 0) || 0;
    const totalDebt = students?.reduce((acc: number, curr: any) => acc + (curr.amount_owed || 0), 0) || 0;
    const totalRevenue = studentsRevenue + (settings?.gumroad_revenue || 0);
    const monthlyGoal = settings?.monthly_goal || 10000;
    const goalProgress = ((totalRevenue / monthlyGoal) * 100).toFixed(1);

    // Contexto Estructurado
    const businessContext = `
    DATOS DEL NEGOCIO EN TIEMPO REAL:
    
    === FINANZAS ===
    - Objetivo Mensual: $${monthlyGoal}
    - Facturación Actual: $${totalRevenue} (${goalProgress}%)
    - Deuda por Cobrar (Alumnos): $${totalDebt}
    - Ingresos Extra (Gumroad): $${settings?.gumroad_revenue || 0}
    
    === ALUMNOS (${students?.length || 0}) ===
    ${students?.map((s: any) => 
        `- ${s.first_name} ${s.last_name}: ${s.status === 'graduated' ? '(Egresado)' : '(Activo)'} | Salud: ${s.health_score} | Deuda: $${s.amount_owed} | Nivel IA: ${s.ai_level}/10 | Modelo: ${s.business_model} | Ctx: ${s.context || 'N/A'}`
    ).join('\n')}

    === LEADS ACTIVOS (${leads?.length || 0}) ===
    (Solo leads abiertos)
    ${leads?.map((l: any) => 
        `- ${l.name}: Status ${l.status} | Interés ${l.interest_level} | Nota: ${l.notes || 'N/A'} | Creado: ${l.created_at.split('T')[0]}`
    ).join('\n')}

    === TAREAS PENDIENTES DEL MENTOR ===
    ${tasks?.map((t: any) => `- [${t.priority.toUpperCase()}] ${t.title}`).join('\n')}
    
    === NOTAS RECIENTES (Últimas 10) ===
    ${notes?.map((n: any) => `- [${n.category}] ${n.title}: ${n.content.substring(0, 50)}...`).join('\n')}
    `;

    // 5. Llamar a OpenAI
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
        throw new Error("Server configuration error: Missing OpenAI API Key");
    }

    const payload = {
        model: "gpt-4o", // O gpt-4-turbo / gpt-3.5-turbo según preferencia y presupuesto
        messages: [
            { role: "system", content: `${userPrompt}\n\n${businessContext}` },
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

    if (aiData.error) {
        console.error("OpenAI Error:", aiData.error);
        throw new Error(aiData.error.message);
    }

    const reply = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in AI function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});