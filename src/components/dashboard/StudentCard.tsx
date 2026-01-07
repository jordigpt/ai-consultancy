import { Student } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckSquare } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard = ({ student, onClick }: StudentCardProps) => {
  const completedTasks = student.tasks.filter(t => t.completed).length;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group animate-in fade-in slide-in-from-bottom-4 duration-500"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h3 className="font-semibold leading-none">{student.firstName} {student.lastName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{student.occupation}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {student.paidInFull ? (
            <div className="h-2 w-2 rounded-full bg-green-500" title="Pagado" />
          ) : (
             <div className="h-2 w-2 rounded-full bg-red-500" title="Pago Pendiente" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center gap-2 mb-2">
           <Badge variant="secondary" className="text-xs font-normal">
             {student.businessModel}
           </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {student.context || "Sin descripción."}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <BrainCircuit size={14} />
          <span>Nivel IA: {student.aiLevel}/10</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare size={14} />
          <span>{completedTasks}/{student.tasks.length} Tareas</span>
        </div>
      </CardFooter>
    </Card>
  );
};