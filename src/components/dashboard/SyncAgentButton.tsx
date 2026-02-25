import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

export const SyncAgentButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-agent');

      if (error) throw error;

      if (data?.success) {
        showSuccess(data.message || "Sincronizado con Oracle Agent");
      } else {
        // If the function ran but returned success: false (e.g. missing URL config)
        console.warn("Sync warning:", data);
        showSuccess("Datos procesados (Revisar configuración de URL)");
      }
    } catch (error: any) {
      console.error("Sync failed:", error);
      showError("Error al conectar con el agente");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync} 
      disabled={isSyncing}
      className={`
        h-9 gap-2 transition-all border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100
        ${isSyncing ? "opacity-80" : ""}
      `}
      title="Enviar estado actual al Agente en Oracle"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline font-semibold text-xs">
        {isSyncing ? "Enviando..." : "Sync Agent"}
      </span>
      {!isSyncing && <Radio className="h-3 w-3 text-green-500 animate-pulse ml-1" />}
    </Button>
  );
};