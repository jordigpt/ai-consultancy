import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Plus, AlertTriangle, History, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, addMonths, differenceInMonths, isBefore, startOfDay, differenceInDays } from "date-fns";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE CICLOS (FIXED) ---
  const startDate = startOfDay(new Date(student.startDate));
  const today = startOfDay(new Date());

  // 1. Pagos válidos
  const sortedPayments = [...(student.payments || [])].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  const validPayments = sortedPayments.filter(p => p.amount > 0);
  const paymentsCount = validPayments.length;

  // 2. Mes Cronológico Actual
  const currentMonthNumber = differenceInMonths(today, startDate) + 1;

  // 3. Vencimiento (Cubierto hasta...)
  // StartDate + (Pagos * 1 mes)
  const coveredUntil = addMonths(startDate, paymentsCount);
  
  // 4. Estados
  // Vencido si HOY > CubiertoHasta
  const isOverdue = isBefore(coveredUntil, today);
  const daysUntilDue = differenceInDays(coveredUntil, today);

  // 5. Textos
  const statusLabel = isOverdue 
    ? `Debe Mes ${paymentsCount + 1}` 
    : `Al día`;

  const nextDueLabel = isOverdue 
    ? `Venció el ${format(coveredUntil, "d 'de' MMMM", { locale: es })}`
    : `Vence en ${daysUntilDue} días (${format(coveredUntil, "d MMM")})`;

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

      // Insertar Pago
      const { data: paymentData, error: payError } = await supabase
        .from('student_payments')
        .insert({
            student_id: student.id,
            user_id: user.id,
            amount: numAmount,
            payment_date: dateObj.toISOString(),
            notes: `Pago Mes ${paymentsCount + 1}`
        })
        .select()
        .single();

      if (payError) throw payError;

      // Actualizar next_billing_date en DB (Sincronización)
      // Ahora el nuevo vencimiento será +1 mes desde el anterior coverage
      const newNextBillingDate = addMonths(coveredUntil, 1);
      
      await supabase
        .from('students')
        .update({ next_billing_date: newNextBillingDate.toISOString() })
        .eq('id', student.id);

      // UI Update
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

      showSuccess("Pago registrado");
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
      
      {/* 1. Status Section */}
      <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
                <Badge variant={isOverdue ? "destructive" : "default"} className={`h-6 ${isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                    {isOverdue ? <AlertTriangle size={12} className="mr-1.5" /> : <CheckCircle2 size={12} className="mr-1.5" />}
                    {isOverdue ? "Pago Pendiente" : "Estado Activo"}
                </Badge>
                <Badge variant="outline" className="h-6 bg-white text-slate-700 border-slate-200 shadow-sm">
                    <TrendingUp size={12} className="mr-1.5 text-blue-600" /> 
                    Mes {currentMonthNumber}
                </Badge>
          </div>
          
          <div>
            <h4 className={`text-base font-bold leading-tight ${isOverdue ? "text-red-900" : "text-green-900"}`}>
                {statusLabel}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-slate-500">
                <Clock size={14} className={isOverdue ? "text-red-500" : "text-green-600"} />
                <span className={isOverdue ? "text-red-700 font-bold" : "text-slate-900"}>
                    {nextDueLabel}
                </span>
            </div>
          </div>
      </div>

      {/* 2. Action Button */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogTrigger asChild>
            <Button 
                className={`w-full font-semibold shadow-sm transition-all active:scale-[0.98] ${
                    isOverdue 
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200" 
                        : "bg-white text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-300"
                }`}
            >
                <Plus size={16} className="mr-2" /> Registrar Pago Mes {paymentsCount + 1}
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Pago - Mes {paymentsCount + 1}</DialogTitle>
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
                  {sortedPayments.slice(0, 5).map((pay, i) => (
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