import React, { useState } from "react";
import { Student, Lead, MentorTask } from "@/lib/types";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { LeadForm } from "@/components/leads/LeadForm";
import { StudentForm } from "@/components/dashboard/StudentForm"; 
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";

// Components
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { MentorTasksView } from "@/components/tasks/MentorTasksView";
import { Overview } from "@/components/dashboard/Overview";
import { NotesView } from "@/components/notes/NotesView";
import { MonthlyGoalView } from "@/components/dashboard/MonthlyGoalView";

// Views
import { ActiveStudentsView } from "@/components/dashboard/views/ActiveStudentsView";
import { GraduatedStudentsView } from "@/components/dashboard/views/GraduatedStudentsView";
import { LeadsView } from "@/components/dashboard/views/LeadsView";

const Index = () => {
  const {
    students,
    leads,
    mentorTasks,
    monthlyGoal,
    gumroadRevenue,
    loading,
    fetchData,
    setMentorTasks,
    setMonthlyGoal,
    setGumroadRevenue
  } = useDashboardData();

  const [currentView, setCurrentView] = useState("overview"); 
  
  // Selected Items for Details Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  
  // UI States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateSettings = (newGoal: number, newGumroad: number) => {
      setMonthlyGoal(newGoal);
      setGumroadRevenue(newGumroad);
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

  const handleToggleTask = async (task: MentorTask) => {
    try {
        // Optimistic UI Update
        const updatedTasks = mentorTasks.filter(t => t.id !== task.id);
        setMentorTasks(updatedTasks);
        
        const { error } = await supabase
            .from('mentor_tasks')
            .update({ completed: !task.completed })
            .eq('id', task.id);

        if (error) {
            // Revert on error
            fetchData();
            throw error;
        }
    } catch (error) {
        showError("Error al completar tarea");
    }
  };

  const convertLeadToStudent = (lead: Lead) => {
      setLeadDetailsOpen(false);
      setIsAddStudentOpen(true);
      showSuccess("Completa los datos para registrar al nuevo alumno.");
  };

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailsOpen(true);
  };

  const openLeadDetails = (lead: Lead) => {
      setSelectedLead(lead);
      setLeadDetailsOpen(true);
  };

  // Filter Data
  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const graduatedStudents = students.filter(s => s.status === 'graduated');

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
                    mentorTasks={mentorTasks}
                    monthlyGoal={monthlyGoal}
                    gumroadRevenue={gumroadRevenue}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onAddLead={() => setIsAddLeadOpen(true)}
                    onAddTask={() => setCurrentView('tasks')}
                    onOpenStudent={openStudentDetails}
                    onOpenLead={openLeadDetails}
                    onToggleTask={handleToggleTask}
                    onNavigate={(view) => setCurrentView(view)}
                />
            );
        case 'goals':
            return (
                <MonthlyGoalView 
                    students={students} 
                    currentGoal={monthlyGoal} 
                    gumroadRevenue={gumroadRevenue}
                    onSettingsUpdate={handleUpdateSettings} 
                />
            );
        case 'active':
            return (
                <ActiveStudentsView 
                    students={activeStudents} 
                    onStudentClick={openStudentDetails} 
                />
            );
        case 'graduated':
            return (
                <GraduatedStudentsView 
                    students={graduatedStudents} 
                    onStudentClick={openStudentDetails} 
                />
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
                <LeadsView 
                    leads={leads} 
                    onLeadClick={openLeadDetails} 
                    onAddLead={() => setIsAddLeadOpen(true)} 
                    onUpdate={fetchData}
                />
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
        
        {/* Global Lead Create Dialog */}
        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Nuevo Lead</DialogTitle>
                </DialogHeader>
                <LeadForm onSubmit={handleAddLead} isLoading={isSubmitting} />
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