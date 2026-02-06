import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Plus, Calendar, AlertTriangle, History, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, addDays, isPast, isFuture, differenceInMonths, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StudentFinancesProps {
  student: Student;
  onUpdate?: (student: Student) => void;
}

export const StudentFinances = ({ student, onUpdate }: StudentFinancesProps) => {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shouldUpdateCycle, setShouldUpdateCycle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE CICLOS Y VENCIMIENTOS ---
  const startDate = new Date(student.startDate);
  const today = new Date();

  // 1. Calcular en qué mes de cursada está
  const monthsSinceStart = differenceInMonths(today, startDate);
  const currentMonthNumber = monthsSinceStart + 1;

  // 2. Obtener el último pago válido
  const sortedPayments = [...(student.payments || [])].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : null;

  // 3. Calcular vencimiento real
  let realDueDate: Date;
  if (lastPayment) {
      realDueDate = addDays(lastPayment.paymentDate, 30);
  } else {
      realDueDate = addDays(startDate, 30);
  }

  // 4. Determinar si está vencido
  const isOverdue = isPast(realDueDate) && !isSameDay(realDueDate, today);

  // 5. Estado visual
  const statusLabel = isOverdue 
    ? `Deuda Pendiente (Mes ${currentMonthNumber})` 
    : `Al día`;

  const handleRegisterPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
        showError("Ingresa un monto válido");
        return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numAmount = parseFloat(amount);
      const dateObj = new Date(paymentDate);

      // 1. Insertar Pago
      const { data: paymentData, error: payError } = await supabase
        .from('student_payments')
        .insert({
            student_id: student.id,
            user_id: user.id,
            amount: numAmount,
            payment_date: dateObj.toISOString(),
            notes: shouldUpdateCycle ? `Pago Mes ${currentMonthNumber}` : "Pago parcial/extra"
        })
        .select()
        .single();

      if (payError) throw payError;

      // 2. Actualizar Ciclo
      let newNextBillingDate = student.nextBillingDate;
      if (shouldUpdateCycle) {
          const calculatedNextDue = addDays(dateObj, 30);
          newNextBillingDate = calculatedNextDue;

          await supabase
            .from('students')
            .update({ next_billing_date: calculatedNextDue.toISOString() })
            .eq('id', student.id);
      }

      // 3. Notificar actualización UI
      if (onUpdate) {
          const newPayment = {
              id: paymentData.id,
              studentId: student.id,
              amount: numAmount,
              paymentDate: dateObj,
              notes: paymentData.notes
          };
          
          onUpdate({
              ...student,
              nextBillingDate: newNextBillingDate,
              payments: [newPayment, ...(student.payments || [])]
          });
      }

      showSuccess("Pago registrado correctamente");
      setIsAddingPayment(false);
      setAmount("");
      
    } catch (error) {
      console.error(error);
      showError("Error al registrar pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border-2 space-y-4 relative transition-colors overflow-hidden ${
        isOverdue ? "bg-red-50/50 border-red-100" : "bg-green-50/50 border-green-100"
    }`}>
      
      {/* 1. Badges & Status Section */}
      <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
                <Badge variant={isOverdue ? "destructive" : "default"} className={`h-6 ${isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                    {isOverdue ? <AlertTriangle size={12} className="mr-1.5" /> : <DollarSign size={12} className="mr-1.5" />}
                    {isOverdue ? "Pago Requerido" : "Estado Activo"}
                </Badge>
                <Badge variant="outline" className="h-6 bg-white text-slate-700 border-slate-200 shadow-sm">
                    <TrendingUp size={12} className="mr-1.5 text-blue-600" /> 
                    Cursando Mes {currentMonthNumber}
                </Badge>
          </div>
          
          <div>
            <h4 className={`text-base font-bold leading-tight ${isOverdue ? "text-red-900" : "text-green-900"}`}>
                {statusLabel}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-slate-500">
                <Clock size={14} className={isOverdue ? "text-red-500" : "text-green-600"} />
                {isOverdue ? "Venció el: " : "Próximo vencimiento: "} 
                <span className={isOverdue ? "text-red-700 font-bold" : "text-slate-900"}>
                    {format(realDueDate, "d 'de' MMMM", { locale: es })}
                </span>
            </div>
          </div>
      </div>

      {/* 2. Action Button (Full Width) */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogTrigger asChild>
            <Button 
                className={`w-full font-semibold shadow-sm transition-all active:scale-[0.98] ${
                    isOverdue 
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200" 
                        : "bg-white text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-300"
                }`}
            >
                <Plus size={16} className="mr-2" /> Registrar Pago
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Pago - Mes {currentMonthNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Monto ($)</Label>
                    <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Pago</Label>
                    <Input 
                        type="date" 
                        value={paymentDate} 
                        onChange={(e) => setPaymentDate(e.target.value)} 
                    />
                </div>
                <div className="flex items-center gap-2 pt-2 bg-slate-50 p-2 rounded border">
                    <input 
                        type="checkbox" 
                        id="update-cycle" 
                        checked={shouldUpdateCycle} 
                        onChange={(e) => setShouldUpdateCycle(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="update-cycle" className="text-sm font-medium cursor-pointer">
                        Extender vencimiento 30 días
                        <span className="block text-[10px] text-muted-foreground font-normal">
                            (Recomendado para pagos mensuales completos)
                        </span>
                    </Label>
                </div>
                
                <Button className="w-full mt-4" onClick={handleRegisterPayment} disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Confirmar Pago"}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* 3. History Preview */}
      <div className="bg-white/80 rounded-lg p-3 border border-gray-100 shadow-sm">
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-dashed pb-2">
              <History size={12} /> Historial Reciente
          </h5>
          {!student.payments || student.payments.length === 0 ? (
              <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground italic">No hay pagos registrados aún.</p>
              </div>
          ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {student.payments.slice(0, 5).map(pay => (
                      <div key={pay.id} className="flex justify-between items-center text-xs group">
                          <div className="flex flex-col">
                              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                {format(pay.paymentDate, "d MMM yyyy", { locale: es })}
                              </span>
                              {pay.notes && <span className="text-[10px] text-muted-foreground line-clamp-1">{pay.notes}</span>}
                          </div>
                          <span className="font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-green-200 group-hover:bg-green-50 group-hover:text-green-700 transition-all">
                            ${pay.amount}
                          </span>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};