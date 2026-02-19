import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";

interface CommunityStatsProps {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyCount: number;
  monthlyPrice: number;
  annualRevenue: number;
  annualCount: number;
}

export const CommunityStats = ({
  totalRevenue,
  monthlyRevenue,
  monthlyCount,
  monthlyPrice,
  annualRevenue,
  annualCount,
}: CommunityStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-slate-900 text-white border-none shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-slate-300">Facturación Total Comunidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">${totalRevenue.toLocaleString()}</div>
          <p className="text-sm text-slate-400 mt-1">Acumulado Mensual + Anual</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recurrente Mensual</CardTitle>
          <Users className="text-blue-500 h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthlyCount} miembros x ${monthlyPrice}/mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Membresías Anuales</CardTitle>
          <Crown className="text-yellow-500 h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${annualRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {annualCount} miembros registrados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};