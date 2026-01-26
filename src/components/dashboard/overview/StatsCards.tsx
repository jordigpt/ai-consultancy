import { Student, Lead } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, Target, Briefcase } from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsCardsProps {
  students: Student[];
  leads: Lead[];
  onNavigate: (view: string) => void;
}

export const StatsCards = ({ students, leads, onNavigate }: StatsCardsProps) => {
  const activeStudents = students.filter(s => s.status === 'active');
  
  // Revenue Stats
  const totalAmountPaid = activeStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalAmountOwed = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const totalPotentialRevenue = totalAmountPaid + totalAmountOwed;
  // Progress Bar: (Paid / Total Potential) * 100
  const collectionProgress = totalPotentialRevenue > 0 ? (totalAmountPaid / totalPotentialRevenue) * 100 : 0;

  // Pipeline Stats
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeadsCount = leads.filter(l => l.status === 'new').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {/* Card 1: Active Students */}
         <StatCard
            theme="blue"
            icon={Users}
            label="Alumnos Activos"
            value={activeStudents.length}
            badgeText="Total"
            onClick={() => onNavigate('active')}
         />

         {/* Card 2: Revenue */}
         <StatCard
            theme="emerald"
            icon={DollarSign}
            label="Pendiente de cobro"
            value={`$${(totalAmountOwed / 1000).toFixed(1)}k`}
            badgeText="Cobrado"
         >
            <div className="mt-2 space-y-1">
                <Progress value={collectionProgress} className="h-1 bg-emerald-100" />
                <p className="text-[10px] text-right text-emerald-600 font-medium">
                    {collectionProgress.toFixed(0)}% Cobrado
                </p>
            </div>
         </StatCard>

         {/* Card 3: Leads */}
         <StatCard
            theme="orange"
            icon={Target}
            label="Total Pipeline"
            value={leads.length}
            badgeText={hotLeads.length > 0 ? `${hotLeads.length} Hot` : undefined}
            onClick={() => onNavigate('leads')}
         />

        {/* Card 4: New Leads */}
        <StatCard
            theme="indigo"
            icon={Briefcase}
            label="Por Contactar"
            value={newLeadsCount}
            badgeText="Status New"
            onClick={() => onNavigate('leads')}
        />
    </div>
  );
};