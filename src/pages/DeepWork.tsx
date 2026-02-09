import React from "react";
import { PomodoroTimer } from "../components/deep-work/PomodoroTimer";
import { DeepWorkCanvas } from "../components/deep-work/DeepWorkCanvas";

const DeepWork = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deep Work Zone</h1>
            <p className="text-muted-foreground">Elimina distracciones. Define tus tareas. Ejecuta.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 sticky top-8">
                <PomodoroTimer />
                
                <div className="mt-6 p-4 bg-white rounded-xl border text-sm text-slate-600 space-y-2 shadow-sm">
                    <h4 className="font-semibold text-slate-900">Modo Monje 🧘‍♂️</h4>
                    <p>
                        Usa este espacio para volcar todo lo que tienes en la cabeza. 
                        Pega una lista desde cualquier lado y se transformará en checkboxes automáticamente.
                    </p>
                </div>
            </div>

            <div className="lg:col-span-2">
                <DeepWorkCanvas />
            </div>
        </div>
    </div>
  );
};

export default DeepWork;