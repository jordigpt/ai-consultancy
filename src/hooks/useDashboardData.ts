import { useState, useEffect, useCallback } from "react";
import { Student, Lead, MentorTask, Note, MonthlyRevenue, CommunityAnnualMember } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { format } from "date-fns";

export const useDashboardData = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mentorTasks, setMentorTasks] = useState<MentorTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Financials
  const [monthlyGoal, setMonthlyGoal] = useState(10000);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState<MonthlyRevenue>({ 
    monthKey: format(new Date(), "yyyy-MM"), 
    agencyRevenue: 0, 
    gumroadRevenue: 0 
  });
  const [consultingRevenue, setConsultingRevenue] = useState(0);
  
  // Community Data
  const [communityAnnualMembers, setCommunityAnnualMembers] = useState<CommunityAnnualMember[]>([]);
  const [communityMonthlyCount, setCommunityMonthlyCount] = useState(0);
  const [communityRevenue, setCommunityRevenue] = useState(0); // Global estimation

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentMonthKey = format(new Date(), "yyyy-MM");
      
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // --- 1. SETTINGS & BASIC REVENUE ---
        const [settingsRes, revenueRes] = await Promise.all([
            supabase.from('user_settings').select('monthly_goal, community_monthly_count').eq('user_id', user.id).maybeSingle(),
            supabase.from('monthly_revenues').select('*').eq('user_id', user.id).eq('month_key', currentMonthKey).maybeSingle()
        ]);

        if (settingsRes.data) {
            setMonthlyGoal(settingsRes.data.monthly_goal || 10000);
            const count = settingsRes.data.community_monthly_count || 0;
            setCommunityMonthlyCount(count);
            
            // Fetch Annual Members
            const { data: annualMembersData } = await supabase
                .from('community_annual_members')
                .select('*')
                .eq('user_id', user.id);
            
            const annualMembers: CommunityAnnualMember[] = (annualMembersData || []).map((m: any) => ({
                id: m.id,
                fullName: m.full_name,
                amountPaid: Number(m.amount_paid),
                notes: m.notes,
                createdAt: new Date(m.created_at)
            }));
            setCommunityAnnualMembers(annualMembers);

            // Calculate Global Estimation (Current MRR + All Time Annual) - Mostly for quick stats
            const monthlyCommunityRev = count * 59;
            const annualCommunityRev = annualMembers.reduce((sum, m) => sum + m.amountPaid, 0);
            setCommunityRevenue(monthlyCommunityRev + annualCommunityRev);
        }
        
        if (revenueRes.data) {
            setCurrentMonthRevenue({
                monthKey: revenueRes.data.month_key,
                agencyRevenue: Number(revenueRes.data.agency_revenue) || 0,
                gumroadRevenue: Number(revenueRes.data.gumroad_revenue) || 0
            });
        } else {
            setCurrentMonthRevenue({
                monthKey: currentMonthKey,
                agencyRevenue: 0,
                gumroadRevenue: 0
            });
        }
      }

      // --- 2. FETCH MAIN DATA ---

      // 2a. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
            *, 
            tasks (*), 
            calls (*), 
            student_notes (*), 
            student_events (*), 
            student_payments (*),
            student_roadmaps (*)
        `)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // 2b. Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`*, calls (*)`)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // 2c. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('mentor_tasks')
        .select(`*, students (id, first_name, last_name), leads (id, name)`)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // 2d. Fetch Notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (notesError) throw notesError;

      // --- 3. PROCESS DATA ---

      let totalConsulting = 0;

      // Transform Students
      const transformedStudents: Student[] = studentsData.map((s: any) => {
        const payments = (s.student_payments || []).map((p: any) => ({
            id: p.id,
            studentId: s.id,
            amount: Number(p.amount),
            paymentDate: new Date(p.payment_date),
            notes: p.notes
        }));

        const thisMonthPayments = payments.filter((p: any) => 
            format(p.paymentDate, "yyyy-MM") === currentMonthKey
        );
        totalConsulting += thisMonthPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

        return {
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
            healthScore: s.health_score || 'green',
            paidInFull: s.paid_in_full,
            amountPaid: s.amount_paid,
            amountOwed: s.amount_owed,
            nextBillingDate: s.next_billing_date ? new Date(s.next_billing_date) : undefined,
            roadmapUrl: s.roadmap_url, 
            roadmaps: (s.student_roadmaps || []).map((r: any) => ({
                id: r.id,
                studentId: s.id,
                title: r.title,
                fileUrl: r.file_url,
                createdAt: new Date(r.created_at)
            })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()),
            tasks: s.tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                createdAt: new Date(t.created_at)
            })).sort((a: any, b: any) => b.id.localeCompare(a.id)),
            calls: s.calls.map((c: any) => ({
                id: c.id,
                date: new Date(c.date),
                completed: c.completed,
                notes: c.notes,
                studentId: s.id
            })).sort((a: any, b: any) => b.date - a.date),
            notes: (s.student_notes || []).map((n: any) => ({
                id: n.id,
                content: n.content,
                createdAt: new Date(n.created_at)
            })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()),
            events: (s.student_events || []).map((e: any) => ({
                id: e.id,
                eventType: e.event_type,
                description: e.description,
                metadata: e.metadata,
                createdAt: new Date(e.created_at)
            })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()),
            payments: payments.sort((a: any, b: any) => b.paymentDate.getTime() - a.paymentDate.getTime())
        };
      });

      // Transform Leads
      const transformedLeads: Lead[] = leadsData.map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email || "",
        phone: l.phone || "",
        status: l.status,
        interestLevel: l.interest_level,
        value: l.value || 0,
        notes: l.notes || "",
        nextCallDate: l.next_call_date ? new Date(l.next_call_date) : undefined,
        nextFollowupDate: l.next_followup_date ? new Date(l.next_followup_date) : undefined, 
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
      setConsultingRevenue(totalConsulting);

    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Removed useEffect auto-fetch to allow control from parent (Index.tsx)

  return {
    students,
    leads,
    mentorTasks,
    notes,
    monthlyGoal,
    currentMonthRevenue,
    consultingRevenue,
    communityRevenue, 
    communityAnnualMembers,
    communityMonthlyCount,
    loading,
    fetchData,
    setStudents,
    setLeads,
    setMentorTasks,
    setNotes,
    setMonthlyGoal,
    setCurrentMonthRevenue
  };
};