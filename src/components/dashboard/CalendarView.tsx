import React, { useState } from "react";
import { Student, Lead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Plus, Clock, CalendarDays, CalendarPlus, Loader2, Phone } from "lucide-react";
import { format, isSameDay, startOfDay, isAfter } from "date-fns";
import { downloadCallIcs, downloadLeadCallIcs } from "@/utils/calendar";

interface CalendarViewProps {
  students: Student[];
  leads: Lead[];
  onScheduleCall: (studentId: string, date: Date, time: string) => Promise<void>;
  isSubmitting: boolean;
  onOpenStudentDetails: (student: Student) => void;
  onOpenLeadDetails: (lead: Lead) => void;
}

export const CalendarView = ({ 
  students, 
  leads,
  onScheduleCall, 
  isSubmitting,
  onOpenStudentDetails,
  onOpenLeadDetails
}: CalendarViewProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddCallOpen, setIsAddCallOpen] = useState(false);
  
  // New Call Form State
  const [newCallStudentId, setNewCallStudentId] = useState("");
  const [newCallTime, setNewCallTime] = useState("10:00");
  const [newCallDate, setNewCallDate] = useState<Date | undefined>(new Date());

  const handleSchedule = async () => {
    if (!newCallDate || !newCallTime || !newCallStudentId) return;
    await onScheduleCall(newCallStudentId, newCallDate, newCallTime);
    setIsAddCallOpen(false);
    setNewCallStudentId("");
    setNewCallTime("10:00");
  };

  // Combine and sort all calls
  const studentCalls = students.flatMap(student => 
    student.calls.map(call => ({
      id: call.id,
      date: call.date,
      type: 'student',
      details: student,
      title: `${student.firstName} ${student.lastName}`,
      originalCall: call
    }))
  );

  const leadCalls = leads
    .filter(lead => lead.nextCallDate && lead.status !== 'won' && lead.status !== 'lost')
    .map(lead => ({
        id: lead.id, 
        date: lead.nextCallDate!,
        type: 'lead',
        details: lead,
        title: `${lead.name} (Lead)`,
        originalCall: null
    }));

  const allCalls = [...studentCalls, ...leadCalls];

  const callsOnDate = allCalls
    .filter(call => date && isSameDay(call.date, date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = startOfDay(new Date());
  const allUpcomingCalls = allCalls
    .filter(call => isAfter(call.date, today) || isSameDay(call.date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3 sm:p-4 space-y-6">
      <div className="flex justify-center overflow-hidden">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow-none w-full max-w-[300px] sm:max-w-none"
        />
      </div>

      <Dialog open={isAddCallOpen} onOpenChange={setIsAddCallOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-11 text-base shadow-sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Agendar Alumno
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] rounded-xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Llamada (Alumno)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alumno</Label>
              <Select value={newCallStudentId} onValueChange={setNewCallStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alumno..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Fecha</Label>
              <div className="border rounded-md p-2 flex justify-center">
                <Calendar
                  mode="single"
                  selected={newCallDate}
                  onSelect={setNewCallDate}
                  initialFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input 
                type="time" 
                value={newCallTime}
                onChange={(e) => setNewCallTime(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button className="w-full h-12" onClick={handleSchedule} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Daily View */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
          <CalendarIcon size={14} />
          Llamadas: {date ? format(date, "EEEE d, MMMM") : "Selecciona un día"}
        </h3>
        
        {callsOnDate.length > 0 ? (
          <div className="space-y-2">
            {callsOnDate.map((call) => (
              <div 
                key={`${call.type}-${call.id}`} 
                className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all group active:scale-[0.99] ${
                    call.type === 'lead' ? 'bg-orange-50/50 hover:bg-orange-50 border-orange-100' : 'bg-blue-50/50 hover:bg-blue-50 border-blue-100'
                }`}
                onClick={() => {
                    if (call.type === 'student') onOpenStudentDetails(call.details as Student);
                    else onOpenLeadDetails(call.details as Lead);
                }}
              >
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${
                        call.type === 'lead' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-700'
                    }`}>
                         {call.type === 'lead' ? <Phone size={14} /> : (call.details as Student).firstName[0]}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{call.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={10} /> {format(call.date, "HH:mm")}</span>
                        </div>
                    </div>
                 </div>
                 
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-green-600 hover:bg-green-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (call.type === 'student' && call.originalCall) {
                            downloadCallIcs(call.originalCall, call.details as Student);
                        } else if (call.type === 'lead') {
                            downloadLeadCallIcs(call.details as Lead);
                        }
                    }}
                    title="Agregar a Calendario"
                >
                    <CalendarPlus size={18} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-muted/20 rounded-lg border border-dashed text-center">
            <p className="text-xs text-muted-foreground">
              Sin llamadas.
            </p>
          </div>
        )}
      </div>

      {/* Global Upcoming View */}
      <div className="space-y-2 pt-4 border-t">
         <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
            <CalendarDays size={14} />
            Próximas
         </h3>
         {allUpcomingCalls.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
                No hay llamadas futuras.
            </div>
         ) : (
            <div className="space-y-2">
                {allUpcomingCalls.map((call) => (
                   <div 
                     key={`upcoming-${call.type}-${call.id}`} 
                     className="p-3 border rounded-lg hover:shadow-sm transition-all flex items-center justify-between bg-white cursor-pointer active:bg-gray-50"
                     onClick={() => {
                        if (call.type === 'student') onOpenStudentDetails(call.details as Student);
                        else onOpenLeadDetails(call.details as Lead);
                     }}
                   >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex flex-col items-center justify-center w-10 h-10 shrink-0 bg-gray-100 rounded-md border text-xs">
                            <span className="font-bold text-gray-900">{format(call.date, "d")}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{format(call.date, "MMM")}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{call.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={10} /> {format(call.date, "EEEE, HH:mm")}
                                {call.type === 'lead' && <span className="ml-1 text-orange-600 font-medium">(Lead)</span>}
                            </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-green-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (call.type === 'student' && call.originalCall) {
                                downloadCallIcs(call.originalCall, call.details as Student);
                            } else if (call.type === 'lead') {
                                downloadLeadCallIcs(call.details as Lead);
                            }
                        }}
                      >
                         <CalendarPlus size={16} />
                      </Button>
                   </div>
                ))}
            </div>
         )}
      </div>
    </div>
  );
};