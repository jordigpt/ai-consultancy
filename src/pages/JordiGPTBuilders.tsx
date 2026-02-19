import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { CommunityAnnualMember, CommunitySource } from "@/lib/types";

// Modular Components
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityStats } from "@/components/community/CommunityStats";
import { MonthlyMembersCard } from "@/components/community/MonthlyMembersCard";
import { AnnualMembersCard } from "@/components/community/AnnualMembersCard";
import { EditMemberDialog } from "@/components/community/EditMemberDialog";

const MONTHLY_PRICE = 59;
const DEFAULT_ANNUAL_PRICE = 348;

const JordiGPTBuilders = () => {
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Data State
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [annualMembers, setAnnualMembers] = useState<CommunityAnnualMember[]>([]);
  
  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit State
  const [editingMember, setEditingMember] = useState<CommunityAnnualMember | null>(null);

  const fetchData = async () => {
      setErrorDetails(null);
      setLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // 1. Get Monthly Count from Settings
          try {
              const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*') 
                .eq('user_id', user.id)
                .maybeSingle();
            
              if (settingsError) {
                  console.error("Error fetching settings:", settingsError);
                  showError(`Error config: ${settingsError.message}`);
              } else if (settings) {
                  const count = (settings as any).community_monthly_count;
                  setMonthlyCount(count || 0);
              }
          } catch (e: any) {
              console.error("Excepción en settings:", e);
          }

          // 2. Get Annual Members
          try {
              const { data: members, error: membersError } = await supabase
                .from('community_annual_members')
                .select('*')
                .order('created_at', { ascending: false });

              if (membersError) {
                  console.error("Error fetching members:", membersError);
                  setErrorDetails(`Error DB: ${membersError.message} (Code: ${membersError.code})`);
                  showError(`Error al cargar miembros: ${membersError.message}`);
              } else {
                  setAnnualMembers(members.map((m: any) => ({
                      id: m.id,
                      fullName: m.full_name,
                      amountPaid: Number(m.amount_paid),
                      notes: m.notes,
                      source: m.source || 'Skool', // Default to Skool if null
                      createdAt: new Date(m.created_at)
                  })));
              }
          } catch (e: any) {
              console.error("Excepción en members:", e);
              setErrorDetails(`Excepción JS: ${e.message}`);
          }

      } catch (error: any) {
          console.error("Fetch Data Global Error:", error);
          setErrorDetails(`Error General: ${error.message}`);
          showError("Error crítico al cargar datos");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleUpdateMonthly = async () => {
      try {
          setIsSavingMonthly(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('user_settings')
            .upsert({ 
                user_id: user.id, 
                community_monthly_count: monthlyCount 
            }, { onConflict: 'user_id' });

          if (error) throw error;
          showSuccess("Contador mensual actualizado");
      } catch (error: any) {
          console.error(error);
          showError(`Error al guardar: ${error.message}`);
      } finally {
          setIsSavingMonthly(false);
      }
  };

  const handleAddAnnualMember = async (data: { name: string; amount: number; notes: string; source: CommunitySource }) => {
      if (!data.name.trim()) {
          showError("El nombre es requerido");
          return;
      }

      try {
          setIsSubmitting(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: newItem, error } = await supabase
            .from('community_annual_members')
            .insert({
                user_id: user.id,
                full_name: data.name,
                amount_paid: data.amount,
                notes: data.notes,
                source: data.source
            })
            .select()
            .single();

          if (error) throw error;

          const newMember: CommunityAnnualMember = {
              id: newItem.id,
              fullName: newItem.full_name,
              amountPaid: Number(newItem.amount_paid),
              notes: newItem.notes,
              source: newItem.source || 'Skool',
              createdAt: new Date(newItem.created_at)
          };

          setAnnualMembers([newMember, ...annualMembers]);
          showSuccess("Miembro agregado");
      } catch (error: any) {
          console.error(error);
          showError(`Error al agregar: ${error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleUpdateMember = async (id: string, data: { name: string; amount: number; notes: string; source: CommunitySource }) => {
      if (!data.name.trim()) return;

      try {
          setIsUpdating(true);
          const { error } = await supabase
            .from('community_annual_members')
            .update({
                full_name: data.name,
                amount_paid: data.amount,
                notes: data.notes,
                source: data.source
            })
            .eq('id', id);

          if (error) throw error;

          // Update local state
          const updatedMembers = annualMembers.map(m => 
              m.id === id 
                  ? { ...m, fullName: data.name, amountPaid: data.amount, notes: data.notes, source: data.source }
                  : m
          );
          setAnnualMembers(updatedMembers);
          setEditingMember(null);
          showSuccess("Miembro actualizado");
      } catch (error: any) {
          showError(`Error al actualizar: ${error.message}`);
      } finally {
          setIsUpdating(false);
      }
  };

  const handleDeleteMember = async (id: string) => {
      if (!confirm("¿Eliminar este miembro?")) return;

      try {
          const { error } = await supabase
            .from('community_annual_members')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setAnnualMembers(annualMembers.filter(m => m.id !== id));
          showSuccess("Miembro eliminado");
      } catch (error: any) {
          showError(`Error al eliminar: ${error.message}`);
      }
  };

  // Calculations
  const monthlyRevenue = monthlyCount * MONTHLY_PRICE;
  const annualRevenue = annualMembers.reduce((sum, m) => sum + m.amountPaid, 0);
  const totalCommunityRevenue = monthlyRevenue + annualRevenue;

  if (loading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        
        <CommunityHeader errorDetails={errorDetails} />

        <CommunityStats 
            totalRevenue={totalCommunityRevenue}
            monthlyRevenue={monthlyRevenue}
            monthlyCount={monthlyCount}
            monthlyPrice={MONTHLY_PRICE}
            annualRevenue={annualRevenue}
            annualCount={annualMembers.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 space-y-6">
                <MonthlyMembersCard 
                    count={monthlyCount}
                    price={MONTHLY_PRICE}
                    onCountChange={setMonthlyCount}
                    onSave={handleUpdateMonthly}
                    isSaving={isSavingMonthly}
                />
            </div>

            <div className="lg:col-span-2 space-y-6">
                 <AnnualMembersCard 
                    members={annualMembers}
                    onAddMember={handleAddAnnualMember}
                    onEditMember={setEditingMember}
                    onDeleteMember={handleDeleteMember}
                    isSubmitting={isSubmitting}
                    defaultPrice={DEFAULT_ANNUAL_PRICE}
                 />
            </div>
        </div>

        <EditMemberDialog 
            member={editingMember}
            isOpen={!!editingMember}
            onClose={() => setEditingMember(null)}
            onSave={handleUpdateMember}
            isUpdating={isUpdating}
        />
    </div>
  );
};

export default JordiGPTBuilders;