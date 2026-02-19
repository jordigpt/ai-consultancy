import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, Plus, Trash2, Pencil, Loader2, School, Wallet } from "lucide-react";
import { CommunityAnnualMember, CommunitySource } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnualMembersCardProps {
  members: CommunityAnnualMember[];
  onAddMember: (data: { name: string; amount: number; notes: string; source: CommunitySource }) => Promise<void>;
  onEditMember: (member: CommunityAnnualMember) => void;
  onDeleteMember: (id: string) => Promise<void>;
  isSubmitting: boolean;
  defaultPrice: number;
}

export const AnnualMembersCard = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  isSubmitting,
  defaultPrice
}: AnnualMembersCardProps) => {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(defaultPrice.toString());
  const [newNotes, setNewNotes] = useState("");
  const [newSource, setNewSource] = useState<CommunitySource>("Skool");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAddMember({
        name: newName,
        amount: parseFloat(newAmount) || 0,
        notes: newNotes,
        source: newSource
    });
    setNewName("");
    setNewAmount(defaultPrice.toString());
    setNewNotes("");
    setNewSource("Skool");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown size={18} className="text-yellow-500" /> Miembros Anuales
        </CardTitle>
        <CardDescription>
          Registro individual. Tracking detallado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-50 p-4 rounded-xl border">
          <div className="space-y-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Fuente</label>
            <Select value={newSource} onValueChange={(val) => setNewSource(val as CommunitySource)}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Skool">
                  <div className="flex items-center gap-2"><School size={14} className="text-blue-500"/> Skool</div>
                </SelectItem>
                <SelectItem value="Binance">
                  <div className="flex items-center gap-2"><Wallet size={14} className="text-orange-500"/> Binance</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Nombre y Apellido</label>
            <Input
              placeholder="Ej. Pedro Gomez"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Monto ($)</label>
            <Input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2 sm:col-span-4">
            <label className="text-xs font-medium text-muted-foreground">Notas (Opcional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Detalles..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-white"
              />
              <Button onClick={handleAdd} disabled={isSubmitting} className="shrink-0">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Fuente</TableHead>
                <TableHead>Miembro</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay miembros anuales registrados.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.source === 'Binance' ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Binance</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Skool</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm sm:text-base">{member.fullName}</div>
                      {member.notes && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{member.notes}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                      {format(member.createdAt, "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">
                        ${member.amountPaid}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => onEditMember(member)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteMember(member.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};