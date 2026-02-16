import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Plus, Trash2, Save, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { CommunityAnnualMember } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MONTHLY_PRICE = 59;
const DEFAULT_ANNUAL_PRICE = 348;

const JordiGPTBuilders = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [annualMembers, setAnnualMembers] = useState<CommunityAnnualMember[]>([]);
  
  // Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberNotes, setNewMemberNotes] = useState("");
  const [newMemberAmount, setNewMemberAmount] = useState(DEFAULT_ANNUAL_PRICE.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  const fetchData = async () => {
      try {
          setLoading(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // 1. Get Monthly Count from Settings
          // Usamos maybeSingle para que no lance error si no existe la fila
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('community_monthly_count')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (settingsError) {
              console.error("Error fetching settings:", settingsError);
              // No lanzamos error aquí para permitir que cargue el resto de la página
          } else if (settings) {
              setMonthlyCount(settings.community_monthly_count || 0);
          }

          // 2. Get Annual Members
          const { data: members, error: membersError } = await supabase
            .from('community_annual_members')
            .select('*')
            .order('created_at', { ascending: false });

          if (membersError) throw membersError;

          setAnnualMembers(members.map((m: any) => ({
              id: m.id,
              fullName: m.full_name,
              amountPaid: Number(m.amount_paid),
              notes: m.notes,
              createdAt: new Date(m.created_at)
          })));

      } catch (error: any) {
          console.error("Fetch Data Error:", error);
          showError("Error al cargar datos de la comunidad");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleUpdateMonthly = async () => {
      try {
          setIsSavingMonthly(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Usamos upsert para asegurar que la fila se cree si no existe
          const { error } = await supabase
            .from('user_settings')
            .upsert({ 
                user_id: user.id, 
                community_monthly_count: monthlyCount 
            }, { onConflict: 'user_id' });

          if (error) throw error;
          showSuccess("Contador mensual actualizado");
      } catch (error) {
          console.error(error);
          showError("Error al guardar contador");
      } finally {
          setIsSavingMonthly(false);
      }
  };

  const handleAddAnnualMember = async () => {
      if (!newMemberName.trim()) {
          showError("El nombre es requerido");
          return;
      }

      try {
          setIsSubmitting(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('community_annual_members')
            .insert({
                user_id: user.id,
                full_name: newMemberName,
                amount_paid: parseFloat(newMemberAmount) || 0,
                notes: newMemberNotes
            })
            .select()
            .single();

          if (error) throw error;

          const newMember: CommunityAnnualMember = {
              id: data.id,
              fullName: data.full_name,
              amountPaid: Number(data.amount_paid),
              notes: data.notes,
              createdAt: new Date(data.created_at)
          };

          setAnnualMembers([newMember, ...annualMembers]);
          
          // Reset form
          setNewMemberName("");
          setNewMemberNotes("");
          setNewMemberAmount(DEFAULT_ANNUAL_PRICE.toString());
          
          showSuccess("Miembro anual agregado");
      } catch (error) {
          console.error(error);
          showError("Error al agregar miembro");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteMember = async (id: string) => {
      if (!confirm("¿Eliminar este miembro?")) return;

      try {
          const { error } = await supabase
            .from('community_annual_members')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setAnnualMembers(annualMembers.filter(m => m.id !== id));
          showSuccess("Miembro eliminado");
      } catch (error) {
          showError("Error al eliminar");
      }
  };

  // Calculations
  const monthlyRevenue = monthlyCount * MONTHLY_PRICE;
  const annualRevenue = annualMembers.reduce((sum, m) => sum + m.amountPaid, 0);
  const totalCommunityRevenue = monthlyRevenue + annualRevenue;

  if (loading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg text-white">
                <Sparkles size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">JordiGPT Builders</h1>
                <p className="text-muted-foreground">Gestión de comunidad Skool y membresías.</p>
            </div>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-slate-300">Facturación Total Comunidad</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">${totalCommunityRevenue.toLocaleString()}</div>
                    <p className="text-sm text-slate-400 mt-1">Acumulado Mensual + Anual</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recurrente Mensual</CardTitle>
                    <Users className="text-blue-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {monthlyCount} miembros x ${MONTHLY_PRICE}/mes
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Membresías Anuales</CardTitle>
                    <Crown className="text-yellow-500 h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${annualRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {annualMembers.length} miembros registrados
                    </p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Monthly Settings */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users size={18} className="text-blue-600" /> Miembros Mensuales
                        </CardTitle>
                        <CardDescription>
                            Tracking por cantidad (Bulk). Precio fijo: ${MONTHLY_PRICE}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cantidad de Miembros Activos</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    min="0"
                                    value={monthlyCount}
                                    onChange={(e) => setMonthlyCount(parseInt(e.target.value) || 0)}
                                    className="text-lg font-bold bg-white"
                                />
                                <Button onClick={handleUpdateMonthly} disabled={isSavingMonthly}>
                                    {isSavingMonthly ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-100/50 rounded-lg text-sm text-blue-800 flex justify-between items-center font-medium">
                            <span>Ingreso Mensual Estimado:</span>
                            <span>${(monthlyCount * MONTHLY_PRICE).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Annual Members List & Form */}
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Crown size={18} className="text-yellow-500" /> Miembros Anuales
                        </CardTitle>
                        <CardDescription>
                            Registro individual. Tracking detallado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Add Form */}
                        <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-4 rounded-xl border">
                            <div className="space-y-2 flex-1 w-full">
                                <label className="text-xs font-medium text-muted-foreground">Nombre y Apellido</label>
                                <Input 
                                    placeholder="Ej. Pedro Gomez" 
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2 w-full sm:w-32">
                                <label className="text-xs font-medium text-muted-foreground">Monto ($)</label>
                                <Input 
                                    type="number"
                                    value={newMemberAmount}
                                    onChange={(e) => setNewMemberAmount(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                             <div className="space-y-2 flex-1 w-full">
                                <label className="text-xs font-medium text-muted-foreground">Notas (Opcional)</label>
                                <Input 
                                    placeholder="Detalles..." 
                                    value={newMemberNotes}
                                    onChange={(e) => setNewMemberNotes(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <Button onClick={handleAddAnnualMember} disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                            </Button>
                        </div>

                        {/* List */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Miembro</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {annualMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No hay miembros anuales registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        annualMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="font-medium">{member.fullName}</div>
                                                    {member.notes && <div className="text-xs text-muted-foreground">{member.notes}</div>}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(member.createdAt, "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                                        ${member.amountPaid}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeleteMember(member.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default JordiGPTBuilders;