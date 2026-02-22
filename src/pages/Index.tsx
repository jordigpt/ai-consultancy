import React, { useState, useEffect } from "react";
import { Student, Lead, MentorTask } from "@/lib/types";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { LeadForm } from "@/components/leads/LeadForm";
import { StudentForm } from "@/components/dashboard/StudentForm"; 
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

// Hooks
import { useDashboardData } from "@/hooks/useDashboardData";

// Components
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { MentorTasksView } from "@/components/tasks/MentorTasksView";
import { Overview } from "@/components/dashboard/Overview";
import { NotesView } from "@/components/notes/NotesView";
import { MonthlyGoalView } from "@/components/dashboard/MonthlyGoalView";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { AiConsultantView } from "@/components/ai/AiConsultantView"; 
import DeepWork from "./DeepWork"; 
import JordiGPTBuilders from "./JordiGPTBuilders"; 

// Views
import { ActiveStudentsView } from "@/components/dashboard/views/ActiveStudentsView";
import { GraduatedStudentsView } from "@/components/dashboard/views/GraduatedStudentsView";
import { LeadsView } from "@/components/dashboard/views/LeadsView";
import { AddNoteDialog } from "@/components/notes/AddNoteDialog";

const Index = () => {
  const navigate = useNavigate();
  const {
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
    setMentorTasks,
    setMonthlyGoal,
    setCurrentMonthRevenue
  } = useDashboardData();

  const [currentView, setCurrentView] = useState("overview"); 
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh data whenever we return to the overview to ensure task status is fresh
  useEffect(() => {
    if (currentView === 'overview') {
        fetchData();
    }
  }, [currentView, fetchData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateSettings = (newGoal: number, newGumroad: number, newAgency: number) => {
      setMonthlyGoal(newGoal);
      setCurrentMonthRevenue(prev => ({ 
          ...prev, 
          gumroadRevenue: newGumroad, 
          agencyRevenue: newAgency 
      }));
  };

  const handleAddStudent = async (data: Omit<Student, "id" | "tasks" | "calls" | "status" | "notes" | "events" | "payments">) => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Set initial billing date to startDate + 30 days
      const startDate = new Date(data.startDate);
      const nextBilling = new Date(startDate);
      nextBilling.setDate(startDate.getDate() + 30);

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
        next_billing_date: nextBilling.toISOString(), // Set initial billing cycle
        status: 'active'
      };

      const { data: newStudent, error } = await supabase.from('students').insert(dbData).select().single();
      if (error) throw error;

      // If initial payment is made, record it
      if (data.amountPaid && data.amountPaid > 0) {
          await supabase.from('student_payments').insert({
              student_id: newStudent.id,
              user_id: user.id,
              amount: data.amountPaid,
              payment_date: new Date().toISOString(),
              notes: "Pago inicial"
          });
      }

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
  
  const handleAddLead = async (data: Omit<Lead, "id" | "createdAt" | "status" | "calls">) => {
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
            next_followup_date: data.nextFollowupDate?.toISOString(), // NEW FIELD
            status: 'new',
            value: data.value
        };

        const { data: newLead, error } = await supabase.from('leads').insert(dbData).select().single();
        if (error) throw error;

        // If a call was scheduled, add it to the calls table history too
        if (data.nextCallDate) {
            await supabase.from('calls').insert({
                lead_id: newLead.id,
                user_id: user.id,
                date: data.nextCallDate.toISOString(),
                completed: false
            });
        }

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

        const { error } = await supabase.from('calls').insert({
            student_id: studentId,
            user_id: user.id,
            date: dateTime.toISOString(),
            completed: false
        });
        if (error) throw error;

        showSuccess("Llamada agendada correctamente");
        fetchData(); 
    } catch (error) {
        showError("Error al agendar llamada");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: MentorTask) => {
    try {
        const updatedTasks = mentorTasks.filter(t => t.id !== task.id);
        setMentorTasks(updatedTasks);
        
        const { error } = await supabase
            .from('mentor_tasks')
            .update({ completed: !task.completed })
            .eq('id', task.id);

        if (error) {
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

  const navigateToStudentProfile = (student: Student) => {
    navigate(`/student/${student.id}`);
  };

  const openLeadDetails = (lead: Lead) => {
      setSelectedLead(lead);
      setLeadDetailsOpen(true);
  };

  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const graduatedStudents = students.filter(s => s.status === 'graduated');

  // We add communityRevenue to gumroadRevenue purely for visualization in the old components 
  // without rewriting everything, but better is to sum it in the Overview
  const totalGumroadWithCommunity = currentMonthRevenue.gumroadRevenue + communityRevenue;

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
                    // Hack: We pass gumroad + community as "gumroad" for visual simplicity in current components
                    // ideally we should update components to accept "communityRevenue" prop
                    currentMonthRevenue={{...currentMonthRevenue, gumroadRevenue: totalGumroadWithCommunity }}
                    consultingRevenue={consultingRevenue}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onAddLead={() => setIsAddLeadOpen(true)}
                    onAddTask={() => setCurrentView('tasks')}
                    onOpenStudent={navigateToStudentProfile}
                    onOpenLead={openLeadDetails}
                    onToggleTask={handleToggleTask}
                    onNavigate={(view) => setCurrentView(view)}
                />
            );
        case 'ai-consultant': 
            return <AiConsultantView />;
        case 'deep-work': 
            return <DeepWork />;
        case 'jordi-gpt': 
            return <JordiGPTBuilders />;
        case 'goals':
            return (
                <MonthlyGoalView 
                    students={students} 
                    currentGoal={monthlyGoal} 
                    gumroadRevenue={currentMonthRevenue.gumroadRevenue}
                    agencyRevenue={currentMonthRevenue.agencyRevenue}
                    communityAnnualMembers={communityAnnualMembers}
                    communityMonthlyCount={communityMonthlyCount}
                    onSettingsUpdate={handleUpdateSettings} 
                />
            );
        case 'active':
            return (
                <ActiveStudentsView 
                    students={activeStudents} 
                    onStudentClick={navigateToStudentProfile}
                />
            );
        case 'graduated':
            return (
                <GraduatedStudentsView 
                    students={graduatedStudents} 
                    onStudentClick={navigateToStudentProfile}
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
                        onOpenStudentDetails={navigateToStudentProfile}
                        onOpenLeadDetails={openLeadDetails}
                    />
                </div>
            );
        case 'tasks':
            return (
                // CHANGED: Removed max-w-2xl and added h-full logic for better Kanban view
                <div className="w-full h-[calc(100vh-100px)] bg-white p-4 rounded-xl border shadow-sm flex flex-col overflow-hidden">
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
    <AppLayout 
        activeView={currentView} 
        onNavigate={setCurrentView} 
        onSignOut={handleSignOut}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
    >
        {renderContent()}

        <CommandCenter 
            open={isCommandCenterOpen}
            onOpenChange={setIsCommandCenterOpen}
            students={students}
            leads={leads}
            mentorTasks={mentorTasks}
            notes={notes}
            actions={{
                onNavigate: setCurrentView,
                onAddStudent: () => setIsAddStudentOpen(true),
                onAddLead: () => setIsAddLeadOpen(true),
                onAddTask: () => setCurrentView('tasks'),
                onAddNote: () => setIsAddNoteOpen(true),
                onOpenStudent: navigateToStudentProfile,
                onOpenLead: openLeadDetails
            }}
        />

        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
           <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                </DialogHeader>
                <StudentForm onSubmit={handleAddStudent} isLoading={isSubmitting} />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Nuevo Lead</DialogTitle>
                </DialogHeader>
                <LeadForm onSubmit={handleAddLead} isLoading={isSubmitting} />
            </DialogContent>
        </Dialog>

        <AddNoteDialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen} />
        
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