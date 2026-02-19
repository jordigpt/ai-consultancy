import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, School, Wallet } from "lucide-react";
import { CommunityAnnualMember, CommunitySource } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EditMemberDialogProps {
  member: CommunityAnnualMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; amount: number; notes: string; source: CommunitySource }) => Promise<void>;
  isUpdating: boolean;
}

export const EditMemberDialog = ({
  member,
  isOpen,
  onClose,
  onSave,
  isUpdating,
}: EditMemberDialogProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<CommunitySource>("Skool");

  useEffect(() => {
    if (member) {
      setName(member.fullName);
      setAmount(member.amountPaid.toString());
      setNotes(member.notes || "");
      setSource(member.source);
    }
  }, [member]);

  const handleSave = () => {
    if (!member) return;
    onSave(member.id, {
      name,
      amount: parseFloat(amount) || 0,
      notes,
      source,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fuente de Ingreso</Label>
            <Select value={source} onValueChange={(val) => setSource(val as CommunitySource)}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Monto Pagado ($)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};