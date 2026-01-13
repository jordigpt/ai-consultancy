import React, { useState } from "react";
import { Student, BusinessModel } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrainCircuit, CalendarDays, Pencil, Mail, Check, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentInfoProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentInfo = ({ student, onUpdate }: StudentInfoProps) => {
  const [localAiLevel, setLocalAiLevel] = useState(student.aiLevel);
  
  // Email state
  const [email, setEmail] = useState(student.email || "");
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const updateBusinessModel = async (newModel: BusinessModel) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ business_model: newModel })
        .eq('id', student.id);

      if (error) throw error;

      onUpdate({ ...student, businessModel: newModel });
      showSuccess("Modelo de negocio actualizado");
    } catch (error) {
      console.error(error);
      showError("Error al actualizar modelo");
    }
  };

  const updateAiLevel = async (newLevel: number) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ ai_level: newLevel })
        .eq('id', student.id);

      if (error) throw error;

      onUpdate({ ...student, aiLevel: newLevel as any });
      showSuccess("Nivel de IA actualizado");
    } catch (error) {
      console.error(error);
      showError("Error al actualizar nivel");
    }
  };

  const updateEmail = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ email: email })
        .eq('id', student.id);

      if (error) throw error;

      onUpdate({ ...student, email });
      setIsEditingEmail(false);
      showSuccess("Email actualizado");
    } catch (error) {
      console.error(error);
      showError("Error al actualizar email");
    }
  };

  const cancelEditEmail = () => {
    setEmail(student.email || "");
    setIsEditingEmail(false);
  };

  return (
    <div className="space-y-3">
       {/* Email Section */}
       <div className="p-3 bg-secondary/50 rounded-lg flex flex-col justify-center space-y-1">
             <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                <Mail size={14} /> Contacto
            </div>
            
            {isEditingEmail ? (
                <div className="flex gap-2">
                    <Input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-8 text-sm bg-background" 
                        placeholder="email@ejemplo.com"
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0 bg-green-600 hover:bg-green-700" onClick={updateEmail}>
                        <Check size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEditEmail}>
                        <X size={14} />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center justify-between group cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsEditingEmail(true)}>
                    <span className="text-sm font-medium truncate">
                        {student.email || <span className="text-muted-foreground italic text-xs">Sin email registrado (click para agregar)</span>}
                    </span>
                    <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground" />
                </div>
            )}
        </div>

      <div className="grid grid-cols-2 gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <div className="p-3 bg-secondary/50 rounded-lg space-y-1 cursor-pointer hover:bg-secondary/70 transition-colors group relative">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                    <BrainCircuit size={14} /> Nivel IA
                  </div>
                  <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{student.aiLevel}</span>
                <span className="text-sm text-muted-foreground mb-1">/10</span>
              </div>
              <Progress value={student.aiLevel * 10} className="h-1.5" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Actualizar Nivel de IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajusta el nivel de progreso del alumno.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[student.aiLevel]}
                    max={10}
                    min={1}
                    step={1}
                    onValueChange={(vals) => setLocalAiLevel(vals[0] as any)}
                    onValueCommit={(vals) => updateAiLevel(vals[0])}
                    className="flex-1"
                  />
                  <span className="font-bold w-6 text-center">{localAiLevel}</span>
                </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="p-3 bg-secondary/50 rounded-lg space-y-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
              <CalendarDays size={14} /> Inicio
            </div>
            <div className="text-sm font-semibold">
              {format(student.startDate, "dd MMM, yyyy")}
            </div>
          </div>
          
          <Select value={student.businessModel} onValueChange={(val) => updateBusinessModel(val as BusinessModel)}>
            <SelectTrigger className="h-8 text-xs p-0 border-0 bg-transparent shadow-none hover:bg-transparent text-muted-foreground w-full justify-start focus:ring-0">
              <SelectValue placeholder="Modelo de negocio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Agencia de Automatización (AAA)">Agencia de Automatización (AAA)</SelectItem>
              <SelectItem value="SaaS Wrapper">SaaS Wrapper</SelectItem>
              <SelectItem value="Creación de Contenido AI">Creación de Contenido AI</SelectItem>
              <SelectItem value="Consultoría Estratégica">Consultoría Estratégica</SelectItem>
              <SelectItem value="Desarrollo de Chatbots">Desarrollo de Chatbots</SelectItem>
              <SelectItem value="VibeCoding de apps">VibeCoding de apps</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};