import React from "react";
import { Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { User, GraduationCap, RotateCcw } from "lucide-react";
import { StudentFinances } from "./details/StudentFinances"; // Corrected path
import { StudentCalls } from "./details/StudentCalls"; // Corrected path
import { StudentTasks } from "./details/StudentTasks"; // Corrected path
import { StudentRoadmap } from "./details/StudentRoadmap"; // New component
import { StudentInfo } from "./StudentInfo";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentDetailsProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDetails = ({ student, isOpen, onClose, onUpdateStudent }: StudentDetailsProps) => {
  if (!student) return null;

  const toggleStatus = async () => {
    const newStatus = student.status === 'active' ? 'graduated' : 'active';
    
    try {
        const { error } = await supabase
            .from('students')
            .update({ status: newStatus })
            .eq('id', student.id);

        if (error) throw error;

        onUpdateStudent({ ...student, status: newStatus });
        showSuccess(newStatus === 'graduated' ? "¡Alumno egresado!" : "Alumno reactivado");
        onClose(); 
    } catch (error) {
        console.error(error);
        showError("Error al actualizar estado");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              {student.firstName} {student.lastName}
            </SheetTitle>
            <div className="flex gap-2">
                {student.status === 'graduated' && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Egresado</Badge>
                )}
                {student.paidInFull ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagado</Badge>
                ) : (
                <Badge variant="destructive">Deuda: ${student.amountOwed}</Badge>
                )}
            </div>
          </div>
          <SheetDescription className="text-base font-medium text-foreground/80">
            {student.occupation}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <Button 
            variant={student.status === 'active' ? "default" : "outline"} 
            className={`w-full ${student.status === 'active' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
            onClick={toggleStatus}
          >
            {student.status === 'active' ? (
                <>
                    <GraduationCap className="mr-2 h-4 w-4" /> Marcar como Egresado
                </>
            ) : (
                <>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reactivar Alumno
                </>
            )}
          </Button>

          <StudentFinances student={student} />
          
          <StudentInfo student={student} onUpdate={onUpdateStudent} />

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User size={16} /> Contexto
            </h3>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
              {student.context || "Sin contexto adicional."}
            </div>
          </div>

          <Separator />

          <StudentRoadmap student={student} onUpdate={onUpdateStudent} />

          <Separator />
          
          <StudentCalls student={student} onUpdate={onUpdateStudent} />

          <Separator />

          <StudentTasks student={student} onUpdate={onUpdateStudent} />
        </div>
      </SheetContent>
    </Sheet>
  );
};