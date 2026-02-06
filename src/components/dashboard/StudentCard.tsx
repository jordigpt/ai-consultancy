import { Student, HealthScore } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckSquare, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { differenceInDays, differenceInMonths, addMonths, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard = ({ student, onClick }: StudentCardProps) => {
  const completedTasks = student.tasks.filter(t => t.completed).length;
  
  // --- LÓGICA DE CICLO Y VENCIMIENTOS (FIXED) ---
  const today = startOfDay(new Date());
  const startDate = startOfDay(new Date(student.startDate));
  
  // 1. Pagos válidos (Total de meses pagados)
  const paymentsCount = (student.payments || []).filter(p => p.amount > 0).length;

  // 2. Mes Actual (Cronológico)
  // Si empezó el 1 de Enero y hoy es 1 de Febrero, ya es Mes 2.
  // Usamos differenceInMonths. Si la diferencia es 0 (mismo mes relativo), es el Mes 1.
  // Si hoy coincide con el día de inicio (ej 5 Ene -> 5 Feb), differenceInMonths a veces da 1 exacto.
  // Sumamos 1 para que sea base-1 (Mes 1, Mes 2).
  let currentMonthNumber = differenceInMonths(today, startDate) + 1;
  
  // Ajuste fino: si hoy es el día exacto de cobro, ya cuenta como el mes siguiente en curso
  // (Esto depende de cómo date-fns maneje diff, pero +1 suele ser seguro para "Mes en curso")

  // 3. Fecha hasta la que está cubierto (Vencimiento)
  // StartDate + Pagos * 1 Mes.
  // Ejemplo: Inicio 1 Ene. 1 Pago. Cubierto hasta 1 Feb.
  const coveredUntil = addMonths(startDate, paymentsCount);
  
  // 4. Días restantes
  // Si hoy es 25 Ene y vence 1 Feb -> Positivo.
  // Si hoy es 5 Feb y venció 1 Feb -> Negativo (Deuda).
  const daysUntilDue = differenceInDays(coveredUntil, today);
  
  // 5. Estados
  // Es deudor si la fecha de cobertura ya pasó (ayer o antes)
  const isOverdue = isBefore(coveredUntil, today); // isBefore es estricto (<)
  const isUrgent = !isOverdue && daysUntilDue <= 5; // Aviso 5 días antes

  const getHealthColor = (score: HealthScore) => {
    switch (score) {
        case 'green': return 'bg-emerald-500';
        case 'yellow': return 'bg-yellow-500';
        case 'red': return 'bg-red-500 animate-pulse';
        default: return 'bg-emerald-500';
    }
  };

  const getHealthBorder = (score: HealthScore) => {
      if (score === 'red') return 'border-red-300 bg-red-50/10 shadow-sm';
      return 'hover:border-primary/50';
  };

  return (
    <Card 
      className={cn(
          "cursor-pointer transition-all hover:shadow-md group animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between relative",
          getHealthBorder(student.healthScore),
          isOverdue && "border-red-200 bg-red-50/30"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 sm:p-4 pb-0 flex flex-col space-y-2">
        <div className="flex items-start justify-between gap-2">
           <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                 <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {student.firstName[0]}{student.lastName[0]}
                 </div>
                 <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-white", getHealthColor(student.healthScore))} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight text-sm sm:text-base truncate">{student.firstName} {student.lastName}</h3>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{student.occupation}</p>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap gap-1 items-center justify-end">
          <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 px-1.5 font-normal bg-white/50">
             <TrendingUp size={10} className="mr-1" /> Mes {currentMonthNumber}
          </Badge>

          {student.status === 'active' && (
             <div className={cn(
                 "text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0",
                 isOverdue ? "bg-red-100 text-red-700 border-red-200" :
                 isUrgent ? "bg-orange-100 text-orange-700 border-orange-200" :
                 "bg-emerald-100 text-emerald-700 border-emerald-200"
             )}>
               {isOverdue ? (
                 // Si debe, debe el mes siguiente al último pagado.
                 // Ejemplo: Pagó 1. Debe el 2. (paymentsCount + 1)
                 <><AlertCircle size={10} /> Debe Mes {paymentsCount + 1}</>
               ) : (
                 <><Clock size={10} /> Vence en {daysUntilDue}d</>
               )}
             </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 py-2 sm:py-2 flex-1">
        <div className="mb-1 sm:mb-2">
           <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal truncate max-w-full inline-block">
             {student.businessModel}
           </Badge>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {student.context || "Sin descripción."}
        </p>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0 flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground mt-auto">
        <div className="flex items-center gap-1">
          <BrainCircuit size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span>IA: {student.aiLevel}/10</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare size={12} className="sm:w-[14px] sm:h-[14px]" />
          <span>{completedTasks}/{student.tasks.length}</span>
        </div>
      </CardFooter>
    </Card>
  );
};