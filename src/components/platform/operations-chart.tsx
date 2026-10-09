"use client";

import { useState } from "react";
import { AreaChart } from "./charts";

export function OperationsChart({ dates, series }: { dates: string[]; series: { label: string; values: number[] }[] }) {
  const [selected, setSelected] = useState(0);
  const current = series[selected] ?? series[0];
  if (!current) return <p className="oc-note">No observations yet.</p>;
  return <div>
    <div className="oc-chart-tabs" aria-label="Chart measure">
      {series.map((s, i) => <button type="button" key={s.label} aria-pressed={selected === i} onClick={() => setSelected(i)}><span>{s.label}</span><strong>{s.values.reduce((a,b) => a+b,0).toLocaleString()}</strong></button>)}
    </div>
    <AreaChart dates={dates} points={current.values} label={current.label} height={280} />
    <details className="mt-4"><summary className="oc-note cursor-pointer">View daily values</summary><div className="pf-table-wrap"><table className="pf-table"><thead><tr><th>Date (UTC)</th>{series.map(s => <th key={s.label}>{s.label}</th>)}</tr></thead><tbody>{dates.map((date,i)=><tr key={date}><td>{date}</td>{series.map(s=><td key={s.label}>{s.values[i] ?? 0}</td>)}</tr>)}</tbody></table></div></details>
  </div>;
}
