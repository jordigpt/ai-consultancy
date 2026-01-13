import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Student } from "@/lib/types";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Calendar as CalendarIcon, GraduationCap, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { StudentList } from "@/components/dashboard/StudentList";
import { CalendarView } from "@/components/dashboard/CalendarView";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // UI States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          tasks (*),
          calls (*)
        `)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Transform snake_case from DB to camelCase for frontend
      const transformedData: Student[] = studentsData.map((s: any) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
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

      setStudents(transformedData);
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

  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const graduatedStudents = students.filter(s => s.status === 'graduated');

  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsOpen(true);
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

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Users size={16} /> Activos
            </TabsTrigger>
            <TabsTrigger value="graduated" className="gap-2">
              <GraduationCap size={16} /> Egresados
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon size={16} /> Agenda
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar por nombre o rol..." 
                className="pl-9 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>

          <TabsContent value="active" className="space-y-4">
            <MetricsOverview students={activeStudents} />
            <StudentList 
              students={activeStudents} 
              searchQuery={searchQuery} 
              onStudentClick={openDetails} 
            />
          </TabsContent>

          <TabsContent value="graduated" className="space-y-4">
             <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 mb-4 text-center">
                <p className="text-sm text-yellow-800">
                    Historial de alumnos que han completado su ciclo.
                </p>
             </div>
            <StudentList 
              students={graduatedStudents} 
              searchQuery={searchQuery} 
              onStudentClick={openDetails} 
              emptyMessage="No hay alumnos egresados aún."
            />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView 
              students={students}
              onScheduleCall={handleScheduleGlobalCall}
              isSubmitting={isSubmitting}
              onOpenStudentDetails={openDetails}
            />
          </TabsContent>
        </Tabs>
      </main>

      <StudentDetails 
        student={selectedStudent} 
        isOpen={detailsOpen} 
        onClose={() => {
            setDetailsOpen(false);
            fetchData();
        }}
        onUpdateStudent={fetchData}
      />
      
      <div className="fixed bottom-0 w-full bg-white/50 backdrop-blur-sm border-t py-2">
         <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;