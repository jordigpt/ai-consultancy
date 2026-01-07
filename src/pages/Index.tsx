import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Student, Task } from "@/lib/types";
import { StudentCard } from "@/components/dashboard/StudentCard";
import { StudentDetails } from "@/components/dashboard/StudentDetails";
import { StudentForm } from "@/components/dashboard/StudentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Search, Users, Calendar as CalendarIcon, Phone, User as UserIcon } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";

// Dummy Data Initial - Actualizado con calls
const INITIAL_STUDENTS: Student[] = [
  {
    id: "1",
    firstName: "Carlos",
    lastName: "Gómez",
    occupation: "Dueño de Agencia Marketing",
    context: "Quiere automatizar el outreach de su agencia usando IA y scrapers.",
    aiLevel: 6,
    businessModel: "Agencia de Automatización (AAA)",
    startDate: new Date(),
    paidInFull: true,
    calls: [
      { id: "c1", date: new Date(), completed: false } // Llamada hoy para demo
    ],
    tasks: [
      { id: "t1", title: "Configurar Make.com", completed: true },
      { id: "t2", title: "Crear primer scraper con Apify", completed: false },
    ],
  },
  {
    id: "2",
    firstName: "Ana",
    lastName: "López",
    occupation: "Copywriter",
    context: "Busca crear una oferta de contenido generativo para marcas personales.",
    aiLevel: 3,
    businessModel: "Creación de Contenido AI",
    startDate: new Date(),
    paidInFull: false,
    amountPaid: 500,
    amountOwed: 1000,
    calls: [],
    tasks: [
      { id: "t3", title: "Aprender Midjourney", completed: false },
      { id: "t4", title: "Definir nicho de mercado", completed: true },
    ],
  },
];

const Index = () => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleAddStudent = (data: Omit<Student, "id" | "tasks" | "calls">) => {
    const newStudent: Student = {
      ...data,
      id: Date.now().toString(),
      tasks: [],
      calls: [],
    };
    setStudents([newStudent, ...students]);
    setIsAddDialogOpen(false);
    showSuccess("Alumno registrado correctamente");
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updatedList = students.map((s) => 
      s.id === updatedStudent.id ? updatedStudent : s
    );
    setStudents(updatedList);
    setSelectedStudent(updatedStudent); // Keep the local details state updated
  };

  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsOpen(true);
  };

  // Lógica del Calendario: Buscar llamadas en la fecha seleccionada
  const callsOnDate = students.flatMap(student => 
    student.calls
      .filter(call => date && isSameDay(call.date, date))
      .map(call => ({ ...call, student })) // Adjuntar info del estudiante a la llamada
  );

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
            <StudentForm onSubmit={handleAddStudent} />
          </DialogContent>
        </Dialog>
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
        onClose={() => setDetailsOpen(false)}
        onUpdateStudent={handleUpdateStudent}
      />
      
      <div className="fixed bottom-0 w-full bg-white/50 backdrop-blur-sm border-t py-2">
         <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;