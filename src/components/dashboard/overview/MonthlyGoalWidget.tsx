import React from "react";
import { Student } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp } from "lucide-react";
import { isSameMonth } from "date-fns";

interface MonthlyGoalWidgetProps {
  students: Student[];
  monthlyGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
}

export const MonthlyGoalWidget = ({ 
  students, 
  monthlyGoal, 
  gumroadRevenue, 
  agencyRevenue 
}: MonthlyGoalWidgetProps) => {
  // Monthly Goal Logic
  const currentMonthStudents = students.filter(s => isSameMonth(new Date(s.startDate), new Date()));
  const studentsRevenue = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  
  // Total (Students + Gumroad + Agency)
  const totalMonthlyRevenue = studentsRevenue + gumroadRevenue + agencyRevenue;
  const monthlyProgress = Math.min((totalMonthlyRevenue / (monthlyGoal || 1)) * 100, 100);

  return (
    <Card className="border-none shadow-md relative overflow-hidden" style={{ backgroundColor: '#d4e83a' }}>
        <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-900">
            <Target size={120} />
        </div>
        <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <TrendingUp size={14} /> Objetivo Mensual
                    </p>
                    <div className="flex items-baseline gap-2 text-slate-900">
                        <h3 className="text-4xl font-extrabold tracking-tight">
                            ${(totalMonthlyRevenue/1000).toFixed(1)}k
                        </h3>
                        <span className="text-lg font-medium opacity-60">
                            / ${(monthlyGoal/1000).toFixed(1)}k
                        </span>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-3xl font-bold text-slate-900">{monthlyProgress.toFixed(0)}%</p>
                    <p className="text-xs font-medium text-slate-800">Completado</p>
                </div>
            </div>

            <div className="space-y-2">
                <Progress 
                    value={monthlyProgress} 
                    className="h-3 bg-white/40 [&>div]:bg-slate-900" 
                />
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:hidden">
                    <span>Progreso Total</span>
                    <span>{monthlyProgress.toFixed(0)}%</span>
                </div>
            </div>
        </CardContent>
    </Card>
  );
};