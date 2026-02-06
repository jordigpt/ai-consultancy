import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Mail, Phone, User, DollarSign, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, InterestLevel } from "@/lib/types";

interface LeadFormProps {
  onSubmit: (data: Omit<Lead, "id" | "createdAt" | "status" | "calls">) => void;
  isLoading?: boolean;
  initialData?: Lead;
}

export const LeadForm = ({ onSubmit, isLoading, initialData }: LeadFormProps) => {
  const [name, setName] = React.useState(initialData?.name || "");
  const [email, setEmail] = React.useState(initialData?.email || "");
  const [phone, setPhone] = React.useState(initialData?.phone || "");
  const [interestLevel, setInterestLevel] = React.useState<InterestLevel>(initialData?.interestLevel || "medium");
  const [value, setValue] = React.useState(initialData?.value?.toString() || "");
  const [notes, setNotes] = React.useState(initialData?.notes || "");
  
  // Call Scheduler
  const [nextCallDate, setNextCallDate] = React.useState<Date | undefined>(
    initialData?.nextCallDate || undefined
  );
  const [nextCallTime, setNextCallTime] = React.useState(
    initialData?.nextCallDate ? format(initialData.nextCallDate, "HH:mm") : "10:00"
  );

  // Follow-up Scheduler
  const [nextFollowupDate, setNextFollowupDate] = React.useState<Date | undefined>(
    initialData?.nextFollowupDate || undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCallDate = undefined;
    if (nextCallDate) {
        const [hours, minutes] = nextCallTime.split(':').map(Number);
        finalCallDate = new Date(nextCallDate);
        finalCallDate.setHours(hours);
        finalCallDate.setMinutes(minutes);
    }

    // Follow-up date (usually doesn't need strict time, defaulting to start of day or keeping standard)
    // We can just keep the date object as is from the picker (usually 00:00 local)

    onSubmit({
      name,
      email,
      phone,
      interestLevel,
      value: parseFloat(value) || 0,
      notes,
      nextCallDate: finalCallDate,
      nextFollowupDate: nextFollowupDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Prospecto</Label>
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Ej. Empresa X o Persona Y" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="correo@ejemplo.com" />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone">Teléfono / WhatsApp</Label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="+54 9 11..." />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
            <Label>Nivel de Interés</Label>
            <Select value={interestLevel} onValueChange={(val) => setInterestLevel(val as InterestLevel)}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="low">❄️ Frío (Low)</SelectItem>
                <SelectItem value="medium">🌤️ Tibio (Medium)</SelectItem>
                <SelectItem value="high">🔥 Caliente (High)</SelectItem>
            </SelectContent>
            </Select>
        </div>
        
        <div className="space-y-2">
            <Label>Valor Estimado ($)</Label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                    type="number" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    className="pl-9" 
                    placeholder="0.00" 
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Call Scheduler */}
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <Phone size={14} className="text-blue-600" /> Próxima Llamada
            </Label>
            <div className="flex flex-col gap-2">
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !nextCallDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextCallDate ? format(nextCallDate, "PPP") : <span>Sin fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={nextCallDate}
                    onSelect={setNextCallDate}
                    initialFocus
                    />
                </PopoverContent>
                </Popover>
                {nextCallDate && (
                    <Input 
                        type="time" 
                        value={nextCallTime}
                        onChange={(e) => setNextCallTime(e.target.value)}
                        className="w-full"
                    />
                )}
            </div>
        </div>

        {/* Follow-up Scheduler */}
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <MessageCircle size={14} className="text-purple-600" /> Seguimiento (Mensaje)
            </Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal border-purple-100 hover:bg-purple-50",
                        !nextFollowupDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextFollowupDate ? format(nextFollowupDate, "PPP") : <span>Sin seguimiento</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={nextFollowupDate}
                    onSelect={setNextFollowupDate}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas / Contexto</Label>
        <Textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Necesidades, objeciones, presupuesto..."
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Actualizar Lead" : "Guardar Lead"}
      </Button>
    </form>
  );
};