import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
    { label: "15m", value: 15 * 60 },
    { label: "30m", value: 30 * 60 },
    { label: "1h", value: 60 * 60 },
    { label: "2h", value: 120 * 60 },
];

export const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(30 * 60);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleSelectPreset = (value: number) => {
      setDuration(value);
      setTimeLeft(value);
      setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-2xl shadow-xl w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 text-slate-400 mb-6 text-sm uppercase tracking-widest font-bold">
            <Timer size={16} /> Deep Focus
        </div>

        <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums mb-8">
            {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4 mb-8">
            <Button 
                size="lg" 
                className={cn(
                    "rounded-full w-16 h-16 shadow-lg transition-all active:scale-95",
                    isActive ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
                onClick={toggleTimer}
            >
                {isActive ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
            </Button>
            <Button 
                size="icon" 
                variant="outline" 
                className="rounded-full w-16 h-16 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                onClick={resetTimer}
            >
                <RotateCcw size={24} />
            </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full">
            {PRESETS.map(preset => (
                <button
                    key={preset.label}
                    onClick={() => handleSelectPreset(preset.value)}
                    className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                        duration === preset.value 
                            ? "bg-white text-slate-900 font-bold" 
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    )}
                >
                    {preset.label}
                </button>
            ))}
        </div>
    </div>
  );
};