import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTheme = "blue" | "emerald" | "orange" | "indigo";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  badgeText?: string;
  theme: StatCardTheme;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  badgeText, 
  theme, 
  onClick, 
  children 
}: StatCardProps) => {
  
  const themeStyles = {
    blue: {
      card: "from-white to-blue-50/50 border-blue-100 hover:border-blue-300",
      icon: "bg-blue-100 text-blue-600",
      badge: "text-blue-600 bg-blue-50"
    },
    emerald: {
      card: "from-white to-emerald-50/50 border-emerald-100 hover:border-emerald-300",
      icon: "bg-emerald-100 text-emerald-600",
      badge: "text-emerald-600 bg-emerald-50"
    },
    orange: {
      card: "from-white to-orange-50/50 border-orange-100 hover:border-orange-300",
      icon: "bg-orange-100 text-orange-600",
      badge: "text-orange-600 bg-orange-50"
    },
    indigo: {
      card: "from-white to-indigo-50/50 border-indigo-100 hover:border-indigo-300",
      icon: "bg-indigo-100 text-indigo-600",
      badge: "text-muted-foreground" 
    }
  };

  const styles = themeStyles[theme];

  return (
    <Card 
      className={cn(
        "bg-gradient-to-br shadow-sm transition-all",
        styles.card,
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-1.5 rounded-md", styles.icon)}>
            <Icon size={14} />
          </div>
          {badgeText && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", styles.badge)}>
              {badgeText}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {children}
      </CardContent>
    </Card>
  );
};