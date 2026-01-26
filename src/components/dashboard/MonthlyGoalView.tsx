import React, { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, TrendingUp, Save, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { isSameMonth, format } from "date-fns";

interface MonthlyGoalViewProps {
  students: Student[];
  currentGoal: number;
  gumroadRevenue: number;
  onSettingsUpdate: (goal: number, gumroad: number) => void;
}

export const MonthlyGoalView = ({ students, currentGoal, gumroadRevenue, onSettingsUpdate }: MonthlyGoalViewProps) => {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());
  const [gumroadInput, setGumroadInput] = useState(gumroadRevenue.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGoalInput(currentGoal.toString());
    setGumroadInput(gumroadRevenue.toString());
  }, [currentGoal, gumroadRevenue]);

  const handleSaveSettings = async () => {
    const newGoal = parseFloat(goalInput);
    const newGumroad = parseFloat(gumroadInput);

    if (isNaN(newGoal) || newGoal < 0 || isNaN(newGumroad) || newGumroad < 0) {
        showError("Ingresa montos válidos");
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
                monthly_goal: newGoal,
                gumroad_revenue: newGumroad
            });

        if (error) throw error;

        onSettingsUpdate(newGoal, newGumroad);
        showSuccess("Configuración actualizada");
    } catch (error) {
        console.error(error);
        showError("Error al guardar configuración");
    } finally {
        setIsSaving(false);
    }
  };

  // Calculations
  const currentMonthStudents = students.filter(s => isSameMonth(new Date(s.startDate), new Date()));
  
  const studentRevenueThisMonth = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const pendingRevenueThisMonth = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  
  // Total Revenue = Students + Gumroad
  const totalRevenue = studentRevenueThisMonth + (parseFloat(gumroadInput) || 0);
  const totalPotentialThisMonth = totalRevenue + pendingRevenueThisMonth;

  const goalValue = parseFloat(goalInput) || 1;
  const progress = Math.min((totalRevenue / goalValue) * 100, 100);
  const potentialProgress = Math.min((totalPotentialThisMonth / goalValue) * 100, 100);

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
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Define metas e ingresos externos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Meta Mensual (USD)</label>
                        <div className="relative">
                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                                type="number" 
                                value={goalInput} 
                                onChange={(e) => setGoalInput(e.target.value)}
                                className="pl-9 text-lg font-bold"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                             Ingresos Gumroad/Otros (Mes actual)
                             <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">Manual</span>
                        </label>
                        <div className="relative">
                            <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                                type="number" 
                                value={gumroadInput} 
                                onChange={(e) => setGumroadInput(e.target.value)}
                                className="pl-9 text-lg font-bold"
                            />
                        </div>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Current Progress Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
                <CardTitle className="text-white">Progreso Total</CardTitle>
                <CardDescription className="text-slate-400">Consultoría + Gumroad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-bold">${totalRevenue.toLocaleString()}</span>
                        <span className="text-sm font-medium text-slate-400">de ${parseFloat(goalInput).toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-slate-700 [&>div]:bg-green-500" />
                    <p className="text-right text-xs mt-1 text-green-400 font-bold">{progress.toFixed(1)}% Completado</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                    <div className="bg-white/10 p-2 rounded flex flex-col items-center">
                        <span className="text-slate-400 text-xs uppercase">Consultoría</span>
                        <span className="font-bold">${studentRevenueThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded flex flex-col items-center">
                        <span className="text-slate-400 text-xs uppercase">Gumroad</span>
                        <span className="font-bold">${(parseFloat(gumroadInput) || 0).toLocaleString()}</span>
                    </div>
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
              {currentMonthStudents.length === 0 && parseFloat(gumroadInput) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                      No hay ingresos registrados en este mes.
                  </div>
              ) : (
                  <div className="space-y-4">
                      {/* Gumroad Row */}
                      {parseFloat(gumroadInput) > 0 && (
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-pink-50/50 border-pink-100">
                              <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                                      <ShoppingBag size={18} />
                                  </div>
                                  <div>
                                      <p className="font-medium text-pink-900">Ingresos Gumroad</p>
                                      <p className="text-xs text-pink-700/70">Productos digitales / Otros</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-pink-600">+${parseFloat(gumroadInput)}</p>
                              </div>
                          </div>
                      )}

                      {/* Students Rows */}
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