import { Student, Lead } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, Target, Briefcase } from "lucide-react";

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
        <Card 
            className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
            onClick={() => onNavigate('active')}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                     <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                        <Users size={14} />
                    </div>
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                        Total
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{activeStudents.length}</h2>
                <p className="text-xs text-muted-foreground font-medium">Alumnos Activos</p>
            </CardContent>
        </Card>

         {/* Card 2: Revenue (Calculated) */}
         <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100 shadow-sm">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                     <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600">
                        <DollarSign size={14} />
                    </div>
                     <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        Cobrado
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">${(totalAmountOwed / 1000).toFixed(1)}k</h2>
                <p className="text-xs text-muted-foreground font-medium">Pendiente de cobro</p>
                <div className="mt-2 space-y-1">
                    <Progress value={collectionProgress} className="h-1 bg-emerald-100" />
                    <p className="text-[10px] text-right text-emerald-600 font-medium">
                        {collectionProgress.toFixed(0)}% Cobrado
                    </p>
                </div>
            </CardContent>
        </Card>

         {/* Card 3: Leads */}
         <Card 
            className="bg-gradient-to-br from-white to-orange-50/50 border-orange-100 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-orange-300"
            onClick={() => onNavigate('leads')}
         >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                     <div className="p-1.5 bg-orange-100 rounded-md text-orange-600">
                        <Target size={14} />
                    </div>
                     {hotLeads.length > 0 && (
                        <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                            {hotLeads.length} Hot
                        </span>
                     )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{leads.length}</h2>
                <p className="text-xs text-muted-foreground font-medium">Total Pipeline</p>
            </CardContent>
        </Card>

        {/* Card 4: New Leads */}
        <Card 
            className="bg-gradient-to-br from-white to-indigo-50/50 border-indigo-100 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-indigo-300"
            onClick={() => onNavigate('leads')}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                     <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                        <Briefcase size={14} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Status New</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{newLeadsCount}</h2>
                <p className="text-xs text-muted-foreground font-medium">Por Contactar</p>
            </CardContent>
        </Card>
    </div>
  );
};