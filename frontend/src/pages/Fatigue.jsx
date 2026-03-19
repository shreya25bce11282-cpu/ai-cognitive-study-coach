import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useFatigue } from "../hooks/useFatigue";

const Fatigue = () => {
  const { data, loading } = useFatigue();

  if (loading) return <h2>Loading fatigue data...</h2>;

  return (
    <div className="container">
      <h1>Fatigue Analytics</h1>

      {/* Chart */}
      <div style={{ height: "300px", marginTop: "20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="fatigue" stroke="#6366f1" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Box */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "var(--card)",
          borderRadius: "16px",
        }}
      >
        <h3>AI Insight</h3>
        <p>
          Your fatigue levels are increasing mid-week. Consider taking short
          breaks and reducing late-night study sessions.
        </p>
      </div>
    </div>
  );
};

export default Fatigue;