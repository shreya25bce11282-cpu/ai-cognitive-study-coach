import { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/card";

const API = "http://localhost:5000/api/analytics";

export default function Dashboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [
        summary,
        bestTime,
        burnout,
        breakRec,
        prediction
      ] = await Promise.all([
        axios.get(`${API}/summary`),
        axios.get(`${API}/best-time`),
        axios.get(`${API}/burnout`),
        axios.get(`${API}/break`),
        axios.get(`${API}/predict?subject=Math`)
      ]);

      setData({
        summary: summary.data,
        bestTime: bestTime.data,
        burnout: burnout.data,
        breakRec: breakRec.data,
        prediction: prediction.data
      });
    };

    fetchData();
  }, []);

  return (
    <>
      <h1 style={{
        textAlign: "center",
        marginTop: "20px",
        fontSize: "28px",
        color: "#c7d2fe"
      }}>
        AI Study Coach
      </h1>

      <div className="container">

        <Card title="📊 Summary">
          <p>{data.summary?.total_sessions} sessions</p>
          <p>{data.summary?.total_hours} hrs</p>
          <p>{data.summary?.avg_session_minutes} min avg</p>
        </Card>

        <Card title="⏱ Best Time">
          <p>{data.bestTime?.best_hour}</p>
          <p>{data.bestTime?.insight}</p>
        </Card>

        <Card title="🔥 Burnout">
          <p>{data.burnout?.burnout_risk}</p>
          <p>{data.burnout?.recommendation}</p>
        </Card>

        <Card title="☕ Break">
          <p>{data.breakRec?.recommendation}</p>
        </Card>

        <Card title="🧠 Prediction">
          <p>{data.prediction?.predicted_duration} min</p>
          <p>{data.prediction?.insight}</p>
        </Card>

      </div>
    </>
  );
}