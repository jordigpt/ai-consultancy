import { Student } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard = ({ student, onClick }: StudentCardProps) => {
  const completedTasks = student.tasks.filter(t => t.completed).length;
  
  // Lógica del ciclo de facturación (30 días)
  const calculateDaysRemaining = () => {
    const today = new Date();
    const start = new Date(student.startDate);
    
    // Días totales desde el inicio
    const daysPassed = differenceInDays(today, start);
    
    if (daysPassed < 0) return 30; // Si la fecha es futura, el ciclo empieza completo
    
    // Días dentro del ciclo actual (0 a 29)
    const daysIntoCycle = daysPassed % 30;
    
    // Días restantes para terminar el ciclo
    return 30 - daysIntoCycle;
  };

  const daysRemaining = calculateDaysRemaining();
  const isUrgent = daysRemaining <= 7; // Última semana

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md group animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isUrgent && student.status === 'active' 
          ? 'border-red-200 bg-red-50/30 hover:border-red-400' 
          : 'hover:border-primary/50'
      }`}
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
          {student.status === 'active' && (
             <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
               isUrgent 
                 ? "bg-red-100 text-red-700 border-red-200 animate-pulse" 
                 : "bg-emerald-100 text-emerald-700 border-emerald-200"
             }`}>
               {isUrgent ? <AlertCircle size={10} /> : <Clock size={10} />}
               {daysRemaining} días rest.
             </div>
          )}
          {student.paidInFull ? (
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1" title="Pagado" />
          ) : (
             <div className="h-2 w-2 rounded-full bg-red-500 mt-1" title="Pago Pendiente" />
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