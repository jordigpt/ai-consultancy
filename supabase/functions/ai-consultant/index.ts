// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de CORS preflight
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

    // --- RECOPILACIÓN DE DATOS ---
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
            name, status, interest_level, notes, next_call_date, created_at, email,
            calls(date, completed, notes)
        `).eq('user_id', user.id).not('status', 'in', '("won","lost")'),
        supabaseAdmin.from('mentor_tasks').select('title, priority, completed, description').eq('user_id', user.id).eq('completed', false),
        supabaseAdmin.from('notes').select('title, content, category').eq('user_id', user.id).limit(10)
    ]);

    // Procesamiento de texto para el contexto
    const studentsSummary = students?.map((s: any) => {
        const pendingTasks = s.tasks?.filter((t: any) => !t.completed).length || 0;
        const lastNote = s.student_notes?.[0]?.content || "Sin notas recientes";
        const recentCalls = s.calls?.slice(0, 3).map((c: any) => `${c.date.split('T')[0]} (${c.completed ? 'Asistió' : 'Pendiente'})`).join(', ');
        return `- ${s.first_name} ${s.last_name} (${s.status}): Salud ${s.health_score} | Deuda $${s.amount_owed} | Nivel IA ${s.ai_level}/10 | Tareas Pendientes: ${pendingTasks} | Últimas Llamadas: ${recentCalls}`;
    }).join('\n');

    const leadsSummary = leads?.map((l: any) => 
        `- ${l.name} (${l.status}/${l.interest_level}): Nota: "${l.notes || ''}" | Próx Llamada: ${l.next_call_date ? l.next_call_date.split('T')[0] : 'No'}`
    ).join('\n');

    const studentsRevenue = students?.reduce((acc: number, curr: any) => acc + (curr.amount_paid || 0), 0) || 0;
    const totalDebt = students?.reduce((acc: number, curr: any) => acc + (curr.amount_owed || 0), 0) || 0;
    const totalRevenue = studentsRevenue + (settings?.gumroad_revenue || 0);
    const monthlyGoal = settings?.monthly_goal || 10000;
    const goalProgress = ((totalRevenue / monthlyGoal) * 100).toFixed(1);

    const userPrompt = settings?.system_prompt || "Eres un consultor experto en negocios digitales. Ayúdame a escalar.";
    
    const context = `
    [[ DATOS EN TIEMPO REAL DEL NEGOCIO ]]
    FINANZAS: Meta $${monthlyGoal} | Actual $${totalRevenue} (${goalProgress}%) | Por cobrar: $${totalDebt}
    ALUMNOS: \n${studentsSummary}
    LEADS: \n${leadsSummary}
    MIS TAREAS: \n${mentorTasks?.map((t: any) => `[${t.priority}] ${t.title}`).join(', ')}
    NOTAS: \n${globalNotes?.map((n: any) => `[${n.category}] ${n.title}`).join(', ')}
    `;

    // --- INTEGRACIÓN CON GEMINI ---
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Falta configurar GEMINI_API_KEY en Supabase Secrets");

    // Usamos Gemini 2.0 Flash (Experimental) que es muy rápido y potente
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;

    // Transformar mensajes al formato de Gemini
    const geminiContents = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const payload = {
        systemInstruction: {
            parts: [{ text: `${userPrompt}\n\n${context}` }]
        },
        contents: geminiContents
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
        console.error("Gemini Error:", data.error);
        throw new Error(data.error.message || "Error desconocido de Gemini");
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

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