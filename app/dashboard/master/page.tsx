"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, EmptyState, SectionLabel, aggregate, findCol, fmtMoney, num } from "@/components/ui";
import { Upload } from "@/types";

export default function MasterDashboardPage() {
  const [latest, setLatest] = useState<Upload | null>(null);
  const [npsTarget, setNpsTarget] = useState("70");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: uploadRows }, { data: targetRow }] = await Promise.all([
      supabase.from("uploads").select("*").eq("tag", "master").order("created_at", { ascending: false }).limit(1),
      supabase.from("master_targets").select("*").eq("id", 1).single(),
    ]);
    setLatest(uploadRows && uploadRows[0] ? uploadRows[0] : null);
    if (targetRow) setNpsTarget(targetRow.nps_target || "70");
    setLoaded(true);
  }

  const saveTarget = async (v: string) => {
    setNpsTarget(v);
    await supabase.from("master_targets").update({ nps_target: v }).eq("id", 1);
  };

  if (!loaded) return null;

  if (!latest || !latest.headers || !latest.rows) {
    return (
      <div className="space-y-6">
        <SectionLabel eyebrow="Canada Business Unit" title="Master Dashboard" />
        <Card><EmptyState text='No sales report uploaded yet. Go to Admin and upload a CSV/XLSX tagged "Master Dashboard" — category, sales, comp %, margin %, NPS, and transaction comp columns will populate here automatically.' /></Card>
      </div>
    );
  }

  const { headers, rows } = latest;
  const categoryCol = findCol(headers, /categ/i);
  const salesCol = findCol(headers, /sales/i);
  const compCol = findCol(headers, /comp/i);
  const marginCol = findCol(headers, /margin/i);
  const npsCol = findCol(headers, /nps/i);
  const txnCol = findCol(headers, /trans/i);
  const periodCol = findCol(headers, /period/i);

  const recognized = Boolean(categoryCol && salesCol);
  const totalSales = salesCol ? aggregate(rows, salesCol, "sum") : 0;
  const avgMargin = marginCol ? aggregate(rows, marginCol, "avg") : 0;
  const nps = npsCol ? aggregate(rows, npsCol, "latest") : null;
  const txnComp = txnCol ? aggregate(rows, txnCol, "avg") : null;

  return (
    <div className="space-y-6">
      <SectionLabel eyebrow="Canada Business Unit" title="Master Dashboard"
        sub={`Live from ${latest.filename} · uploaded ${latest.created_at.slice(0, 10)}${latest.uploaded_by ? ` by ${latest.uploaded_by}` : ""}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total sales" value={fmtMoney(totalSales)} />
        <Stat label="Avg margin %" value={`${avgMargin.toFixed(1)}%`} />
        <Stat label="NPS" value={nps !== null ? nps.toFixed(0) : "—"} targetValue={npsTarget} onTarget={saveTarget} />
        <Stat label="Transaction comp" value={txnComp !== null ? `${txnComp >= 0 ? "+" : ""}${txnComp.toFixed(1)}%` : "—"} />
      </div>

      {!recognized && (
        <Card className="p-4">
          <EmptyState text={`Couldn't recognize category/sales columns in "${latest.filename}". Showing the raw upload below — rename headers to include "category" and "sales" (and optionally "comp", "margin", "NPS", "trans...") to auto-build the table.`} />
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-muted bg-cloud">
              {recognized ? (
                <>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Category</th>
                  {periodCol && <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Period</th>}
                  <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Sales</th>
                  {compCol && <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Sales comp %</th>}
                  {marginCol && <th className="px-3 py-3 font-medium text-xs uppercase tracking-wide">Margin %</th>}
                </>
              ) : headers.map((h) => <th key={h} className="px-3 py-3 font-medium text-xs uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {recognized ? (
                  <>
                    <td className="px-4 py-2.5 text-ink">{r[categoryCol as string]}</td>
                    {periodCol && <td className="px-3 py-2.5 font-mono text-muted">{r[periodCol]}</td>}
                    <td className="px-3 py-2.5 font-mono text-ink">{fmtMoney(r[salesCol as string])}</td>
                    {compCol && <td className={`px-3 py-2.5 font-mono ${num(r[compCol]) >= 0 ? "text-success" : "text-danger"}`}>{num(r[compCol]) >= 0 ? "+" : ""}{num(r[compCol]).toFixed(1)}%</td>}
                    {marginCol && <td className="px-3 py-2.5 font-mono text-ink">{num(r[marginCol]).toFixed(1)}%</td>}
                  </>
                ) : headers.map((h) => <td key={h} className="px-3 py-2.5 font-mono text-ink">{String(r[h] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, targetValue, onTarget }: { label: string; value: string; sub?: string; targetValue?: string; onTarget?: (v: string) => void }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide font-mono mb-2 text-muted">{label}</div>
      <div className="text-2xl font-mono font-semibold text-red">{value}</div>
      {onTarget ? (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted">
          target <input value={targetValue} onChange={(e) => onTarget(e.target.value)} placeholder="—" className="bg-transparent outline-none w-10 font-mono text-muted" />
        </div>
      ) : sub ? <div className="text-xs mt-1 text-muted">{sub}</div> : null}
    </Card>
  );
}
