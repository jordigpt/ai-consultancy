import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Bot, Send, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AiConsultantView = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola. Tengo acceso completo a tus métricas, alumnos, leads y tareas (vía Gemini 2.0 Flash). Analicemos tu negocio. ¿Qué te preocupa hoy o qué área quieres optimizar?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa.");

      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: { messages: newMessages }
      });

      if (error) {
        let errorDetails = error.message;
        try {
             // @ts-ignore
             const context = await error.context.json();
             if (context.error) errorDetails = context.error;
        } catch (e) {
            // Fallback
        }
        throw new Error(errorDetails);
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = error.message || "Error desconocido";
      
      showError("Error al conectar con Gemini");
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `⚠️ **Error de conexión:** \n\n${errorMsg}\n\n*Verifica que el secreto GEMINI_API_KEY esté correctamente configurado en Supabase Edge Functions.*` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full gap-4">
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="bg-violet-100 p-2 rounded-lg text-violet-600">
            <Bot size={24} />
        </div>
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                Consultor AI (Gemini 2.0 Flash)
            </h2>
            <p className="text-sm text-muted-foreground">
                Experto en operaciones y escalado con acceso a tus datos en tiempo real.
            </p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden bg-slate-50 border-slate-200 flex flex-col shadow-sm">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className={cn("h-8 w-8 mt-1", msg.role === "assistant" ? "bg-violet-600" : "bg-slate-900")}>
                    {msg.role === "assistant" ? (
                        <Bot className="text-white h-5 w-5" />
                    ) : (
                        <User className="text-white h-5 w-5" />
                    )}
                </Avatar>
                
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none",
                     msg.content.includes("Error de conexión") && msg.role === "assistant" ? "bg-red-50 text-red-800 border-red-200" : ""
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
               <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
                <Avatar className="h-8 w-8 mt-1 bg-violet-600">
                    <Bot className="text-white h-5 w-5" />
                </Avatar>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles size={14} className="animate-spin text-violet-500" /> 
                    Analizando datos con Gemini 2.0...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t mt-auto">
          <div className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre alumnos en riesgo, leads estancados o estrategias de venta..."
              className="min-h-[60px] max-h-[180px] bg-slate-50 border-slate-200 focus-visible:ring-violet-500 pr-12 resize-none py-3"
            />
            <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className={cn(
                    "absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full transition-all",
                    input.trim() ? "bg-violet-600 hover:bg-violet-700" : "bg-slate-200 text-slate-400"
                )}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <div className="text-[10px] text-center text-muted-foreground mt-2">
            Potenciado por Google Gemini 2.0 Flash. Acceso a datos en tiempo real.
          </div>
        </div>
      </Card>
    </div>
  );
};