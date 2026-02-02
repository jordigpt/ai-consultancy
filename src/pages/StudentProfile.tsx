import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Student } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, GraduationCap, RotateCcw, User, CalendarDays } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

// Sub-components
import { StudentFinances } from "@/components/dashboard/details/StudentFinances";
import { StudentInfo } from "@/components/dashboard/StudentInfo"; // Updated path
import { StudentNotes } from "@/components/dashboard/details/StudentNotes";
import { StudentRoadmap } from "@/components/dashboard/details/StudentRoadmap";
import { StudentCalls } from "@/components/dashboard/details/StudentCalls";
import { StudentTasks } from "@/components/dashboard/details/StudentTasks";
import { StudentTimeline } from "@/components/dashboard/details/StudentTimeline";
import { AppLayout } from "@/components/layout/AppLayout";

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Fetch data including relations
      const { data: s, error } = await supabase
        .from('students')
        .select(`*, tasks (*), calls (*), student_notes (*), student_events (*)`)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform raw data to Student type
      const transformedStudent: Student = {
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
        roadmapUrl: s.roadmap_url,
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
        })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      };

      setStudent(transformedStudent);
    } catch (error) {
      console.error("Error fetching student:", error);
      showError("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleUpdate = (updatedStudent: Student) => {
    // Immediate local update for "Real Time" feel
    setStudent(updatedStudent);
  };

  const toggleStatus = async () => {
    if (!student) return;
    const newStatus = student.status === 'active' ? 'graduated' : 'active';
    
    try {
        const { error } = await supabase
            .from('students')
            .update({ status: newStatus })
            .eq('id', student.id);

        if (error) throw error;

        handleUpdate({ ...student, status: newStatus });
        showSuccess(newStatus === 'graduated' ? "¡Alumno egresado!" : "Alumno reactivado");
    } catch (error) {
        showError("Error al actualizar estado");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Alumno no encontrado</h2>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  const isPaid = student.paidInFull || (student.amountOwed !== undefined && student.amountOwed <= 0);

  return (
    <AppLayout 
        activeView="active" // Keeps the sidebar highlighted correctly
        onNavigate={(view) => navigate(view === 'overview' ? '/' : `/?view=${view}`)}
        onSignOut={async () => { await supabase.auth.signOut(); navigate("/login"); }}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-violet-500" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-4 border-white shadow-sm">
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {student.firstName} {student.lastName}
                            {student.status === 'graduated' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Egresado</Badge>
                            )}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="font-normal bg-slate-50">{student.occupation}</Badge>
                            <span>•</span>
                            <span className="text-sm">{student.businessModel}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleStatus}
                        className={student.status === 'active' ? "hover:bg-yellow-50 hover:text-yellow-700 border-dashed" : ""}
                    >
                        {student.status === 'active' ? (
                            <><GraduationCap className="mr-2 h-4 w-4" /> Egresar</>
                        ) : (
                            <><RotateCcw className="mr-2 h-4 w-4" /> Reactivar</>
                        )}
                    </Button>
                    {isPaid ? (
                         <div className="flex flex-col items-end px-4 py-1.5 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Estado</span>
                            <span className="text-sm font-bold text-green-700">Pagado</span>
                         </div>
                    ) : (
                        <div className="flex flex-col items-end px-4 py-1.5 bg-red-50 rounded-lg border border-red-100">
                            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Deuda</span>
                            <span className="text-sm font-bold text-red-700">${student.amountOwed}</span>
                         </div>
                    )}
                </div>
            </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Info & Context */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                        <User size={14} /> Información General
                    </h3>
                    <StudentInfo student={student} onUpdate={handleUpdate} />
                    <StudentFinances student={student} onUpdate={handleUpdate} />
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
                     <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                        <CalendarDays size={14} /> Roadmap
                    </h3>
                    <StudentRoadmap student={student} onUpdate={handleUpdate} />
                </div>

                 <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contexto</h3>
                    <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                        {student.context || "Sin contexto adicional."}
                    </div>
                </div>
            </div>

            {/* Right Column: Dynamic Tabs (Wider) */}
            <div className="lg:col-span-2 space-y-6">
                 <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="w-full justify-start h-12 bg-white border p-1 rounded-xl mb-4 gap-2 shadow-sm">
                        <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Actividad & Tareas</TabsTrigger>
                        <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Notas</TabsTrigger>
                        <TabsTrigger value="calls" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Llamadas</TabsTrigger>
                        <TabsTrigger value="timeline" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">Cronología</TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="space-y-6 mt-0">
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                             <StudentTasks student={student} onUpdate={handleUpdate} />
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0">
                         <div className="bg-white rounded-xl border shadow-sm p-6">
                            <StudentNotes student={student} onUpdate={handleUpdate} />
                         </div>
                    </TabsContent>

                     <TabsContent value="calls" className="mt-0">
                         <div className="bg-white rounded-xl border shadow-sm p-6">
                            <StudentCalls student={student} onUpdate={handleUpdate} />
                         </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-0">
                         <div className="bg-white rounded-xl border shadow-sm p-6">
                            <StudentTimeline student={student} />
                         </div>
                    </TabsContent>
                 </Tabs>
            </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentProfile;