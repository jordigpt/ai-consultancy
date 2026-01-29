import React, { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Save, Loader2, ShoppingBag, Bot, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface MonthlyGoalViewProps {
  students: Student[];
  currentGoal: number;
  gumroadRevenue: number;
  agencyRevenue: number;
  onSettingsUpdate: (goal: number, gumroad: number, agency: number) => void;
}

const DEFAULT_SYSTEM_PROMPT = `Eres un consultor experto en negocios digitales, operaciones y ventas de alto ticket.
Tu misión es ayudarme a escalar mi negocio de consultoría/formación.
Tienes acceso a todos los datos de mi negocio: alumnos, leads, tareas y finanzas.

DIRECTRICES DE PERSONALIDAD:
1. Sé directo, analítico y crítico. No endulces las respuestas.
2. Si ves un lead desatendido por mucho tiempo, señálalo como una pérdida de dinero.
3. Si la facturación está lejos del objetivo, propón acciones agresivas de venta.
4. Prioriza siempre el cashflow y la satisfacción del cliente (retención).
5. Usa los datos provistos para fundamentar cada consejo.

ESTILO DE RESPUESTA:
- Usa bullet points para acciones concretas.
- Mantén las respuestas concisas pero densas en valor.
- Habla como un socio de negocios senior, no como un asistente virtual básico.`;

export const MonthlyGoalView = ({ students, currentGoal, gumroadRevenue, agencyRevenue, onSettingsUpdate }: MonthlyGoalViewProps) => {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());
  const [gumroadInput, setGumroadInput] = useState(gumroadRevenue.toString());
  const [agencyInput, setAgencyInput] = useState(agencyRevenue.toString());
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);

  useEffect(() => {
    setGoalInput(currentGoal.toString());
    setGumroadInput(gumroadRevenue.toString());
    setAgencyInput(agencyRevenue.toString());
  }, [currentGoal, gumroadRevenue, agencyRevenue]);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const { data } = await supabase
                .from('user_settings')
                .select('system_prompt')
                .eq('user_id', user.id)
                .single();
            
            if (data && data.system_prompt) {
                setSystemPrompt(data.system_prompt);
            } else {
                setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingPrompt(false);
        }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    const newGoal = parseFloat(goalInput);
    const newGumroad = parseFloat(gumroadInput);
    const newAgency = parseFloat(agencyInput);

    if (isNaN(newGoal) || newGoal < 0 || isNaN(newGumroad) || newGumroad < 0 || isNaN(newAgency) || newAgency < 0) {
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
                gumroad_revenue: newGumroad,
                agency_revenue: newAgency,
                system_prompt: systemPrompt
            });

        if (error) throw error;

        onSettingsUpdate(newGoal, newGumroad, newAgency);
        showSuccess("Configuración actualizada");
    } catch (error) {
        console.error(error);
        showError("Error al guardar configuración");
    } finally {
        setIsSaving(false);
    }
  };

  // Calculations CORREGIDAS: Usar alumnos activos en lugar de fecha de inicio
  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const studentRevenueThisMonth = activeStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const pendingRevenueThisMonth = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  
  const manualGumroad = parseFloat(gumroadInput) || 0;
  const manualAgency = parseFloat(agencyInput) || 0;
  
  const totalRevenue = studentRevenueThisMonth + manualGumroad + manualAgency;
  const totalPotentialThisMonth = totalRevenue + pendingRevenueThisMonth;
  const goalValue = parseFloat(goalInput) || 1;
  const progress = Math.min((totalRevenue / goalValue) * 100, 100);
  const potentialProgress = Math.min((totalPotentialThisMonth / goalValue) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="text-primary" /> Configuración & Objetivos
            </h2>
            <p className="text-muted-foreground">Gestiona tus metas financieras y el cerebro de tu IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Financials */}
        <div className="space-y-6">
             {/* Progress Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                <CardHeader>
                    <CardTitle className="text-white">Progreso Financiero</CardTitle>
                    <CardDescription className="text-slate-400">Consultoría + Agencia + Productos</CardDescription>
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

            {/* Financial Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Metas Financieras</CardTitle>
                    <CardDescription>Ajusta tus objetivos e ingresos manuales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Ingresos Agencia
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input 
                                    type="number" 
                                    value={agencyInput} 
                                    onChange={(e) => setAgencyInput(e.target.value)}
                                    className="pl-9 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Ingresos Gumroad
                            </label>
                            <div className="relative">
                                <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input 
                                    type="number" 
                                    value={gumroadInput} 
                                    onChange={(e) => setGumroadInput(e.target.value)}
                                    className="pl-9 font-medium"
                                />
                            </div>
                        </div>
                    </div>
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
                        Define la personalidad y reglas de tu consultor AI.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2 h-full flex flex-col">
                        <label className="text-sm font-medium">System Prompt (Instrucciones Maestras)</label>
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
                        <p className="text-xs text-muted-foreground">
                            Este texto se enviará a la IA antes de cada consulta, junto con los datos de tu negocio en tiempo real.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
           <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving} 
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