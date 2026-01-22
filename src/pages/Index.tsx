import React, { useState, useEffect } from "react";
import { Student, Lead } from "@/lib/types";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadForm } from "@/components/leads/LeadForm";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Calendar as CalendarIcon, GraduationCap, Loader2, Target, Plus, Bell } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { differenceInDays } from "date-fns";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { StudentList } from "@/components/dashboard/StudentList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { NotificationsView } from "@/components/dashboard/NotificationsView";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
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
        email: s.email, // Mapped email
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
        email: data.email, // Added email
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
      // Logic: Close Lead Sheet -> Open Add Student Modal pre-filled
      setLeadDetailsOpen(false);
      setIsAddStudentOpen(true);
      showSuccess("Completa los datos para registrar al nuevo alumno.");
  };

  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const graduatedStudents = students.filter(s => s.status === 'graduated');
  const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate notifications count
  const notificationsCount = leads.filter(lead => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt));
    return daysSinceCreation >= 7 && lead.status !== 'won' && lead.status !== 'lost';
  }).length;

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailsOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
      setSelectedLead(lead);
      setLeadDetailsOpen(true);
  };

  if (loading) {
    return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <DashboardHeader 
        onSignOut={handleSignOut}
        onAddStudent={handleAddStudent}
        isAddStudentOpen={isAddStudentOpen}
        setIsAddStudentOpen={setIsAddStudentOpen}
        isSubmitting={isSubmitting}
      />

      <main className="container max-w-2xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 h-auto py-1">
            <TabsTrigger value="active" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-0">
              <Users size={16} className="shrink-0" /> <span className="truncate hidden xs:inline">Activos</span>
            </TabsTrigger>
            <TabsTrigger value="graduated" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-0">
              <GraduationCap size={16} className="shrink-0" /> <span className="truncate hidden xs:inline">Egresados</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-0">
              <CalendarIcon size={16} className="shrink-0" /> <span className="truncate hidden xs:inline">Agenda</span>
            </TabsTrigger>
             <TabsTrigger value="leads" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-0">
              <Target size={16} className="shrink-0" /> <span className="truncate hidden xs:inline">Leads</span>
            </TabsTrigger>
             <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-1.5 px-0 relative">
              <Bell size={16} className="shrink-0" /> 
              {notificationsCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-0.5 sm:right-0.5 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-600 text-[8px] sm:text-[10px] font-bold text-white">
                      {notificationsCount}
                  </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0 space-y-4">
             <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar alumno..." 
                  className="pl-9 bg-white shadow-sm h-11 sm:h-10 text-base sm:text-sm"
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
          </TabsContent>

          <TabsContent value="graduated" className="mt-0 space-y-4">
             <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar egresado..." 
                  className="pl-9 bg-white shadow-sm h-11 sm:h-10 text-base sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100 text-center">
                <p className="text-xs sm:text-sm text-yellow-800">
                    Historial de alumnos egresados.
                </p>
             </div>
            <StudentList 
              students={graduatedStudents} 
              searchQuery={searchQuery} 
              onStudentClick={openStudentDetails} 
              emptyMessage="No hay alumnos egresados aún."
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarView 
              students={students}
              leads={leads}
              onScheduleCall={handleScheduleGlobalCall}
              isSubmitting={isSubmitting}
              onOpenStudentDetails={openStudentDetails}
              onOpenLeadDetails={openLeadDetails}
            />
          </TabsContent>

          <TabsContent value="leads" className="mt-0 space-y-4">
            <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                    placeholder="Buscar lead..." 
                    className="pl-9 bg-white shadow-sm h-11 sm:h-10 text-base sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" className="h-11 w-11 sm:h-10 sm:w-10 shrink-0 bg-blue-600 hover:bg-blue-700">
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
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationsView leads={leads} onLeadClick={openLeadDetails} />
          </TabsContent>
        </Tabs>
      </main>

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
    </div>
  );
};

export default Index;