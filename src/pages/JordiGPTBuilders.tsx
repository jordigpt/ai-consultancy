import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Users, 
    Crown, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    Sparkles, 
    AlertCircle, 
    Pencil, 
    Check, 
    X,
    Wallet,
    School
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { CommunityAnnualMember, CommunitySource } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const MONTHLY_PRICE = 59;
const DEFAULT_ANNUAL_PRICE = 348;

const JordiGPTBuilders = () => {
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Data State
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [annualMembers, setAnnualMembers] = useState<CommunityAnnualMember[]>([]);
  
  // Add Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberNotes, setNewMemberNotes] = useState("");
  const [newMemberAmount, setNewMemberAmount] = useState(DEFAULT_ANNUAL_PRICE.toString());
  const [newMemberSource, setNewMemberSource] = useState<CommunitySource>("Skool");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  // Edit State
  const [editingMember, setEditingMember] = useState<CommunityAnnualMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSource, setEditSource] = useState<CommunitySource>("Skool");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
      setErrorDetails(null);
      setLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // 1. Get Monthly Count from Settings
          try {
              const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*') 
                .eq('user_id', user.id)
                .maybeSingle();
            
              if (settingsError) {
                  console.error("Error fetching settings:", settingsError);
                  showError(`Error config: ${settingsError.message}`);
              } else if (settings) {
                  const count = (settings as any).community_monthly_count;
                  setMonthlyCount(count || 0);
              }
          } catch (e: any) {
              console.error("Excepción en settings:", e);
          }

          // 2. Get Annual Members
          try {
              const { data: members, error: membersError } = await supabase
                .from('community_annual_members')
                .select('*')
                .order('created_at', { ascending: false });

              if (membersError) {
                  console.error("Error fetching members:", membersError);
                  setErrorDetails(`Error DB: ${membersError.message} (Code: ${membersError.code})`);
                  showError(`Error al cargar miembros: ${membersError.message}`);
              } else {
                  setAnnualMembers(members.map((m: any) => ({
                      id: m.id,
                      fullName: m.full_name,
                      amountPaid: Number(m.amount_paid),
                      notes: m.notes,
                      source: m.source || 'Skool', // Default to Skool if null
                      createdAt: new Date(m.created_at)
                  })));
              }
          } catch (e: any) {
              console.error("Excepción en members:", e);
              setErrorDetails(`Excepción JS: ${e.message}`);
          }

      } catch (error: any) {
          console.error("Fetch Data Global Error:", error);
          setErrorDetails(`Error General: ${error.message}`);
          showError("Error crítico al cargar datos");
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

          const { error } = await supabase
            .from('user_settings')
            .upsert({ 
                user_id: user.id, 
                community_monthly_count: monthlyCount 
            }, { onConflict: 'user_id' });

          if (error) throw error;
          showSuccess("Contador mensual actualizado");
      } catch (error: any) {
          console.error(error);
          showError(`Error al guardar: ${error.message}`);
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
                notes: newMemberNotes,
                source: newMemberSource
            })
            .select()
            .single();

          if (error) throw error;

          const newMember: CommunityAnnualMember = {
              id: data.id,
              fullName: data.full_name,
              amountPaid: Number(data.amount_paid),
              notes: data.notes,
              source: data.source || 'Skool',
              createdAt: new Date(data.created_at)
          };

          setAnnualMembers([newMember, ...annualMembers]);
          setNewMemberName("");
          setNewMemberNotes("");
          setNewMemberAmount(DEFAULT_ANNUAL_PRICE.toString());
          setNewMemberSource("Skool");
          
          showSuccess("Miembro agregado");
      } catch (error: any) {
          console.error(error);
          showError(`Error al agregar: ${error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  const openEditDialog = (member: CommunityAnnualMember) => {
      setEditingMember(member);
      setEditName(member.fullName);
      setEditAmount(member.amountPaid.toString());
      setEditNotes(member.notes || "");
      setEditSource(member.source);
  };

  const handleUpdateMember = async () => {
      if (!editingMember || !editName.trim()) return;

      try {
          setIsUpdating(true);
          const { error } = await supabase
            .from('community_annual_members')
            .update({
                full_name: editName,
                amount_paid: parseFloat(editAmount) || 0,
                notes: editNotes,
                source: editSource
            })
            .eq('id', editingMember.id);

          if (error) throw error;

          // Update local state
          const updatedMembers = annualMembers.map(m => 
              m.id === editingMember.id 
                  ? { ...m, fullName: editName, amountPaid: parseFloat(editAmount) || 0, notes: editNotes, source: editSource }
                  : m
          );
          setAnnualMembers(updatedMembers);
          setEditingMember(null);
          showSuccess("Miembro actualizado");
      } catch (error: any) {
          showError(`Error al actualizar: ${error.message}`);
      } finally {
          setIsUpdating(false);
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
      } catch (error: any) {
          showError(`Error al eliminar: ${error.message}`);
      }
  };

  // Calculations
  const monthlyRevenue = monthlyCount * MONTHLY_PRICE;
  const annualRevenue = annualMembers.reduce((sum, m) => sum + m.amountPaid, 0);
  const totalCommunityRevenue = monthlyRevenue + annualRevenue;

  if (loading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
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

        {errorDetails && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de Carga</AlertTitle>
                <AlertDescription>
                    {errorDetails}. Intenta recargar la página o contacta soporte si el problema persiste (Código 42P01 indica falta de tablas).
                </AlertDescription>
            </Alert>
        )}

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
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 p-4 rounded-xl border">
                            <div className="space-y-2 sm:col-span-1">
                                <label className="text-xs font-medium text-muted-foreground">Fuente</label>
                                <Select value={newMemberSource} onValueChange={(val) => setNewMemberSource(val as CommunitySource)}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Skool">
                                            <div className="flex items-center gap-2"><School size={14} className="text-blue-500"/> Skool</div>
                                        </SelectItem>
                                        <SelectItem value="Binance">
                                            <div className="flex items-center gap-2"><Wallet size={14} className="text-orange-500"/> Binance</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Nombre y Apellido</label>
                                <Input 
                                    placeholder="Ej. Pedro Gomez" 
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-1">
                                <label className="text-xs font-medium text-muted-foreground">Monto ($)</label>
                                <Input 
                                    type="number"
                                    value={newMemberAmount}
                                    onChange={(e) => setNewMemberAmount(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                             <div className="space-y-2 sm:col-span-4">
                                <label className="text-xs font-medium text-muted-foreground">Notas (Opcional)</label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Detalles..." 
                                        value={newMemberNotes}
                                        onChange={(e) => setNewMemberNotes(e.target.value)}
                                        className="bg-white"
                                    />
                                    <Button onClick={handleAddAnnualMember} disabled={isSubmitting} className="shrink-0">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Fuente</TableHead>
                                        <TableHead>Miembro</TableHead>
                                        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead className="w-[80px] text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {annualMembers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No hay miembros anuales registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        annualMembers.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    {member.source === 'Binance' ? (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Binance</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Skool</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm sm:text-base">{member.fullName}</div>
                                                    {member.notes && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{member.notes}</div>}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                                                    {format(member.createdAt, "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm font-medium">
                                                        ${member.amountPaid}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                            onClick={() => openEditDialog(member)}
                                                        >
                                                            <Pencil size={14} />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDeleteMember(member.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
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

        {/* Edit Dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Miembro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Fuente de Ingreso</Label>
                        <Select value={editSource} onValueChange={(val) => setEditSource(val as CommunitySource)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Skool">
                                    <div className="flex items-center gap-2"><School size={14} className="text-blue-500"/> Skool</div>
                                </SelectItem>
                                <SelectItem value="Binance">
                                    <div className="flex items-center gap-2"><Wallet size={14} className="text-orange-500"/> Binance</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Monto Pagado ($)</Label>
                        <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
                    <Button onClick={handleUpdateMember} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default JordiGPTBuilders;