"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Count } from "@/lib/reporting";

export function ResearchChart({ title, data, timeline = false }: { title: string; data: Count[]; timeline?: boolean }) {
  const height = Math.max(180, data.length * 36 + 42);
  const hasValues = data.some(item => item.count > 0);
  return <section className="surface chart-card">
    <h3>{title}</h3>
    {hasValues ? <>
      <div>
        {timeline ? <ResponsiveContainer width="100%" height={225} minWidth={0}><LineChart data={data} margin={{ left: -12, right: 16, top: 9, bottom: 6 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} minTickGap={15} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
          <Tooltip itemStyle={{ color: "var(--ink)" }} contentStyle={{ background: "var(--burgundy-deep)", borderColor: "var(--line)", color: "var(--ink)" }} /><Line dataKey="count" name="Submissions" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </LineChart></ResponsiveContainer>
          : <ResponsiveContainer width="100%" height={height} minWidth={0}><BarChart data={data} layout="vertical" margin={{ left: 0, right: 19, top: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
            <YAxis type="category" dataKey="name" width={140} tickMargin={6} tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={name => name.length > 23 ? `${name.slice(0, 21)}…` : name} />
            <Tooltip itemStyle={{ color: "var(--ink)" }} contentStyle={{ background: "var(--burgundy-deep)", borderColor: "var(--line)", color: "var(--ink)" }} /><Bar dataKey="count" name="Responses" fill="var(--copper-button)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
          </BarChart></ResponsiveContainer>}
      </div>
      <details className="small"><summary className="cursor-pointer">View chart data</summary><table><thead><tr><th scope="col">{timeline ? "Period" : "Response"}</th><th scope="col">Count</th></tr></thead><tbody>{data.map(({ name, count }) => <tr key={name}><td>{name}</td><td>{count}</td></tr>)}</tbody></table></details>
    </> : <p>No responses for this view.</p>}
  </section>;
}
