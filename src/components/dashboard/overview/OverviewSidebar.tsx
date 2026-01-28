import React, { useState } from "react";
import { Student } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Target, UserPlus, StickyNote, Plus } from "lucide-react";
import { format, startOfDay, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

interface OverviewSidebarProps {
  students: Student[];
  monthlyGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
  onAddStudent: () => void;
  onAddLead: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
}

export const OverviewSidebar = ({ 
  students, 
  monthlyGoal, 
  gumroadRevenue,
  agencyRevenue,
  onAddStudent, 
  onAddLead, 
  onAddTask,
  onAddNote
}: OverviewSidebarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const today = startOfDay(new Date());

  // Monthly Goal Logic
  const currentMonthStudents = students.filter(s => isSameMonth(new Date(s.startDate), new Date()));
  const studentsRevenue = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  
  // Total (Students + Gumroad + Agency)
  const totalMonthlyRevenue = studentsRevenue + gumroadRevenue + agencyRevenue;
  const monthlyProgress = Math.min((totalMonthlyRevenue / (monthlyGoal || 1)) * 100, 100);

  return (
    <div className="lg:w-80 space-y-6 flex flex-col shrink-0">
            
        {/* iOS Style Calendar Widget */}
        <Card className="border-none shadow-md overflow-hidden bg-white relative">
            <div className="h-1.5 w-full bg-red-500 absolute top-0 left-0" />
            <CardContent className="p-0">
                <div className="p-4 pb-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-none capitalize">
                        {format(today, "MMMM", { locale: es })}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium capitalize">
                        {format(today, "EEEE, d", { locale: es })}
                    </p>
                </div>
                <div className="flex justify-center pb-2 scale-90 origin-top">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="p-0 pointer-events-none" 
                        classNames={{
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                            cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                            day_selected: "bg-red-500 text-white hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white rounded-full",
                            day_today: "bg-slate-900 text-white font-bold rounded-full hover:bg-slate-700 hover:text-white",
                        }}
                    />
                </div>
            </CardContent>
        </Card>

        {/* Quick Actions Widget */}
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Acciones Rápidas</h4>
            
            <div className="grid grid-cols-2 gap-3">
                    <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 border-dashed"
                    onClick={onAddStudent}
                >
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <UserPlus size={18} />
                        </div>
                        <span className="text-xs font-medium">Alumno</span>
                    </Button>

                    <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 border-dashed"
                    onClick={onAddLead}
                >
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Target size={18} />
                        </div>
                        <span className="text-xs font-medium">Lead</span>
                    </Button>

                    <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:border-yellow-300 hover:bg-yellow-50 border-dashed"
                    onClick={onAddNote}
                >
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <StickyNote size={18} />
                        </div>
                        <span className="text-xs font-medium">Nota</span>
                    </Button>

                    <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50 border-dashed"
                    onClick={onAddTask}
                >
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Plus size={18} />
                        </div>
                        <span className="text-xs font-medium">Tarea</span>
                    </Button>
            </div>
        </div>

        {/* Monthly Goal Widget */}
            <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-700 border-none text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target size={80} />
                </div>
                <CardContent className="p-4 space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Objetivo Mensual</p>
                            <h3 className="text-2xl font-bold mt-0.5">${(totalMonthlyRevenue/1000).toFixed(1)}k <span className="text-sm font-normal text-white/70">/ ${(monthlyGoal/1000).toFixed(1)}k</span></h3>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                    <Progress value={monthlyProgress} className="h-2 bg-black/20 [&>*]:bg-white" />
                    <div className="flex justify-between text-[10px] text-white/80 font-medium">
                        <span>Ingresos totales</span>
                        <span>{monthlyProgress.toFixed(0)}%</span>
                    </div>
                    </div>
                </CardContent>
            </Card>
    </div>
  );
};