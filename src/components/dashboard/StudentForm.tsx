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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Student, BusinessModel } from "@/lib/types";

interface StudentFormProps {
  onSubmit: (data: Omit<Student, "id" | "tasks" | "calls">) => void;
  isLoading?: boolean;
}

export const StudentForm = ({ onSubmit, isLoading }: StudentFormProps) => {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [occupation, setOccupation] = React.useState("");
  const [context, setContext] = React.useState("");
  const [aiLevel, setAiLevel] = React.useState([1]);
  const [businessModel, setBusinessModel] = React.useState<BusinessModel>("Agencia de Automatización (AAA)");
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  
  // Finanzas
  const [paidInFull, setPaidInFull] = React.useState(true);
  const [amountPaid, setAmountPaid] = React.useState("");
  const [amountOwed, setAmountOwed] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;

    onSubmit({
      firstName,
      lastName,
      occupation,
      context,
      aiLevel: aiLevel[0] as any,
      businessModel,
      startDate,
      paidInFull,
      amountPaid: paidInFull ? undefined : Number(amountPaid),
      amountOwed: paidInFull ? undefined : Number(amountOwed),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">Ocupación / Rol Actual</Label>
        <Input id="occupation" required value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ej. Marketing Manager, Estudiante..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessModel">Modelo de Negocio Elegido</Label>
        <Select value={businessModel} onValueChange={(val) => setBusinessModel(val as BusinessModel)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Agencia de Automatización (AAA)">Agencia de Automatización (AAA)</SelectItem>
            <SelectItem value="SaaS Wrapper">SaaS Wrapper</SelectItem>
            <SelectItem value="Creación de Contenido AI">Creación de Contenido AI</SelectItem>
            <SelectItem value="Consultoría Estratégica">Consultoría Estratégica</SelectItem>
            <SelectItem value="Desarrollo de Chatbots">Desarrollo de Chatbots</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nivel actual de IA (1-10)</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={aiLevel}
            onValueChange={setAiLevel}
            max={10}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="font-bold text-lg w-8 text-center">{aiLevel[0]}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fecha de Inicio</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Seleccionar fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Sección de Finanzas Actualizada */}
      <div className="rounded-lg border p-4 shadow-sm bg-gray-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <DollarSign size={16} /> Estado del Pago
            </Label>
            <p className="text-xs text-muted-foreground">
              {paidInFull ? "El alumno ha pagado la totalidad." : "Pago parcial o financiado."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{paidInFull ? "Pagado" : "Pendiente"}</span>
            <Switch
              checked={paidInFull}
              onCheckedChange={setPaidInFull}
            />
          </div>
        </div>

        {!paidInFull && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="paid">Monto Pagado ($)</Label>
              <Input 
                id="paid" 
                type="number" 
                placeholder="0.00" 
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owed">Monto Restante ($)</Label>
              <Input 
                id="owed" 
                type="number" 
                placeholder="0.00" 
                value={amountOwed}
                onChange={(e) => setAmountOwed(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Contexto / Notas Adicionales</Label>
        <Textarea 
          id="context" 
          value={context} 
          onChange={(e) => setContext(e.target.value)} 
          placeholder="Notas sobre sus objetivos, background, etc."
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Registrar Alumno
      </Button>
    </form>
  );
};