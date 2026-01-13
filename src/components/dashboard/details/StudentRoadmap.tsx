import React, { useState } from "react";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentRoadmapProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentRoadmap = ({ student, onUpdate }: StudentRoadmapProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showError("Solo se permiten archivos PDF");
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('roadmaps')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('roadmaps')
        .getPublicUrl(filePath);

      // 3. Actualizar base de datos
      const { error: dbError } = await supabase
        .from('students')
        .update({ roadmap_url: publicUrl })
        .eq('id', student.id);

      if (dbError) throw dbError;

      onUpdate({ ...student, roadmapUrl: publicUrl });
      showSuccess("Roadmap subido exitosamente");
    } catch (error) {
      console.error(error);
      showError("Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
      try {
        const { error } = await supabase
            .from('students')
            .update({ roadmap_url: null })
            .eq('id', student.id);
            
        if (error) throw error;
        
        onUpdate({ ...student, roadmapUrl: undefined });
        showSuccess("Roadmap eliminado");
      } catch (error) {
          showError("Error al eliminar roadmap");
      }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <FileText size={16} /> Roadmap Estratégico
      </h3>
      
      <div className="p-4 border rounded-lg bg-gray-50/50">
        {student.roadmapUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="text-red-600" size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Roadmap.pdf</p>
                <a 
                  href={student.roadmapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Ver Documento <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                    <Trash2 size={16} />
                </Button>
                {/* Input oculto para reemplazar */}
                 <div className="relative">
                    <Input 
                        type="file" 
                        accept=".pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                     <Button variant="outline" size="sm" disabled={isUploading}>
                        {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : "Reemplazar"}
                     </Button>
                 </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 py-2">
            <p className="text-sm text-muted-foreground">No hay roadmap cargado para este alumno.</p>
            <div className="relative inline-block">
                <Button variant="outline" disabled={isUploading}>
                    {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                    ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Subir PDF</>
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
        )}
      </div>
    </div>
  );
};