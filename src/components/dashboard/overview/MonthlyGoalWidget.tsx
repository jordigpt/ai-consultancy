import React from "react";
import { Student } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target } from "lucide-react";

interface MonthlyGoalWidgetProps {
  students: Student[];
  monthlyGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
  consultingRevenue?: number; // Added optional prop
  className?: string;
  onClick?: () => void;
}

export const MonthlyGoalWidget = ({ 
  students, 
  monthlyGoal, 
  gumroadRevenue, 
  agencyRevenue,
  consultingRevenue,
  className,
  onClick
}: MonthlyGoalWidgetProps) => {
  
  // Use passed consultingRevenue if available, otherwise fallback to legacy logic (not recommended but safe)
  const safeConsultingRevenue = consultingRevenue !== undefined 
    ? consultingRevenue 
    : students.filter(s => s.status === 'active').reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  
  // Total (Alumnos este mes + Gumroad + Agencia)
  const totalMonthlyRevenue = safeConsultingRevenue + gumroadRevenue + agencyRevenue;
  
  const goal = monthlyGoal > 0 ? monthlyGoal : 1;
  const monthlyProgress = Math.min((totalMonthlyRevenue / goal) * 100, 100);

  return (
    <Card 
        className={`border-none shadow-sm relative overflow-hidden cursor-pointer transition-all hover:shadow-md group ${className}`} 
        style={{ backgroundColor: '#d4e83a' }}
        onClick={onClick}
    >
        <div className="absolute -right-2 -top-2 p-2 opacity-10 text-slate-900 group-hover:scale-110 transition-transform">
            <Target size={60} />
        </div>
        
        <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 rounded-md bg-white/30 text-slate-900 backdrop-blur-sm">
                    <TrendingUp size={14} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 text-[#d4e83a]">
                    {monthlyProgress.toFixed(0)}%
                </span>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    ${(totalMonthlyRevenue/1000).toFixed(1)}k
                </h2>
                <p className="text-xs text-slate-800 font-semibold opacity-80 mb-3">
                    Meta: ${(monthlyGoal/1000).toFixed(1)}k
                </p>
                
                <Progress 
                    value={monthlyProgress} 
                    className="h-1.5 bg-white/40 [&>div]:bg-slate-900" 
                />
            </div>
        </CardContent>
    </Card>
  );
};