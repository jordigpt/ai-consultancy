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
  onNavigate: (view: string) => void;
}

export const StatsCards = ({ 
    students, 
    leads, 
    monthlyGoal,
    gumroadRevenue,
    agencyRevenue,
    onNavigate 
}: StatsCardsProps) => {
  const activeStudents = students.filter(s => s.status === 'active');
  
  // Revenue Stats
  const totalAmountPaid = activeStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalAmountOwed = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const totalPotentialRevenue = totalAmountPaid + totalAmountOwed;
  // Progress Bar: (Paid / Total Potential) * 100
  const collectionProgress = totalPotentialRevenue > 0 ? (totalAmountPaid / totalPotentialRevenue) * 100 : 0;

  // Pipeline Stats (Merged Logic)
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeads = leads.filter(l => l.status === 'new');
  const activePipeline = leads.filter(l => l.status !== 'won' && l.status !== 'lost');

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
         {/* Card 1: Monthly Goal (Compact) */}
         <MonthlyGoalWidget 
            students={students}
            monthlyGoal={monthlyGoal}
            gumroadRevenue={gumroadRevenue}
            agencyRevenue={agencyRevenue}
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

         {/* Card 3: Revenue / Debt */}
         <StatCard
            theme="emerald"
            icon={DollarSign}
            label="Por cobrar"
            value={`$${(totalAmountOwed / 1000).toFixed(1)}k`}
            badgeText="Deuda"
         >
            <div className="mt-auto pt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-emerald-600 font-medium">
                    <span>Recaudado</span>
                    <span>{collectionProgress.toFixed(0)}%</span>
                </div>
                <Progress value={collectionProgress} className="h-1 bg-emerald-100" />
            </div>
         </StatCard>

         {/* Card 4: Consolidated Pipeline (Total + New + Hot) */}
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