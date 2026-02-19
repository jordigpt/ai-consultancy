import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Save, Loader2 } from "lucide-react";

interface MonthlyMembersCardProps {
  count: number;
  price: number;
  onCountChange: (count: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const MonthlyMembersCard = ({
  count,
  price,
  onCountChange,
  onSave,
  isSaving
}: MonthlyMembersCardProps) => {
  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users size={18} className="text-blue-600" /> Miembros Mensuales
        </CardTitle>
        <CardDescription>
          Tracking por cantidad (Bulk). Precio fijo: ${price}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad de Miembros Activos</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={count}
              onChange={(e) => onCountChange(parseInt(e.target.value) || 0)}
              className="text-lg font-bold bg-white"
            />
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            </Button>
          </div>
        </div>
        <div className="p-3 bg-blue-100/50 rounded-lg text-sm text-blue-800 flex justify-between items-center font-medium">
          <span>Ingreso Mensual Estimado:</span>
          <span>${(count * price).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};