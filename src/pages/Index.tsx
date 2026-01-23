import React, { useState, useEffect } from "react";
import { Student, Lead } from "@/lib/types";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadForm } from "@/components/leads/LeadForm";
import { StudentForm } from "@/components/dashboard/StudentForm"; // Added import
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { differenceInDays } from "date-fns";

// Components
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { StudentList } from "@/components/dashboard/StudentList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { NotificationsView } from "@/components/dashboard/NotificationsView";
import { MentorTasksView } from "@/components/tasks/MentorTasksView";
import { Overview } from "@/components/dashboard/Overview";
import { NotesView } from "@/components/notes/NotesView";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("overview"); 
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  
  // UI States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`*, tasks (*), calls (*)`)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

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
        paidInFull: s.paid_in_full,
        amountPaid: s.amount_paid,
        amountOwed: s.amount_owed,
        roadmapUrl: s.roadmap_url,
        tasks: s.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: t.completed
        })).sort((a: any, b: any) => b.id.localeCompare(a.id)),
        calls: s.calls.map((c: any) => ({
          id: c.id,
          date: new Date(c.date),
          completed: c.completed,
          notes: c.notes
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
        createdAt: new Date(l.created_at)
      }));

      setStudents(transformedStudents);
      setLeads(transformedLeads);

    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddStudent = async (data: Omit<Student, "id" | "tasks" | "calls" | "status">) => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const dbData = {
        user_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email, 
        occupation: data.occupation,
        context: data.context,
        ai_level: data.aiLevel,
        business_model: data.businessModel,
        start_date: data.startDate.toISOString(),
        paid_in_full: data.paidInFull,
        amount_paid: data.amountPaid,
        amount_owed: data.amountOwed,
        status: 'active'
      };

      const { error } = await supabase.from('students').insert(dbData);

      if (error) throw error;

      showSuccess("Alumno registrado correctamente");
      setIsAddStudentOpen(false);
      fetchData(); 
    } catch (error) {
      console.error("Error adding student:", error);
      showError("Error al guardar el alumno");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLead = async (data: Omit<Lead, "id" | "createdAt" | "status">) => {
      try {
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const dbData = {
            user_id: user.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            interest_level: data.interestLevel,
            notes: data.notes,
            next_call_date: data.nextCallDate?.toISOString(),
            status: 'new'
        };

        const { error } = await supabase.from('leads').insert(dbData);
        if (error) throw error;

        showSuccess("Lead creado");
        setIsAddLeadOpen(false);
        fetchData();
      } catch (error) {
          showError("Error al guardar lead");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleScheduleGlobalCall = async (studentId: string, date: Date, time: string) => {
    try {
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [hours, minutes] = time.split(':').map(Number);
        const dateTime = new Date(date);
        dateTime.setHours(hours);
        dateTime.setMinutes(minutes);

        const newCallData = {
            student_id: studentId,
            user_id: user.id,
            date: dateTime.toISOString(),
            completed: false
        };

        const { error } = await supabase.from('calls').insert(newCallData);
        if (error) throw error;

        showSuccess("Llamada agendada correctamente");
        fetchData(); 
    } catch (error) {
        console.error(error);
        showError("Error al agendar llamada");
    } finally {
        setIsSubmitting(false);
    }
  };

  const convertLeadToStudent = (lead: Lead) => {
      setLeadDetailsOpen(false);
      setIsAddStudentOpen(true);
      showSuccess("Completa los datos para registrar al nuevo alumno.");
  };

  // Filter Data
  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const graduatedStudents = students.filter(s => s.status === 'graduated');
  const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailsOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
      setSelectedLead(lead);
      setLeadDetailsOpen(true);
  };

  // --- RENDER CONTENT BASED ON VIEW ---
  const renderContent = () => {
      if (loading) {
          return (
              <div className="h-[50vh] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          );
      }

      switch (currentView) {
        case 'overview':
            return (
                <Overview 
                    students={students} 
                    leads={leads}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onAddLead={() => setIsAddLeadOpen(true)}
                    onAddTask={() => setCurrentView('tasks')}
                    onOpenStudent={openStudentDetails}
                    onOpenLead={openLeadDetails}
                />
            );
        case 'active':
            return (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                            placeholder="Buscar alumno..." 
                            className="pl-9 bg-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <MetricsOverview students={activeStudents} />
                    <StudentList 
                        students={activeStudents} 
                        searchQuery={searchQuery} 
                        onStudentClick={openStudentDetails} 
                    />
                </div>
            );
        case 'graduated':
            return (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                            placeholder="Buscar egresado..." 
                            className="pl-9 bg-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <StudentList 
                        students={graduatedStudents} 
                        searchQuery={searchQuery} 
                        onStudentClick={openStudentDetails} 
                        emptyMessage="No hay alumnos egresados aún."
                    />
                </div>
            );
        case 'calendar':
            return (
                 <div className="max-w-2xl mx-auto">
                    <CalendarView 
                        students={students}
                        leads={leads}
                        onScheduleCall={handleScheduleGlobalCall}
                        isSubmitting={isSubmitting}
                        onOpenStudentDetails={openStudentDetails}
                        onOpenLeadDetails={openLeadDetails}
                    />
                </div>
            );
        case 'tasks':
            return (
                <div className="max-w-2xl mx-auto bg-white p-4 rounded-xl border shadow-sm">
                    <MentorTasksView />
                </div>
            );
        case 'notes':
            return <NotesView />;
        case 'leads':
            return (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                                placeholder="Buscar lead..." 
                                className="pl-9 bg-white shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                                    <Plus size={20} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                                <DialogHeader>
                                    <DialogTitle>Nuevo Lead</DialogTitle>
                                </DialogHeader>
                                <LeadForm onSubmit={handleAddLead} isLoading={isSubmitting} />
                            </DialogContent>
                        </Dialog>
                    </div>

                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay leads registrados aún.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLeads.map(lead => (
                                <LeadCard key={lead.id} lead={lead} onClick={() => openLeadDetails(lead)} />
                            ))}
                        </div>
                    )}
                </div>
            );
        default:
            return null;
      }
  };

  return (
    <AppLayout activeView={currentView} onNavigate={setCurrentView} onSignOut={handleSignOut}>
        {renderContent()}

        {/* Global Student Create Dialog */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
           <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                </DialogHeader>
                <StudentForm onSubmit={handleAddStudent} isLoading={isSubmitting} />
            </DialogContent>
        </Dialog>
        
        {/* Modals */}
        <StudentDetails 
            student={selectedStudent} 
            isOpen={studentDetailsOpen} 
            onClose={() => {
                setStudentDetailsOpen(false);
                fetchData();
            }}
            onUpdateStudent={fetchData}
        />

        <LeadDetails 
            lead={selectedLead}
            isOpen={leadDetailsOpen}
            onClose={() => {
                setLeadDetailsOpen(false);
                fetchData();
            }}
            onUpdate={fetchData}
            onConvertToStudent={convertLeadToStudent}
        />
    </AppLayout>
  );
};

export default Index;