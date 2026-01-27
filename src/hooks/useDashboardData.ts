import { useState, useEffect, useCallback } from "react";
import { Student, Lead, MentorTask, Note } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

export const useDashboardData = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mentorTasks, setMentorTasks] = useState<MentorTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [monthlyGoal, setMonthlyGoal] = useState(10000);
  const [gumroadRevenue, setGumroadRevenue] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      // 0. Fetch Settings
      if (user) {
        const { data: settings } = await supabase.from('user_settings').select('monthly_goal, gumroad_revenue').eq('user_id', user.id).single();
        if (settings) {
            setMonthlyGoal(settings.monthly_goal || 10000);
            setGumroadRevenue(settings.gumroad_revenue || 0);
        }
      }

      // 1. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`*, tasks (*), calls (*)`)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // 2. Fetch Leads (Now including calls)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`*, calls (*)`)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // 3. Fetch Mentor Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('mentor_tasks')
        .select(`
            *,
            students (id, first_name, last_name),
            leads (id, name)
        `)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // 4. Fetch Notes (New for Global Search)
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (notesError) throw notesError;

      // Transform Students
      const transformedStudents: Student[] = studentsData.map((s: any) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email, 
        occupation: s.occupation,
        context: s.context || "",
        aiLevel: s.ai_level,
        businessModel: s.business_model,
        startDate: new Date(s.start_date),
        status: s.status || 'active', 
        healthScore: s.health_score || 'green', // Default to green
        paidInFull: s.paid_in_full,
        amountPaid: s.amount_paid,
        amountOwed: s.amount_owed,
        roadmapUrl: s.roadmap_url,
        tasks: s.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          createdAt: new Date(t.created_at) // Added createdAt for timeline
        })).sort((a: any, b: any) => b.id.localeCompare(a.id)),
        calls: s.calls.map((c: any) => ({
          id: c.id,
          date: new Date(c.date),
          completed: c.completed,
          notes: c.notes,
          studentId: s.id
        })).sort((a: any, b: any) => b.date - a.date)
      }));

      // Transform Leads
      const transformedLeads: Lead[] = leadsData.map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email || "",
        phone: l.phone || "",
        status: l.status,
        interestLevel: l.interest_level,
        notes: l.notes || "",
        nextCallDate: l.next_call_date ? new Date(l.next_call_date) : undefined,
        createdAt: new Date(l.created_at),
        calls: (l.calls || []).map((c: any) => ({
            id: c.id,
            date: new Date(c.date),
            completed: c.completed,
            notes: c.notes,
            leadId: l.id
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));

      // Transform Tasks
      const transformedTasks: MentorTask[] = tasksData.map((t: any) => {
        let relatedName = undefined;
        let relatedType: 'student' | 'lead' | undefined = undefined;

        if (t.students) {
            relatedName = `${t.students.first_name} ${t.students.last_name}`;
            relatedType = 'student';
        } else if (t.leads) {
            relatedName = t.leads.name;
            relatedType = 'lead';
        }

        return {
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            completed: t.completed,
            createdAt: new Date(t.created_at),
            studentId: t.student_id,
            leadId: t.lead_id,
            relatedName,
            relatedType
        };
      });

      // Transform Notes
      const transformedNotes: Note[] = notesData.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        isPinned: n.is_pinned,
        createdAt: new Date(n.created_at)
      }));

      setStudents(transformedStudents);
      setLeads(transformedLeads);
      setMentorTasks(transformedTasks);
      setNotes(transformedNotes);

    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    students,
    leads,
    mentorTasks,
    notes,
    monthlyGoal,
    gumroadRevenue,
    loading,
    fetchData,
    setStudents,
    setLeads,
    setMentorTasks,
    setNotes,
    setMonthlyGoal,
    setGumroadRevenue
  };
};