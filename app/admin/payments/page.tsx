// app/admin/payments/page.tsx — Payments & Financials
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select,
  StatCard, Tabs, ActionButton, SectionNote,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type TabKey = "wallet" | "payments" | "refunds" | "payouts" | "settlements";

interface WalletTx {
  id: string;
  user_id: string;
  session_id: string | null;
  type: string;
  amount_pence: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  user_name: string | null;
}

interface PaymentRow {
  id: string;
  user_id: string;
  session_id: string | null;
  stripe_payment_id: string;
  amount_pence: number;
  currency: string;
  status: string;
  refund_id: string | null;
  refunded_at: string | null;
  created_at: string;
}

interface RefundEvent {
  id: string;
  session_id: string | null;
  user_id: string | null;
  amount_pence: number;
  status: string;
  approval_status: string;
  reason: string | null;
  full_refund: boolean;
  auto_approved: boolean;
  host_id: string | null;
  player_name: string | null;
  session_title: string | null;
  created_at: string;
  approved_at: string | null;
  approval_note: string | null;
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount_pence: number;
  status: string;
  stripe_payout_id: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Settlement {
  id: string;
  session_id: string;
  participant_id: string | null;
  settlement_type: string;
  amount_pence: number;
  recipient_id: string | null;
  status: string;
  stripe_transfer_id: string | null;
  created_at: string;
  processed_at: string | null;
}

function txTypeColor(type: string): BadgeColor {
  if (type === "deposit") return "green";
  if (type === "refund") return "red";
  if (type === "payout") return "blue";
  if (type === "forfeit") return "yellow";
  return "gray";
}

function statusColor(s: string): BadgeColor {
  const lower = s.toLowerCase();
  if (["processed", "succeeded", "paid", "approved", "sent"].includes(lower)) return "green";
  if (["pending", "processing", "queued"].includes(lower)) return "yellow";
  if (["failed", "rejected", "cancelled"].includes(lower)) return "red";
  return "gray";
}

export default function PaymentsPage() {
  const [tab, setTab] = useState<TabKey>("wallet");
  const [wallet, setWallet] = useState<WalletTx[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [refunds, setRefunds] = useState<RefundEvent[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [refundStatusFilter, setRefundStatusFilter] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [wRes, pRes, rRes, poRes, sRes] = await Promise.all([
      supabase.from("wallet_transactions")
        .select("id, user_id, session_id, type, amount_pence, balance_after, description, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("refund_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("event_settlements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    setWallet((wRes.data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      user_name: (t.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as WalletTx[]);
    setPayments((pRes.data as PaymentRow[]) ?? []);
    setRefunds((rRes.data as RefundEvent[]) ?? []);
    setPayouts((poRes.data as PayoutRequest[]) ?? []);
    setSettlements((sRes.data as Settlement[]) ?? []);
    setLoading(false);
  }

  async function approveRefund(r: RefundEvent) {
    const note = window.prompt("Approval note (optional):", "Approved by admin");
    setActionId(r.id);
    await supabase.from("refund_events").update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approval_note: note || null,
    }).eq("id", r.id);
    setRefunds((prev) => prev.map((x) => x.id === r.id ? { ...x, approval_status: "approved", approved_at: new Date().toISOString(), approval_note: note || null } : x));
    setActionId(null);
  }

  async function rejectRefund(r: RefundEvent) {
    const note = window.prompt("Rejection reason:", "Outside policy");
    if (note == null) return;
    setActionId(r.id);
    await supabase.from("refund_events").update({
      approval_status: "rejected",
      approved_at: new Date().toISOString(),
      approval_note: note,
    }).eq("id", r.id);
    setRefunds((prev) => prev.map((x) => x.id === r.id ? { ...x, approval_status: "rejected", approved_at: new Date().toISOString(), approval_note: note } : x));
    setActionId(null);
  }

  // Aggregates
  const totalRevenuePence = wallet.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount_pence, 0);
  const totalRefundedPence = wallet.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount_pence, 0);
  const pendingRefundsCount = refunds.filter((r) => r.approval_status === "pending").length;
  const pendingPayoutsCount = payouts.filter((p) => p.status === "pending").length;

  const filteredWallet = txTypeFilter === "all" ? wallet : wallet.filter((t) => t.type === txTypeFilter);
  const txTypes = Array.from(new Set(wallet.map((w) => w.type))).sort();

  const filteredRefunds = refundStatusFilter === "all" ? refunds : refunds.filter((r) => r.approval_status === refundStatusFilter);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Payments & Financials" desc="Full financial oversight — ledger, Stripe payments, refunds, payouts, settlements." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`£${(totalRevenuePence / 100).toFixed(2)}`} accent />
        <StatCard label="Total Refunded" value={`£${(totalRefundedPence / 100).toFixed(2)}`} />
        <StatCard label="Pending Refunds" value={pendingRefundsCount} accent={pendingRefundsCount > 0} />
        <StatCard label="Pending Payouts" value={pendingPayoutsCount} accent={pendingPayoutsCount > 0} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "wallet", label: `Wallet Ledger (${wallet.length})` },
          { key: "payments", label: `Stripe Payments (${payments.length})` },
          { key: "refunds", label: `Refunds${pendingRefundsCount > 0 ? ` (${pendingRefundsCount} pending)` : ""}` },
          { key: "payouts", label: `Payouts${pendingPayoutsCount > 0 ? ` (${pendingPayoutsCount} pending)` : ""}` },
          { key: "settlements", label: `Settlements (${settlements.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "wallet" ? (
        <>
          <FilterBar>
            <Select
              value={txTypeFilter}
              onChange={setTxTypeFilter}
              options={[{ value: "all", label: "All Types" }, ...txTypes.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredWallet.length} entries
            </span>
          </FilterBar>
          <AdminTable
            headers={["User", "Type", "Amount", "Balance After", "Description", "Session", "Date"]}
            isEmpty={filteredWallet.length === 0}
            empty="No transactions."
          >
            {filteredWallet.map((tx, i) => (
              <Tr key={tx.id} last={i === filteredWallet.length - 1}>
                <Td>{tx.user_name ?? <span className="text-white/30 font-mono text-xs">{tx.user_id.slice(0, 10)}…</span>}</Td>
                <Td><Badge label={tx.type} color={txTypeColor(tx.type)} /></Td>
                <Td>
                  <span className={tx.type === "deposit" ? "text-[#B6FF00]" : tx.type === "refund" ? "text-red-400" : "text-white/70"}>
                    £{(tx.amount_pence / 100).toFixed(2)}
                  </span>
                </Td>
                <Td dim>£{(tx.balance_after / 100).toFixed(2)}</Td>
                <Td dim><span className="line-clamp-1 max-w-[220px] block">{tx.description ?? "—"}</span></Td>
                <Td mono dim>{tx.session_id ? tx.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td dim>{new Date(tx.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "payments" ? (
        <AdminTable
          headers={["Stripe ID", "User", "Session", "Amount", "Status", "Refund", "Date"]}
          isEmpty={payments.length === 0}
          empty="No Stripe payments."
        >
          {payments.map((p, i) => (
            <Tr key={p.id} last={i === payments.length - 1}>
              <Td mono dim>{p.stripe_payment_id.slice(0, 14)}…</Td>
              <Td mono dim>{p.user_id.slice(0, 8)}…</Td>
              <Td mono dim>{p.session_id ? p.session_id.slice(0, 8) + "…" : "—"}</Td>
              <Td>£{(p.amount_pence / 100).toFixed(2)} {p.currency.toUpperCase()}</Td>
              <Td><Badge label={p.status} color={statusColor(p.status)} /></Td>
              <Td dim>{p.refund_id ? `Refunded ${p.refunded_at ? new Date(p.refunded_at).toLocaleDateString("en-GB") : ""}` : "—"}</Td>
              <Td dim>{new Date(p.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "refunds" ? (
        <>
          <FilterBar>
            <Select
              value={refundStatusFilter}
              onChange={setRefundStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredRefunds.length} events</span>
          </FilterBar>
          <AdminTable
            headers={["Player", "Session", "Amount", "Type", "Approval", "Reason", "Date", ""]}
            isEmpty={filteredRefunds.length === 0}
            empty="No refunds."
          >
            {filteredRefunds.map((r, i) => (
              <Tr key={r.id} last={i === filteredRefunds.length - 1}>
                <Td>{r.player_name ?? <span className="font-mono text-xs text-white/30">{r.user_id?.slice(0, 10) ?? "—"}…</span>}</Td>
                <Td dim><span className="line-clamp-1 max-w-[180px] block">{r.session_title ?? (r.session_id ? r.session_id.slice(0, 8) + "…" : "—")}</span></Td>
                <Td><span className="text-red-400">£{(r.amount_pence / 100).toFixed(2)}</span></Td>
                <Td><Badge label={r.full_refund ? "Full" : "Partial"} color={r.full_refund ? "red" : "yellow"} /></Td>
                <Td>
                  <Badge label={r.approval_status} color={statusColor(r.approval_status)} />
                  {r.auto_approved && <span className="text-xs text-white/30 ml-1">(auto)</span>}
                </Td>
                <Td dim><span className="line-clamp-1 max-w-[180px] block">{r.reason ?? "—"}</span></Td>
                <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  {r.approval_status === "pending" && (
                    <div className="flex items-center gap-3 justify-end">
                      <ActionButton onClick={() => approveRefund(r)} label={actionId === r.id ? "…" : "Approve"} variant="primary" />
                      <ActionButton onClick={() => rejectRefund(r)} label="Reject" variant="danger" />
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "payouts" ? (
        <>
          <SectionNote>
            Host payout requests flow through Stripe Connect. Failed payouts show an error message for investigation.
          </SectionNote>
          <AdminTable
            headers={["User", "Amount", "Status", "Stripe Payout", "Requested", "Processed", "Error"]}
            isEmpty={payouts.length === 0}
            empty="No payout requests."
          >
            {payouts.map((p, i) => (
              <Tr key={p.id} last={i === payouts.length - 1}>
                <Td mono dim>{p.user_id.slice(0, 10)}…</Td>
                <Td><span className="text-[#B6FF00]">£{(p.amount_pence / 100).toFixed(2)}</span></Td>
                <Td><Badge label={p.status} color={statusColor(p.status)} /></Td>
                <Td mono dim>{p.stripe_payout_id ? p.stripe_payout_id.slice(0, 14) + "…" : "—"}</Td>
                <Td dim>{new Date(p.created_at).toLocaleDateString("en-GB")}</Td>
                <Td dim>{p.processed_at ? new Date(p.processed_at).toLocaleDateString("en-GB") : "—"}</Td>
                <Td dim><span className="line-clamp-1 max-w-[220px] block text-red-400/70">{p.error_message ?? "—"}</span></Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <>
          <SectionNote>
            Event settlements track Stripe Connect transfers (host earnings, platform fees, split venue costs).
          </SectionNote>
          <AdminTable
            headers={["Session", "Type", "Amount", "Recipient", "Status", "Transfer ID", "Created"]}
            isEmpty={settlements.length === 0}
            empty="No settlements."
          >
            {settlements.map((s, i) => (
              <Tr key={s.id} last={i === settlements.length - 1}>
                <Td mono dim>{s.session_id.slice(0, 8)}…</Td>
                <Td><Badge label={s.settlement_type} color="blue" /></Td>
                <Td>£{(s.amount_pence / 100).toFixed(2)}</Td>
                <Td mono dim>{s.recipient_id ? s.recipient_id.slice(0, 10) + "…" : "—"}</Td>
                <Td><Badge label={s.status} color={statusColor(s.status)} /></Td>
                <Td mono dim>{s.stripe_transfer_id ? s.stripe_transfer_id.slice(0, 14) + "…" : "—"}</Td>
                <Td dim>{new Date(s.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      )}
    </div>
  );
}
