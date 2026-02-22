"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DailyUpdate } from "@/lib/queries";

interface DailyBarChartProps {
  data: DailyUpdate[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
}

const PVT_GREEN = "#7abc64";
const PVT_GREEN_MUTED = "#7abc6440";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as DailyUpdate;
  const [year, month, day] = item.day.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const fullDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{fullDate}</p>
      <p className="data-value text-lg font-semibold text-pvt-green">
        {item.count.toLocaleString()} updates
      </p>
    </div>
  );
}

function BarLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      className="data-value"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        fill: "var(--foreground)",
      }}
    >
      {value.toLocaleString()}
    </text>
  );
}

export function DailyBarChart({ data, selectedDay, onSelectDay }: DailyBarChartProps) {

  return (
    <Card className="metric-card animate-in" style={{ animationDelay: "320ms" }}>
      <CardHeader>
        <CardTitle className="section-header">
          Daily Updates — Last 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, left: -8, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              dy={8}
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              dx={-4}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-pvt-green)", opacity: 0.06 }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              label={<BarLabel />}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(data: any) => data?.day && onSelectDay(data.day)}
              style={{ cursor: "pointer" }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={entry.day === selectedDay ? PVT_GREEN : PVT_GREEN_MUTED}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
