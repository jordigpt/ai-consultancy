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
import { CalendarIcon, Loader2, Mail, Phone, User, DollarSign } from "lucide-react";
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
  
  const [nextCallDate, setNextCallDate] = React.useState<Date | undefined>(
    initialData?.nextCallDate || undefined
  );
  const [nextCallTime, setNextCallTime] = React.useState(
    initialData?.nextCallDate ? format(initialData.nextCallDate, "HH:mm") : "10:00"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDate = undefined;
    if (nextCallDate) {
        const [hours, minutes] = nextCallTime.split(':').map(Number);
        finalDate = new Date(nextCallDate);
        finalDate.setHours(hours);
        finalDate.setMinutes(minutes);
    }

    onSubmit({
      name,
      email,
      phone,
      interestLevel,
      value: parseFloat(value) || 0,
      notes,
      nextCallDate: finalDate,
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

      <div className="space-y-2">
        <Label>Agendar Próxima Llamada (Opcional)</Label>
        <div className="flex flex-col sm:flex-row gap-2">
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
                {nextCallDate ? format(nextCallDate, "PPP") : <span>Seleccionar fecha</span>}
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
            <Input 
                type="time" 
                value={nextCallTime}
                onChange={(e) => setNextCallTime(e.target.value)}
                className="w-full sm:w-32"
            />
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