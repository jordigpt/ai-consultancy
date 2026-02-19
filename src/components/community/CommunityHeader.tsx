import React from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CommunityHeaderProps {
  errorDetails?: string | null;
}

export const CommunityHeader = ({ errorDetails }: CommunityHeaderProps) => {
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg text-white">
          <Sparkles size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">JordiGPT Builders</h1>
          <p className="text-muted-foreground">Gestión de comunidad Skool y membresías.</p>
        </div>
      </div>

      {errorDetails && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Carga</AlertTitle>
          <AlertDescription>
            {errorDetails}. Intenta recargar la página o contacta soporte.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};