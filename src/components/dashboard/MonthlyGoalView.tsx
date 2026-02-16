import React, { useState, useEffect } from "react";
import { Student, CommunityAnnualMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Save, Loader2, ShoppingBag, Bot, Briefcase, Calendar, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyGoalViewProps {
  students: Student[];
  currentGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
  communityAnnualMembers?: CommunityAnnualMember[];
  communityMonthlyCount?: number;
  onSettingsUpdate: (goal: number, gumroad: number, agency: number) => void;
}

const DEFAULT_SYSTEM_PROMPT = `Eres un consultor experto...`;

export const MonthlyGoalView = ({ 
    students, 
    currentGoal, 
    gumroadRevenue, 
    agencyRevenue, 
    communityAnnualMembers = [],
    communityMonthlyCount = 0,
    onSettingsUpdate 
}: MonthlyGoalViewProps) => {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());
  
  // Month Selection
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  
  // Revenues for selected month
  const [monthGumroad, setMonthGumroad] = useState(gumroadRevenue.toString());
  const [monthAgency, setMonthAgency] = useState(agencyRevenue.toString());
  
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  // Load Prompt on Mount
  useEffect(() => {
    const fetchPrompt = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('user_settings').select('system_prompt').eq('user_id', user.id).maybeSingle();
            setSystemPrompt(data?.system_prompt || DEFAULT_SYSTEM_PROMPT);
        }
        setIsLoadingPrompt(false);
    };
    fetchPrompt();
  }, []);

  // Fetch Revenue when Month Changes
  useEffect(() => {
    const fetchMonthData = async () => {
        setIsLoadingMonth(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('monthly_revenues')
                .select('*')
                .eq('user_id', user.id)
                .eq('month_key', selectedMonth)
                .maybeSingle();

            if (data) {
                setMonthAgency(data.agency_revenue.toString());
                setMonthGumroad(data.gumroad_revenue.toString());
            } else {
                setMonthAgency("0");
                setMonthGumroad("0");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingMonth(false);
        }
    };
    fetchMonthData();
  }, [selectedMonth]);

  const handleSaveAll = async () => {
    try {
        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newGoal = parseFloat(goalInput) || 0;
        const newAgency = parseFloat(monthAgency) || 0;
        const newGumroad = parseFloat(monthGumroad) || 0;

        // 1. Save Goal & Prompt (User Settings)
        await supabase.from('user_settings').upsert({
            user_id: user.id,
            monthly_goal: newGoal,
            system_prompt: systemPrompt
        });

        // 2. Save Monthly Revenue
        await supabase.from('monthly_revenues').upsert({
            user_id: user.id,
            month_key: selectedMonth,
            agency_revenue: newAgency,
            gumroad_revenue: newGumroad
        }, { onConflict: 'user_id, month_key' });

        // Update Parent if currently viewing this month
        if (selectedMonth === format(new Date(), "yyyy-MM")) {
            onSettingsUpdate(newGoal, newGumroad, newAgency);
        }

        showSuccess("Datos guardados correctamente");
    } catch (error) {
        showError("Error al guardar");
    } finally {
        setIsSaving(false);
    }
  };

  // 1. Calculate Student Revenue for SELECTED MONTH
  const studentRevenueSelectedMonth = students.reduce((total, student) => {
      const monthPayments = (student.payments || []).filter(p => 
        format(new Date(p.paymentDate), "yyyy-MM") === selectedMonth
      );
      return total + monthPayments.reduce((sum, p) => sum + p.amount, 0);
  }, 0);

  // 2. Calculate Community Revenue for SELECTED MONTH
  // Annual Members: Filter by created_at in selected month
  const annualMembersRevenue = communityAnnualMembers
    .filter(m => format(m.createdAt, "yyyy-MM") === selectedMonth)
    .reduce((sum, m) => sum + m.amountPaid, 0);
  
  // Monthly Members: Use the global current count (Assuming MRR is constant/current for now as history isn't tracked)
  const monthlyMembersRevenue = communityMonthlyCount * 59;
  
  const communityRevenueSelectedMonth = annualMembersRevenue + monthlyMembersRevenue;

  // 3. Total
  const totalRevenue = studentRevenueSelectedMonth + communityRevenueSelectedMonth + parseFloat(monthAgency || "0") + parseFloat(monthGumroad || "0");
  const progress = Math.min((totalRevenue / (parseFloat(goalInput) || 1)) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-primary" /> Configuración & Historial
            </h2>
            <p className="text-muted-foreground">Gestiona tus ingresos mensuales y objetivos.</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <Calendar size={16} className="ml-2 text-muted-foreground" />
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Financials */}
        <div className="space-y-6">
             {/* Progress Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none relative overflow-hidden">
                {isLoadingMonth && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10"><Loader2 className="animate-spin" /></div>}
                <CardHeader>
                    <CardTitle className="text-white">Facturación: {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: es })}</CardTitle>
                    <CardDescription className="text-slate-400">Total acumulado del mes seleccionado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold">${totalRevenue.toLocaleString()}</span>
                            <span className="text-sm font-medium text-slate-400">Meta: ${parseFloat(goalInput).toLocaleString()}</span>
                        </div>
                        <Progress value={progress} className="h-3 bg-slate-700 [&>div]:bg-green-500" />
                        <p className="text-right text-xs mt-1 text-green-400 font-bold">{progress.toFixed(1)}%</p>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Ingresos Manuales ({format(new Date(selectedMonth + "-01"), "MMM yyyy", { locale: es })})</CardTitle>
                    <CardDescription>Carga los ingresos externos para este mes específico.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingMonth ? (
                        <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Meta Mensual (Global)</label>
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
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">Agencia</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input 
                                            type="number" 
                                            value={monthAgency} 
                                            onChange={(e) => setMonthAgency(e.target.value)}
                                            className="pl-9 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">Gumroad</label>
                                    <div className="relative">
                                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input 
                                            type="number" 
                                            value={monthGumroad} 
                                            onChange={(e) => setMonthGumroad(e.target.value)}
                                            className="pl-9 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-3 pt-4 border-t mt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                        Consultoría
                                    </label>
                                    <div className="relative">
                                        <Input 
                                            value={studentRevenueSelectedMonth} 
                                            readOnly
                                            className="font-medium bg-slate-50 border-dashed cursor-not-allowed text-muted-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                        <Sparkles size={12} /> JordiGPT Builders
                                    </label>
                                    <div className="relative">
                                        <Input 
                                            value={communityRevenueSelectedMonth} 
                                            readOnly
                                            className="font-medium bg-slate-50 border-dashed cursor-not-allowed text-muted-foreground"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right Column: AI Settings */}
        <div className="space-y-6">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="text-violet-600" /> Configuración de IA
                    </CardTitle>
                    <CardDescription>
                        System Prompt global.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2 h-full flex flex-col">
                        {isLoadingPrompt ? (
                            <div className="h-[300px] flex items-center justify-center border rounded-md">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Textarea 
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="flex-1 min-h-[400px] font-mono text-sm bg-slate-50 leading-relaxed p-4"
                                placeholder="Escribe aquí cómo quieres que se comporte tu IA..."
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
           <Button 
                onClick={handleSaveAll} 
                disabled={isSaving || isLoadingMonth} 
                size="lg"
                className="shadow-xl bg-primary hover:bg-primary/90"
            >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Guardar Todo
            </Button>
      </div>
    </div>
  );
};