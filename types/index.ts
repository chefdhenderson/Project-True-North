export type FocusId = "assortment" | "margin" | "fefo" | "pricing" | "sws" | "commercial" | "pnl";

export interface FocusMeta {
  id: FocusId;
  n: string;
  label: string;
}

export const FOCUS_META: FocusMeta[] = [
  { id: "assortment", n: "01", label: "Assortment" },
  { id: "margin", n: "02", label: "Margin" },
  { id: "fefo", n: "03", label: "FEFO" },
  { id: "pricing", n: "04", label: "Pricing Index" },
  { id: "sws", n: "05", label: "Store-within-Store" },
  { id: "commercial", n: "06", label: "Commercial" },
  { id: "pnl", n: "07", label: "P&L" },
];

export const TAG_OPTIONS = [
  { id: "master", label: "Master Dashboard" },
  { id: "exec", label: "Executive Summary" },
  ...FOCUS_META.map((f) => ({ id: f.id, label: f.label })),
];

export interface Upload {
  id: string;
  tag: string;
  filename: string | null;
  uploaded_by: string | null;
  summary: string | null;
  headers: string[] | null;
  rows: Record<string, any>[] | null;
  row_count: number | null;
  created_at: string;
}

export interface Kpi {
  id: string;
  focus_id: FocusId;
  label: string;
  target: string;
  column_name: string;
  agg: "sum" | "avg" | "latest";
  sort_order: number;
}

export interface Deliverable {
  id: string;
  focus_id: FocusId;
  title: string;
  milestone: string;
  owner: string;
  due: string | null;
  status: "On Track" | "At Risk" | "Delayed" | "Done";
}

export interface Commentary {
  id: string;
  focus_id: FocusId;
  author: string;
  note_date: string;
  text: string;
  created_at: string;
}
