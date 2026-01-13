import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus } from "lucide-react";
import { StudentForm } from "./StudentForm";
import { Student } from "@/lib/types";

interface DashboardHeaderProps {
  onSignOut: () => void;
  onAddStudent: (data: Omit<Student, "id" | "tasks" | "calls" | "status">) => Promise<void>;
  isAddStudentOpen: boolean;
  setIsAddStudentOpen: (open: boolean) => void;
  isSubmitting: boolean;
}

export const DashboardHeader = ({
  onSignOut,
  onAddStudent,
  isAddStudentOpen,
  setIsAddStudentOpen,
  isSubmitting
}: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
          AI Consultancy
        </h1>
        <p className="text-xs text-muted-foreground">Tracking de Alumnos</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={onSignOut}>
          <LogOut size={18} />
        </Button>

        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
            </DialogHeader>
            <StudentForm onSubmit={onAddStudent} isLoading={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};