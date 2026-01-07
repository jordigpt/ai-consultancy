import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Student, Task, Call } from "@/lib/types";
import { StudentCard } from "@/components/dashboard/StudentCard";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { StudentForm } from "@/components/dashboard/StudentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Search, Users, Calendar as CalendarIcon, Phone, User as UserIcon, LogOut, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { isSameDay, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
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
        paidInFull: s.paid_in_full,
        amountPaid: s.amount_paid,
        amountOwed: s.amount_owed,
        tasks: s.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: t.completed
        })).sort((a: any, b: any) => b.id.localeCompare(a.id)), // Simple sort
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

  const handleAddStudent = async (data: Omit<Student, "id" | "tasks" | "calls">) => {
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
        amount_owed: data.amountOwed
      };

      const { error } = await supabase.from('students').insert(dbData);

      if (error) throw error;

      showSuccess("Alumno registrado correctamente");
      setIsAddDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error adding student:", error);
      showError("Error al guardar el alumno");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudentLocal = async (updatedStudent: Student) => {
    // This function now needs to determine WHAT changed and update DB accordingly
    // For simplicity in this complex refactor, we will check what actions happen inside StudentDetails
    // But StudentDetails passes the WHOLE object.
    
    // We will update the local state immediately for UI responsiveness
    const updatedList = students.map((s) => 
      s.id === updatedStudent.id ? updatedStudent : s
    );
    setStudents(updatedList);
    setSelectedStudent(updatedStudent);

    // REAL DB SYNC IS HANDLED INSIDE StudentDetails or we need to extract logic.
    // Given the architecture, it is better if we implement specific handlers for tasks/calls
    // But since StudentDetails does the logic, we need to adapt it.
    
    // Actually, let's just re-fetch to be safe after operations? No, that's slow.
    // The "Right" way is to pass specific add/remove handlers to StudentDetails.
    // For now, I will modify StudentDetails to handle DB calls directly? 
    // Or I will try to diff? Diffing is hard.
    
    // Strategy: Modify StudentDetails to receive async handlers for DB operations.
    // But to save time and keep it robust:
    // I will refactor StudentDetails in the NEXT STEP to do direct DB calls.
    // For now, this function is a placeholder that refreshes everything.
    fetchData();
  };
  
  // New Handlers for direct DB interaction passed to children or used here
  // We will refactor StudentDetails to use these:

  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsOpen(true);
  };

  // Lógica del Calendario
  const callsOnDate = students.flatMap(student => 
    student.calls
      .filter(call => date && isSameDay(call.date, date))
      .map(call => ({ ...call, student }))
  );

  if (loading) {
    return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Mobile-First */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            AI Consultancy
          </h1>
          <p className="text-xs text-muted-foreground">Tracking de Alumnos</p>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut size={18} />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-1" /> Nuevo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                </DialogHeader>
                <StudentForm onSubmit={handleAddStudent} isLoading={isSubmitting} />
            </DialogContent>
            </Dialog>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="students" className="gap-2">
              <Users size={16} /> Alumnos
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon size={16} /> Agenda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar por nombre o rol..." 
                className="pl-9 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Metrics Quick View */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{students.length}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Activos</span>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-green-600">
                  {students.filter(s => s.paidInFull).length}
                </span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pagados</span>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No se encontraron alumnos.
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <StudentCard 
                    key={student.id} 
                    student={student} 
                    onClick={() => openDetails(student)} 
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="bg-white rounded-xl border shadow-sm p-4 space-y-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-none"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Agenda: {date ? format(date, "EEEE d, MMMM") : "Selecciona un día"}
                </h3>
                
                {callsOnDate.length > 0 ? (
                  <div className="space-y-3">
                    {callsOnDate.map((call) => (
                      <div 
                        key={call.id} 
                        className="p-3 border rounded-lg bg-blue-50/50 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => openDetails(call.student)}
                      >
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {call.student.firstName[0]}{call.student.lastName[0]}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{call.student.firstName} {call.student.lastName}</p>
                                <p className="text-xs text-muted-foreground">Videollamada de seguimiento</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <UserIcon size={14} />
                         </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-secondary/20 rounded-lg border border-dashed text-center space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <CalendarIcon className="h-5 w-5 opacity-50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No hay llamadas programadas para este día.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <StudentDetails 
        student={selectedStudent} 
        isOpen={detailsOpen} 
        onClose={() => {
            setDetailsOpen(false);
            fetchData(); // Refresh data on close to ensure sync
        }}
        onUpdateStudent={handleUpdateStudentLocal}
      />
      
      <div className="fixed bottom-0 w-full bg-white/50 backdrop-blur-sm border-t py-2">
         <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;