import React, { useState } from "react";
import { Student, StudentRoadmapItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Loader2, ExternalLink, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentRoadmapProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentRoadmap = ({ student, onUpdate }: StudentRoadmapProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const roadmaps = student.roadmaps || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showError("Solo se permiten archivos PDF");
      return;
    }

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      
      const fileExt = file.name.split('.').pop();
      // Usamos el nombre original del archivo para mostrarlo, pero un nombre único para storage
      const fileNameForStorage = `${student.id}-${Date.now()}.${fileExt}`;
      const displayTitle = file.name;

      // 1. Subir archivo al bucket
      const { error: uploadError } = await supabase.storage
        .from('roadmaps')
        .upload(fileNameForStorage, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('roadmaps')
        .getPublicUrl(fileNameForStorage);

      // 3. Insertar registro en la nueva tabla student_roadmaps
      const { data: newRecord, error: dbError } = await supabase
        .from('student_roadmaps')
        .insert({
            student_id: student.id,
            user_id: user.id,
            title: displayTitle,
            file_url: publicUrl
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 4. Actualizar estado local
      const newRoadmapItem: StudentRoadmapItem = {
          id: newRecord.id,
          studentId: newRecord.student_id,
          title: newRecord.title,
          fileUrl: newRecord.file_url,
          createdAt: new Date(newRecord.created_at)
      };

      const updatedRoadmaps = [newRoadmapItem, ...roadmaps];
      onUpdate({ ...student, roadmaps: updatedRoadmaps });
      
      showSuccess("Archivo subido exitosamente");
    } catch (error) {
      console.error(error);
      showError("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      // Limpiar input
      event.target.value = "";
    }
  };

  const handleDelete = async (roadmapId: string) => {
      if (!confirm("¿Eliminar este documento?")) return;

      try {
        // 1. Borrar de la base de datos
        const { error } = await supabase
            .from('student_roadmaps')
            .delete()
            .eq('id', roadmapId);
            
        if (error) throw error;
        
        // (Opcional: Podríamos borrar del bucket también si tuviéramos el path, 
        // pero por seguridad de datos a veces es mejor dejar el archivo huérfano o limpiarlo con una cron function)

        const updatedRoadmaps = roadmaps.filter(r => r.id !== roadmapId);
        onUpdate({ ...student, roadmaps: updatedRoadmaps });
        showSuccess("Documento eliminado");
      } catch (error) {
          showError("Error al eliminar documento");
      }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
            <FileText size={16} /> Documentos & Roadmaps
        </h3>
        <div className="relative">
            <Button variant="outline" size="sm" disabled={isUploading} className="h-8 text-xs">
                {isUploading ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Subiendo...</>
                ) : (
                    <><Upload className="mr-2 h-3 w-3" /> Agregar PDF</>
                )}
            </Button>
            <Input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                disabled={isUploading}
            />
        </div>
      </div>
      
      <div className="space-y-2">
        {roadmaps.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-lg bg-gray-50/50">
            <p className="text-sm text-muted-foreground">No hay documentos cargados.</p>
          </div>
        ) : (
          <div className="grid gap-2">
             {roadmaps.map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-red-50 p-2 rounded-lg shrink-0">
                            <FileText className="text-red-500" size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate pr-4" title={item.title}>
                                {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar size={10} /> {format(item.createdAt, "d MMM yyyy", { locale: es })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild>
                             <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink size={14} />
                             </a>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                 </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};