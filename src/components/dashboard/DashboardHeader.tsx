import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Plus } from "lucide-react";
import { StudentForm } from "./StudentForm";
import { Student } from "@/lib/types";

interface DashboardHeaderProps {
  onSignOut: () => void;
  onAddStudent: (data: Omit<Student, "id" | "tasks" | "calls" | "status" | "notes">) => Promise<void>;
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
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 leading-tight">
          AI Consultancy
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Tracking de Alumnos</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={onSignOut} className="h-9 w-9">
          <LogOut size={18} />
        </Button>

        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary shadow-md hover:shadow-lg transition-all h-9 px-4">
              <Plus className="h-4 w-4 mr-1" /> <span className="text-sm font-medium">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
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