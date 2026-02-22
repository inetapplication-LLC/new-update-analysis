"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { SourceCount } from "@/lib/queries";
import { getSourceColor } from "@/lib/constants";

interface SourcePieChartProps {
  data: SourceCount[];
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { source, count } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{source}</p>
      <p className="data-value text-lg font-bold" style={{ color: getSourceColor(source) }}>
        {count}
      </p>
    </div>
  );
}

// Custom label rendered outside the donut
function renderLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  source,
  count,
  percent,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  if (percent < 0.04) return null; // skip tiny slices
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="data-value"
      style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
    >
      {source} ({count})
    </text>
  );
}

export function SourcePieChart({ data, total }: SourcePieChartProps) {
  const chartData = data.filter((d) => d.count > 0);

  return (
    <Card className="metric-card animate-in" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle className="section-header">
          Today&apos;s Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="source"
              animationDuration={800}
              animationEasing="ease-out"
              label={renderLabel}
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.source}
                  fill={getSourceColor(entry.source)}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {/* Center label */}
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="central"
              className="data-value"
              style={{
                fontSize: 28,
                fontWeight: 700,
                fill: "#1e293b",
              }}
            >
              {total}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: 11,
                fill: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              updates
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
