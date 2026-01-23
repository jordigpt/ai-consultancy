import React, { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, TrendingUp, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { isSameMonth, format } from "date-fns";

interface MonthlyGoalViewProps {
  students: Student[];
  currentGoal: number;
  onGoalUpdate: (newGoal: number) => void;
}

export const MonthlyGoalView = ({ students, currentGoal, onGoalUpdate }: MonthlyGoalViewProps) => {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGoalInput(currentGoal.toString());
  }, [currentGoal]);

  const handleSaveGoal = async () => {
    const newGoal = parseFloat(goalInput);
    if (isNaN(newGoal) || newGoal < 0) {
        showError("Ingresa un monto válido");
        return;
    }

    try {
        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Upsert settings
        const { error } = await supabase
            .from('user_settings')
            .upsert({ 
                user_id: user.id, 
                monthly_goal: newGoal 
            });

        if (error) throw error;

        onGoalUpdate(newGoal);
        showSuccess("Objetivo actualizado");
    } catch (error) {
        console.error(error);
        showError("Error al guardar objetivo");
    } finally {
        setIsSaving(false);
    }
  };

  // Calculations
  const currentMonthStudents = students.filter(s => isSameMonth(new Date(s.startDate), new Date()));
  
  const revenueThisMonth = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const pendingRevenueThisMonth = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const totalPotentialThisMonth = revenueThisMonth + pendingRevenueThisMonth;

  const progress = Math.min((revenueThisMonth / (parseFloat(goalInput) || 1)) * 100, 100);
  const potentialProgress = Math.min((totalPotentialThisMonth / (parseFloat(goalInput) || 1)) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-primary" /> Objetivos Financieros
            </h2>
            <p className="text-muted-foreground">Gestiona tus metas de facturación mensual.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal Settings Card */}
        <Card>
            <CardHeader>
                <CardTitle>Configuración del Objetivo</CardTitle>
                <CardDescription>Define cuánto quieres facturar este mes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-3">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">Meta Mensual (USD)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                                type="number" 
                                value={goalInput} 
                                onChange={(e) => setGoalInput(e.target.value)}
                                className="pl-9 text-lg font-bold"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveGoal} disabled={isSaving} className="mb-0.5">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Este monto se utilizará para calcular las barras de progreso en todo el dashboard.
                </p>
            </CardContent>
        </Card>

        {/* Current Progress Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
                <CardTitle className="text-white">Progreso Actual</CardTitle>
                <CardDescription className="text-slate-400">Rendimiento del mes en curso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-bold">${revenueThisMonth.toLocaleString()}</span>
                        <span className="text-sm font-medium text-slate-400">de ${parseFloat(goalInput).toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-slate-700 [&>div]:bg-green-500" />
                    <p className="text-right text-xs mt-1 text-green-400 font-bold">{progress.toFixed(1)}% Completado</p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span className="text-sm font-medium text-slate-300">Proyección (incluyendo deuda)</span>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                         <span className="text-xl font-semibold">${totalPotentialThisMonth.toLocaleString()}</span>
                         <span className="text-xs text-slate-400">{potentialProgress.toFixed(1)}% del objetivo</span>
                    </div>
                    <Progress value={potentialProgress} className="h-2 bg-slate-700 [&>div]:bg-blue-500" />
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
          <CardHeader>
              <CardTitle>Desglose de Ingresos (Mes Actual)</CardTitle>
          </CardHeader>
          <CardContent>
              {currentMonthStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                      No hay alumnos registrados con inicio en este mes.
                  </div>
              ) : (
                  <div className="space-y-4">
                      {currentMonthStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                      {student.firstName[0]}{student.lastName[0]}
                                  </div>
                                  <div>
                                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                                      <p className="text-xs text-muted-foreground">{format(student.startDate, "d MMM")}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-green-600">+${student.amountPaid}</p>
                                  {student.amountOwed && student.amountOwed > 0 && (
                                      <p className="text-xs text-red-500">Pendiente: ${student.amountOwed}</p>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
};