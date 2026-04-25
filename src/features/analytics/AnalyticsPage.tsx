import { useMemo, useState } from "react";
import { useUsage } from "../../store/AppContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimeRange {
  label: string;
  value: "day" | "week" | "month" | "all";
}

const TIME_RANGES: TimeRange[] = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const COLORS = ["#f472b6", "#60a5fa", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "all">("month");
  const usage = useUsage();

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    return usage.filter((u) => now - u.timestamp <= ranges[timeRange]);
  }, [usage, timeRange]);

  const stats = useMemo(() => {
    const totalTokens = filtered.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
    const totalCost = filtered.reduce((sum, u) => sum + u.cost, 0);
    const avgCostPerRequest = filtered.length > 0 ? totalCost / filtered.length : 0;
    const textRequests = filtered.filter((u) => u.mode === "text").length;
    const imageRequests = filtered.filter((u) => u.mode === "image").length;

    return {
      totalRequests: filtered.length,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      avgCostPerRequest: avgCostPerRequest.toFixed(4),
      textRequests,
      imageRequests,
    };
  }, [filtered]);

  // Group by model
  const modelStats = useMemo(() => {
    const grouped: Record<string, { count: number; cost: number; tokens: number }> = {};
    filtered.forEach((u) => {
      if (!grouped[u.model]) {
        grouped[u.model] = { count: 0, cost: 0, tokens: 0 };
      }
      grouped[u.model].count++;
      grouped[u.model].cost += u.cost;
      grouped[u.model].tokens += u.inputTokens + u.outputTokens;
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([name, data]) => ({
        name,
        cost: parseFloat(data.cost.toFixed(4)),
        count: data.count,
        tokens: data.tokens,
      }));
  }, [filtered]);

  // Timeline data (daily)
  const timelineData = useMemo(() => {
    const days: Record<string, { requests: number; cost: number; tokens: number }> = {};
    filtered.forEach((u) => {
      const date = new Date(u.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!days[date]) days[date] = { requests: 0, cost: 0, tokens: 0 };
      days[date].requests++;
      days[date].cost += u.cost;
      days[date].tokens += u.inputTokens + u.outputTokens;
    });
    return Object.entries(days)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-30)
      .map(([date, data]) => ({
        date,
        ...data,
        cost: parseFloat(data.cost.toFixed(4)),
      }));
  }, [filtered]);

  // Mode breakdown
  const modeData = useMemo(() => {
    const text = stats.textRequests;
    const image = stats.imageRequests;
    return text + image > 0 ? [
      { name: "Text", value: text },
      { name: "Image", value: image },
    ] : [];
  }, [stats]);

  return (
    <div className="page-stack">
      <div className="analytics-header">
        <div>
          <h1 style={{ margin: "0 0 0.5rem" }}>📊 Usage & Analytics</h1>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>Track API usage, costs, and performance metrics</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              style={{
                background: timeRange === range.value ? "var(--dock-active-bg)" : "var(--surface)",
                color: timeRange === range.value ? "var(--dock-active-color)" : "var(--ink-soft)",
                border: `1px solid ${timeRange === range.value ? "var(--dock-active-border)" : "var(--glass-stroke)"}`,
                padding: "0.45rem 0.85rem",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 160ms ease",
              }}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>Total Requests</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>{stats.totalRequests}</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>Total Tokens</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>{(stats.totalTokens / 1000).toFixed(1)}K</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>Total Cost</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--success)" }}>${stats.totalCost}</div>
        </div>
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>Avg Cost</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>${stats.avgCostPerRequest}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Cost Timeline */}
        <div className="panel">
          <h2 style={{ margin: "0 0 0.85rem", fontSize: "0.95rem", fontWeight: 700 }}>💰 Cost Timeline</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-stroke)" />
              <XAxis dataKey="date" stroke="var(--ink-muted)" style={{ fontSize: "0.75rem" }} />
              <YAxis stroke="var(--ink-muted)" style={{ fontSize: "0.75rem" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--glass-stroke)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink-main)",
                }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--accent)"
                dot={{ fill: "var(--accent)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model Breakdown */}
        <div className="panel">
          <h2 style={{ margin: "0 0 0.85rem", fontSize: "0.95rem", fontWeight: 700 }}>🤖 Model Usage</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelStats.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-stroke)" />
              <XAxis dataKey="name" stroke="var(--ink-muted)" style={{ fontSize: "0.75rem" }} />
              <YAxis stroke="var(--ink-muted)" style={{ fontSize: "0.75rem" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--glass-stroke)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink-main)",
                }}
              />
              <Bar dataKey="cost" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mode Distribution */}
        {modeData.length > 0 && (
          <div className="panel">
            <h2 style={{ margin: "0 0 0.85rem", fontSize: "0.95rem", fontWeight: 700 }}>📝 Request Types</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--glass-stroke)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--ink-main)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Model Details Table */}
      {modelStats.length > 0 && (
        <div className="panel">
          <h2 style={{ margin: "0 0 0.85rem", fontSize: "0.95rem", fontWeight: 700 }}>📋 Model Details</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-stroke)" }}>
                  <th style={{ textAlign: "left", padding: "0.65rem", fontWeight: 600, color: "var(--ink-soft)" }}>Model</th>
                  <th style={{ textAlign: "right", padding: "0.65rem", fontWeight: 600, color: "var(--ink-soft)" }}>Requests</th>
                  <th style={{ textAlign: "right", padding: "0.65rem", fontWeight: 600, color: "var(--ink-soft)" }}>Tokens</th>
                  <th style={{ textAlign: "right", padding: "0.65rem", fontWeight: 600, color: "var(--ink-soft)" }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {modelStats.map((model) => (
                  <tr key={model.name} style={{ borderBottom: "1px solid var(--glass-stroke)" }}>
                    <td style={{ padding: "0.65rem", color: "var(--ink-main)" }}>{model.name}</td>
                    <td style={{ textAlign: "right", padding: "0.65rem", color: "var(--ink-soft)" }}>{model.count}</td>
                    <td style={{ textAlign: "right", padding: "0.65rem", color: "var(--ink-soft)" }}>{model.tokens.toLocaleString()}</td>
                    <td style={{ textAlign: "right", padding: "0.65rem", fontWeight: 600, color: "var(--accent)" }}>${model.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            const csv = [
              "Timestamp,Model,Mode,Input Tokens,Output Tokens,Cost",
              ...filtered.map((u) => `"${new Date(u.timestamp).toISOString()}","${u.model}","${u.mode}",${u.inputTokens},${u.outputTokens},${u.cost}`),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vibesai-usage-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--glass-stroke)",
            color: "var(--ink-soft)",
            padding: "0.65rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 160ms ease",
          }}
        >
          📥 Export CSV
        </button>
        <button
          onClick={() => {
            const json = JSON.stringify(filtered, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vibesai-usage-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            background: "var(--dock-active-bg)",
            border: "1px solid var(--dock-active-border)",
            color: "var(--dock-active-color)",
            padding: "0.65rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 160ms ease",
          }}
        >
          📤 Export JSON
        </button>
      </div>
    </div>
  );
}
