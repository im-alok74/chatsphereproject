import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Check, Receipt, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface BillSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  members: Tables<"profiles">[];
}

interface BillWithShares extends Tables<"bill_splits"> {
  shares: (Tables<"bill_split_shares"> & { profile?: Tables<"profiles"> })[];
}

export function BillSplitDialog({ open, onOpenChange, chatId, members }: BillSplitDialogProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"list" | "create">("list");
  const [bills, setBills] = useState<BillWithShares[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    const { data: billsData } = await supabase
      .from("bill_splits")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });

    if (!billsData) { setBills([]); setLoading(false); return; }

    const enriched: BillWithShares[] = [];
    for (const bill of billsData) {
      const { data: shares } = await supabase
        .from("bill_split_shares")
        .select("*")
        .eq("bill_id", bill.id);

      const sharesWithProfiles = (shares ?? []).map((s) => ({
        ...s,
        profile: members.find((m) => m.user_id === s.user_id),
      }));

      enriched.push({ ...bill, shares: sharesWithProfiles });
    }
    setBills(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchBills();
      setTab("list");
    }
  }, [open, chatId]);

  const handleCreate = async () => {
    if (!title.trim() || !amount || !user) return;
    setCreating(true);

    const totalAmount = parseFloat(amount);
    const perPerson = Math.round((totalAmount / members.length) * 100) / 100;

    const { data: bill } = await supabase
      .from("bill_splits")
      .insert({
        chat_id: chatId,
        created_by: user.id,
        title: title.trim(),
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (bill) {
      await supabase.from("bill_split_shares").insert(
        members.map((m) => ({
          bill_id: bill.id,
          user_id: m.user_id,
          amount: perPerson,
          paid: m.user_id === user.id, // Creator auto-paid
          paid_at: m.user_id === user.id ? new Date().toISOString() : null,
        }))
      );
    }

    setTitle("");
    setAmount("");
    setCreating(false);
    setTab("list");
    fetchBills();
  };

  const handleMarkPaid = async (shareId: string) => {
    await supabase
      .from("bill_split_shares")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", shareId);
    fetchBills();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Split the Bill
          </DialogTitle>
        </DialogHeader>

        {/* Tab buttons */}
        <div className="flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setTab("list")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${tab === "list" ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Active Bills
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${tab === "create" ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            New Bill
          </button>
        </div>

        {tab === "create" ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What's it for?</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dinner, Uber, Movie tickets"
                className="h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-xl border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">
                Split equally among <strong className="text-foreground">{members.length} members</strong>
                {amount && parseFloat(amount) > 0 && (
                  <> — <strong className="text-primary">${(parseFloat(amount) / members.length).toFixed(2)}</strong>/person</>
                )}
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim() || !amount}
              className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ background: "var(--gradient-brand)" }}
            >
              {creating ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create & split"}
            </button>
          </div>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto pt-1">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : bills.length === 0 ? (
              <div className="py-8 text-center">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No bills yet</p>
              </div>
            ) : (
              bills.map((bill) => {
                const paidCount = bill.shares.filter((s) => s.paid).length;
                const allPaid = paidCount === bill.shares.length;
                return (
                  <div key={bill.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{bill.title}</h4>
                      <span className={`text-xs font-bold ${allPaid ? "text-bill-green" : "text-bill-orange"}`}>
                        ${Number(bill.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{paidCount}/{bill.shares.length} paid</p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(paidCount / bill.shares.length) * 100}%`,
                          background: allPaid ? "hsl(var(--bill-green))" : "hsl(var(--bill-orange))",
                        }}
                      />
                    </div>
                    {/* Shares */}
                    <div className="mt-2 space-y-1">
                      {bill.shares.map((share) => (
                        <div key={share.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={share.profile?.avatar_url ?? undefined} />
                              <AvatarFallback className="bg-accent text-[8px]">
                                {(share.profile?.username ?? "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{share.profile?.username ?? "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">${Number(share.amount).toFixed(2)}</span>
                            {share.paid ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium text-bill-green">
                                <Check className="h-3 w-3" /> Paid
                              </span>
                            ) : share.user_id === user?.id ? (
                              <button
                                onClick={() => handleMarkPaid(share.id)}
                                className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/30"
                              >
                                Mark paid
                              </button>
                            ) : (
                              <span className="text-[10px] text-bill-orange">Pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
