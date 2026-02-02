import { Student, Lead } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, Target } from "lucide-react";
import { StatCard } from "./StatCard";
import { MonthlyGoalWidget } from "./MonthlyGoalWidget";

interface StatsCardsProps {
  students: Student[];
  leads: Lead[];
  monthlyGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
  consultingRevenue: number; // New prop for correct monthly calculation
  onNavigate: (view: string) => void;
}

export const StatsCards = ({ 
    students, 
    leads, 
    monthlyGoal,
    gumroadRevenue,
    agencyRevenue,
    consultingRevenue,
    onNavigate 
}: StatsCardsProps) => {
  const activeStudents = students.filter(s => s.status === 'active');
  
  // Pipeline Stats
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeads = leads.filter(l => l.status === 'new');
  const activePipeline = leads.filter(l => l.status !== 'won' && l.status !== 'lost');

  // Revenue Progress for Widget
  // We use consultingRevenue which is filtered by current month from parent
  const totalRevenue = consultingRevenue + gumroadRevenue + agencyRevenue;
  const goalProgress = monthlyGoal > 0 ? Math.min((totalRevenue / monthlyGoal) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
         {/* Card 1: Monthly Goal */}
         <MonthlyGoalWidget 
            students={students}
            monthlyGoal={monthlyGoal}
            gumroadRevenue={gumroadRevenue}
            agencyRevenue={agencyRevenue}
            consultingRevenue={consultingRevenue} // Pass down
            onClick={() => onNavigate('goals')}
         />

         {/* Card 2: Active Students */}
         <StatCard
            theme="blue"
            icon={Users}
            label="Alumnos"
            value={activeStudents.length}
            badgeText="Activos"
            onClick={() => onNavigate('active')}
         />

         {/* Card 3: Agency Revenue Focus */}
         <StatCard
            theme="emerald"
            icon={DollarSign}
            label="Agencia / Otros"
            value={`$${((agencyRevenue + gumroadRevenue) / 1000).toFixed(1)}k`}
            badgeText="Este Mes"
         >
            <div className="mt-auto pt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-emerald-600 font-medium">
                    <span>Consultoría</span>
                    <span>${(consultingRevenue / 1000).toFixed(1)}k</span>
                </div>
                <Progress value={50} className="h-1 bg-emerald-100" />
            </div>
         </StatCard>

         {/* Card 4: Pipeline */}
         <StatCard
            theme="orange"
            icon={Target}
            label="Pipeline"
            value={activePipeline.length}
            badgeText={hotLeads.length > 0 ? `${hotLeads.length} Hot 🔥` : undefined}
            onClick={() => onNavigate('leads')}
         >
             <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                <span className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-full border border-orange-100 font-medium whitespace-nowrap">
                    {newLeads.length} Nuevos
                </span>
             </div>
         </StatCard>
    </div>
  );
};