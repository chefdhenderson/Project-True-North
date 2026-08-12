"use client";
import React from "react";
import { Info } from "lucide-react";

export function FlagBars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
      <span className="inline-block w-3.5 h-[3px] bg-red" />
      <span className="inline-block w-1.5 h-[3px] bg-line" />
      <span className="inline-block w-3.5 h-[3px] bg-red" />
    </div>
  );
}

export function CanadianFlag({ width = 96 }: { width?: number }) {
  const h = width / 2;
  return (
    <svg width={width} height={h} viewBox="0 0 100 50" role="img" aria-label="Canadian flag">
      <rect x="0" y="0" width="100" height="50" fill="#FFFFFF" />
      <rect x="0" y="0" width="25" height="50" fill="#D52B1E" />
      <rect x="75" y="0" width="25" height="50" fill="#D52B1E" />
      <path
        d="M50,8 L53,17 L61,13 L58,22 L67,24 L58,26 L61,35 L53,31 L50,42 L47,31 L39,35 L42,26 L33,24 L42,22 L39,13 L47,17 Z"
        fill="#D52B1E"
      />
      <rect x="49" y="42" width="2" height="5" fill="#D52B1E" />
    </svg>
  );
}

export function Gauge({ pct, size = 44 }: { pct: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E4E7" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D52B1E" strokeWidth={5}
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .5s ease" }}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fill="#1A1A1A" fontSize="11" fontFamily="'IBM Plex Mono', monospace">
        {Math.round(clamped)}
      </text>
    </svg>
  );
}

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  "On Track": { bg: "#EAF4EE", fg: "#1E7A46" },
  "At Risk": { bg: "#FBF1E1", fg: "#B4740E" },
  "Delayed": { bg: "#FBEAEA", fg: "#A61B1B" },
  "Done": { bg: "#E9EEF9", fg: "#2A4B8D" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["On Track"];
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-white ${className}`}>{children}</div>;
}

export function SectionLabel({ eyebrow, title, right, sub }: { eyebrow?: string; title: string; right?: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            <FlagBars />
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-red">{eyebrow}</span>
          </div>
        )}
        <h2 className="text-xl font-display font-semibold text-ink">{title}</h2>
        {sub && <p className="text-xs mt-1 text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Btn({
  children, onClick, variant = "ghost", className = "", type = "button", disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "solid" | "ghost" | "danger"; className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const base = "text-sm px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50";
  const styles: Record<string, string> = {
    solid: "bg-red text-white",
    ghost: "bg-transparent text-muted border border-line",
    danger: "bg-transparent text-danger border border-[#F1D3D3]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  const { mono, className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`bg-white border border-line rounded-lg px-2.5 py-1.5 text-sm outline-none w-full text-ink ${mono ? "font-mono" : ""} ${className}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea {...rest} className={`bg-white border border-line rounded-lg px-2.5 py-2 text-sm outline-none w-full resize-none text-ink ${className}`} />
  );
}

export function Select({
  value, onChange, options, className = "",
}: {
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select value={value} onChange={onChange} className={`bg-white border border-line rounded-lg px-2 py-1.5 text-sm outline-none w-full text-ink ${className}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-6 text-sm text-muted">
      <Info size={15} className="shrink-0 mt-0.5" /> <span>{text}</span>
    </div>
  );
}

export const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
export const fmtMoney = (v: any) => `$${num(v).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const fmtWeek = (iso: string) => { if (!iso) return "This week"; const d = new Date(iso); return d.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }); };

export function findCol(headers: string[], regex: RegExp) { return headers.find((h) => regex.test(h)) || null; }
export function aggregate(rows: Record<string, any>[], col: string | null, mode: "sum" | "avg" | "latest") {
  if (!col) return 0;
  const vals = rows.map((r) => num(r[col]));
  if (mode === "avg") return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  if (mode === "latest") return vals.length ? vals[vals.length - 1] : 0;
  return vals.reduce((a, b) => a + b, 0);
}
