import React, { useState, useEffect } from "react";
import { Student, CommunityAnnualMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Save, Loader2, ShoppingBag, Bot, Briefcase, Calendar, Users } from "lucide-react";
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
const MONTHLY_PRICE = 59; 

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
  
  // Revenues for selected month (Manual/Snapshot inputs)
  const [monthGumroad, setMonthGumroad] = useState(gumroadRevenue.toString());
  const [monthAgency, setMonthAgency] = useState(agencyRevenue.toString());
  const [monthCommunityRecurring, setMonthCommunityRecurring] = useState("0");
  
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  // Helper to get date object correctly from YYYY-MM string without timezone issues
  const getSelectedDateObj = () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      return new Date(year, month - 1, 1);
  };

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

            const isCurrentMonth = selectedMonth === format(new Date(), "yyyy-MM");

            if (data) {
                // If data exists in DB, use it (History or Current Saved)
                setMonthAgency(data.agency_revenue?.toString() || "0");
                setMonthGumroad(data.gumroad_revenue?.toString() || "0");
                // @ts-ignore
                setMonthCommunityRecurring(data.community_recurring_revenue?.toString() || "0");
            } else {
                // No data saved for this month yet
                setMonthAgency("0");
                setMonthGumroad("0");
                
                if (isCurrentMonth) {
                    // Default to current global count for current month
                    const currentRecurring = communityMonthlyCount * MONTHLY_PRICE;
                    setMonthCommunityRecurring(currentRecurring.toString());
                } else {
                    // Past month with no record -> 0
                    setMonthCommunityRecurring("0");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingMonth(false);
        }
    };
    fetchMonthData();
  }, [selectedMonth, communityMonthlyCount]);

  const handleSaveAll = async () => {
    try {
        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newGoal = parseFloat(goalInput) || 0;
        const newAgency = parseFloat(monthAgency) || 0;
        const newGumroad = parseFloat(monthGumroad) || 0;
        const newCommunityRecurring = parseFloat(monthCommunityRecurring) || 0;

        // 1. Save Goal & Prompt (User Settings) - Global
        await supabase.from('user_settings').upsert({
            user_id: user.id,
            monthly_goal: newGoal,
            system_prompt: systemPrompt
        });

        // 2. Save Monthly Revenue (Snapshot)
        await supabase.from('monthly_revenues').upsert({
            user_id: user.id,
            month_key: selectedMonth,
            agency_revenue: newAgency,
            gumroad_revenue: newGumroad,
            community_recurring_revenue: newCommunityRecurring
        }, { onConflict: 'user_id, month_key' });

        // Update Parent if currently viewing this month
        if (selectedMonth === format(new Date(), "yyyy-MM")) {
            onSettingsUpdate(newGoal, newGumroad, newAgency);
        }

        const dateDisplay = format(getSelectedDateObj(), "MMMM", { locale: es });
        showSuccess(`Datos archivados correctamente para ${dateDisplay}`);
    } catch (error) {
        showError("Error al guardar");
    } finally {
        setIsSaving(false);
    }
  };

  // --- CALCULATIONS ---

  // 1. Student Revenue (Calculated dynamically from payments)
  const studentRevenueSelectedMonth = students.reduce((total, student) => {
      const monthPayments = (student.payments || []).filter(p => 
        format(new Date(p.paymentDate), "yyyy-MM") === selectedMonth
      );
      return total + monthPayments.reduce((sum, p) => sum + p.amount, 0);
  }, 0);

  // 2. Annual Members Revenue (Calculated dynamically from creation date)
  const annualMembersRevenue = communityAnnualMembers
    .filter(m => format(m.createdAt, "yyyy-MM") === selectedMonth)
    .reduce((sum, m) => sum + m.amountPaid, 0);
  
  // 3. Monthly Recurring (Snapshot from State/DB)
  const communityMonthlyRevenue = parseFloat(monthCommunityRecurring) || 0;
  
  const totalCommunityRevenue = annualMembersRevenue + communityMonthlyRevenue;

  // 4. Other Manual Revenues
  const totalAgency = parseFloat(monthAgency) || 0;
  const totalGumroad = parseFloat(monthGumroad) || 0;

  // 5. Grand Total
  const totalRevenue = studentRevenueSelectedMonth + totalCommunityRevenue + totalAgency + totalGumroad;
  const progress = Math.min((totalRevenue / (parseFloat(goalInput) || 1)) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-primary" /> Cierre Mensual & Objetivos
            </h2>
            <p className="text-muted-foreground">Archiva tus ingresos y revisa el historial.</p>
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
                    <CardTitle className="text-white">Facturación: {format(getSelectedDateObj(), "MMMM yyyy", { locale: es })}</CardTitle>
                    <CardDescription className="text-slate-400">Total acumulado (Automático + Manual)</CardDescription>
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
                    <CardTitle>Detalle de Ingresos</CardTitle>
                    <CardDescription>Confirma los montos para archivar este mes.</CardDescription>
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
                                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                                        <Briefcase size={12} /> Agencia
                                    </label>
                                    <Input 
                                        type="number" 
                                        value={monthAgency} 
                                        onChange={(e) => setMonthAgency(e.target.value)}
                                        className="font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                                        <ShoppingBag size={12} /> Gumroad / Digital
                                    </label>
                                    <Input 
                                        type="number" 
                                        value={monthGumroad} 
                                        onChange={(e) => setMonthGumroad(e.target.value)}
                                        className="font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                                    <Users size={12} /> Comunidad Recurrente (Snapshot)
                                </label>
                                <div className="flex gap-2 items-center">
                                    <Input 
                                        type="number" 
                                        value={monthCommunityRecurring} 
                                        onChange={(e) => setMonthCommunityRecurring(e.target.value)}
                                        className="font-medium"
                                    />
                                    <div className="text-[10px] text-muted-foreground max-w-[120px] leading-tight">
                                        Este valor se archiva y no se actualiza con el cambio de miembros.
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-3 pt-4 border-t mt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Consultoría (Auto)
                                        </label>
                                        <Input 
                                            value={`$${studentRevenueSelectedMonth}`} 
                                            readOnly
                                            className="font-medium bg-slate-50 border-dashed cursor-not-allowed text-muted-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Comunidad Anual (Auto)
                                        </label>
                                        <Input 
                                            value={`$${annualMembersRevenue}`} 
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
                className="shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Guardar Cierre Mes
            </Button>
      </div>
    </div>
  );
};