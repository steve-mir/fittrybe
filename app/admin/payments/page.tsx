// app/admin/payments/page.tsx — Payments & Financials
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, StatCard
} from "@/components/admin/AdminUI";

type TxType = "deposit" | "refund" | "forfeit" | "payout" | "credit";

interface Transaction {
  id: string;
  user_id: string;
  session_id: string | null;
  type: TxType;
  amount_pence: number;
  created_at: string;
  user_name: string | null;
}

interface RefundEvent {
  id: string;
  session_id: string;
  user_id: string;
  amount_pence: number;
  status: "pending" | "processed" | "failed";
  created_at: string;
}

const TX_COLOR: Record<TxType, "green" | "red" | "yellow" | "blue" | "gray"> = {
  deposit: "green",
  refund: "red",
  forfeit: "yellow",
  payout: "blue",
  credit: "gray",
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<RefundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState<"transactions" | "refunds">("transactions");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [txRes, refundRes] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("id, user_id, session_id, type, amount_pence, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("refund_events")
        .select("id, session_id, user_id, amount_pence, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const txs = (txRes.data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      user_name: (t.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as Transaction[];

    setTransactions(txs);
    setRefunds(refundRes.data as RefundEvent[] ?? []);
    setLoading(false);
  }

  const totalRevenuePence = transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount_pence, 0);
  const totalRefundedPence = transactions.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount_pence, 0);
  const pendingRefunds = refunds.filter((r) => r.status === "pending").length;

  const filteredTx = typeFilter === "all" ? transactions : transactions.filter((t) => t.type === typeFilter);

  const TX_TYPES = ["all", "deposit", "refund", "forfeit", "payout", "credit"];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Payments & Financials" desc="Transaction ledger and host payout oversight." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`£${(totalRevenuePence / 100).toFixed(2)}`} accent />
        <StatCard label="Total Refunded" value={`£${(totalRefundedPence / 100).toFixed(2)}`} />
        <StatCard label="Pending Refunds" value={pendingRefunds} accent={pendingRefunds > 0} />
        <StatCard label="Transactions" value={transactions.length.toLocaleString()} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {(["transactions", "refunds"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-[family-name:var(--font-dm-sans)] transition-all ${
              tab === t
                ? "bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20"
                : "text-white/40 hover:text-white border border-white/8"
            }`}
          >
            {t === "transactions" ? "Transaction Log" : `Refund Queue ${pendingRefunds > 0 ? `(${pendingRefunds})` : ""}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "transactions" ? (
        <>
          <FilterBar>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={TX_TYPES.map((t) => ({ value: t, label: t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredTx.length} transactions
            </span>
          </FilterBar>
          <AdminTable
            headers={["User", "Type", "Amount", "Session", "Date"]}
            isEmpty={filteredTx.length === 0}
            empty="No transactions."
          >
            {filteredTx.map((tx, i) => (
              <Tr key={tx.id} last={i === filteredTx.length - 1}>
                <Td>{tx.user_name ?? <span className="text-white/30 font-mono text-xs">{tx.user_id.slice(0, 10)}…</span>}</Td>
                <Td><Badge label={tx.type} color={TX_COLOR[tx.type] ?? "gray"} /></Td>
                <Td>
                  <span className={tx.type === "deposit" ? "text-[#B6FF00]" : tx.type === "refund" ? "text-red-400" : "text-white/70"}>
                    £{(tx.amount_pence / 100).toFixed(2)}
                  </span>
                </Td>
                <Td mono dim>{tx.session_id ? tx.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td dim>{new Date(tx.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <AdminTable
          headers={["Refund ID", "Session", "User", "Amount", "Status", "Date"]}
          isEmpty={refunds.length === 0}
          empty="No refund events."
        >
          {refunds.map((r, i) => (
            <Tr key={r.id} last={i === refunds.length - 1}>
              <Td mono dim>{r.id.slice(0, 8)}…</Td>
              <Td mono dim>{r.session_id.slice(0, 8)}…</Td>
              <Td mono dim>{r.user_id.slice(0, 8)}…</Td>
              <Td><span className="text-red-400">£{(r.amount_pence / 100).toFixed(2)}</span></Td>
              <Td>
                <Badge
                  label={r.status}
                  color={r.status === "processed" ? "green" : r.status === "pending" ? "yellow" : "red"}
                />
              </Td>
              <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
