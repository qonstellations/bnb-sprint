import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Minimal interactive price chart per PLAN Sec 12. No indicators.
export default function PriceChart({ data }) {
  if (!data?.length) return null;
  const rows = data.map((d) => ({
    t: new Date(d.timestamp ?? d.date).toLocaleDateString(),
    close: d.close ?? d.value ?? d.portfolioValue,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={32} />
          <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} width={60} />
          <Tooltip />
          <Area type="monotone" dataKey="close" stroke="#818cf8" fill="#312e81" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
