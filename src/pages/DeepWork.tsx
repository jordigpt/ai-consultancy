import React, { useEffect, useState } from "react";
import { PomodoroTimer } from "@/components/deep-work/PomodoroTimer";
import { DeepWorkCanvas } from "@/components/deep-work/DeepWorkCanvas";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CanvasItem, DeepWorkSession } from "@/lib/types";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DeepWork = () => {
  const [history, setHistory] = useState<DeepWorkSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
          // CAMBIO: Usamos 'focus_sessions' en lugar de 'deep_work_sessions'
          const { data, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;

          const formattedHistory: DeepWorkSession[] = data.map((item: any) => ({
              id: item.id,
              content: item.content as CanvasItem[],
              createdAt: new Date(item.created_at)
          }));

          setHistory(formattedHistory);
      } catch (error) {
          console.error(error);
      } finally {
          setLoadingHistory(false);
      }
  };

  useEffect(() => {
      fetchHistory();
  }, []);

  const handleArchiveSession = async (items: CanvasItem[]) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
              throw new Error("No hay usuario autenticado.");
          }

          // CAMBIO: Usamos 'focus_sessions' en lugar de 'deep_work_sessions'
          const { error } = await supabase.from('focus_sessions').insert({
              user_id: user.id,
              content: items
          });

          if (error) throw error;

          showSuccess("Sesión guardada en el historial");
          fetchHistory(); // Reload history
      } catch (error: any) {
          console.error("Error saving session:", error);
          showError(`Error al guardar: ${error.message || error.error_description || "Desconocido"}`);
          throw error;
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deep Work Zone</h1>
                <p className="text-muted-foreground">Elimina distracciones. Define tus tareas. Ejecuta.</p>
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <History size={16} /> Historial
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Sesiones Archivadas</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                No hay sesiones guardadas aún.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {history.map((session) => (
                                    <div key={session.id} className="border rounded-xl p-4 bg-slate-50/50">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider border-b pb-2">
                                            <Calendar size={12} />
                                            {format(session.createdAt, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                        </div>
                                        <div className="space-y-2">
                                            {session.content.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-sm">
                                                    <div className={`mt-0.5 ${item.completed ? "text-emerald-500" : "text-slate-300"}`}>
                                                        {item.completed ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                                    </div>
                                                    <span className={`${item.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 sticky top-8">
                <PomodoroTimer />
                
                <div className="mt-6 p-4 bg-white rounded-xl border text-sm text-slate-600 space-y-2 shadow-sm">
                    <h4 className="font-semibold text-slate-900">Modo Monje 🧘‍♂️</h4>
                    <p>
                        Usa este espacio para volcar todo lo que tienes en la cabeza. 
                        Pega una lista desde cualquier lado y se transformará en checkboxes automáticamente.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        * Al finalizar, pulsa el <span className="font-bold">check</span> en la nota para archivarla y limpiar el lienzo.
                    </p>
                </div>
            </div>

            <div className="lg:col-span-2">
                <DeepWorkCanvas onArchive={handleArchiveSession} />
            </div>
        </div>
    </div>
  );
};

export default DeepWork;