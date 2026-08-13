"use client";

import { useState } from "react";
import { supabase, CAPITAL_TABLE } from "@/lib/supabase";
import { useCapitalData } from "@/lib/useCapitalData";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";
import SetupCapitalForm from "@/components/accounts/SetupCapitalForm";
import CapitalOverview from "@/components/accounts/CapitalOverview";
import EquityCurveChart from "@/components/accounts/EquityCurveChart";
import TransactionForm from "@/components/accounts/TransactionForm";
import TransactionLedger from "@/components/accounts/TransactionLedger";
import EditTransactionModal from "@/components/accounts/EditTransactionModal";
import DeleteTransactionConfirm from "@/components/accounts/DeleteTransactionConfirm";

export default function AccountsPage() {
  const toast = useToast();
  const capital = useCapitalData();
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleEditSave(payload) {
    try {
      const { id, ...rest } = payload;
      const { error } = await supabase.from(CAPITAL_TABLE).update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      toast.success("Transaction updated");
      setEditingTx(null);
      capital.refetch();
    } catch (err) {
      toast.error("Could not update transaction. Please try again.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTx || deletingTx.type === "initial_capital") return;
    setDeleting(true);
    try {
      const { error } = await supabase.from(CAPITAL_TABLE).delete().eq("id", deletingTx.id);
      if (error) throw new Error(error.message);
      toast.success("Transaction deleted");
      setDeletingTx(null);
      capital.refetch();
    } catch (err) {
      toast.error("Could not delete transaction. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (capital.loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!capital.hasStartingCapital) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-h1 text-text-primary">Accounts</h1>
        <SetupCapitalForm onSaved={capital.refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="text-h1 text-text-primary">Accounts</h1>

      <CapitalOverview metrics={capital} />

      <div className="card">
        <h3 className="text-h3 text-text-primary mb-1">Account Value Over Time</h3>
        <EquityCurveChart data={capital.equityCurve} />
      </div>

      <TransactionForm onSaved={capital.refetch} />

      <TransactionLedger
        transactions={capital.transactions}
        netPnlByDate={capital.netPnlByDate}
        onEdit={setEditingTx}
        onDelete={setDeletingTx}
      />

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleEditSave}
        />
      )}

      {deletingTx && (
        <DeleteTransactionConfirm
          deleting={deleting}
          onCancel={() => setDeletingTx(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
