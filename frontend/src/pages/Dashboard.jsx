import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../components/Card"; // make sure path is correct

const API = "http://localhost:5000/api/analytics";

const staticCards = [
  { id: 1, title: "AI Task 1", description: "Click to run task 1" },
  { id: 2, title: "AI Task 2", description: "Click to run task 2" },
];

export default function Dashboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, bestTime, burnout, breakRec, prediction] = await Promise.all([
          axios.get(`${API}/summary`),
          axios.get(`${API}/best-study-time`),
          axios.get(`${API}/burnout-risk`),
          axios.get(`${API}/break-recommendation`),
          axios.get(`${API}/predict?subject=Math`),
        ]);

        setData({
          summary: summary.data,
          bestTime: bestTime.data,
          burnout: burnout.data,
          breakRec: breakRec.data,
          prediction: prediction.data,
        });
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = async (id) => {
    console.log("Card clicked:", id);
    try {
      const res = await fetch(`http://localhost:5000/api/runTask/${id}`);
      const backendData = await res.json();
      console.log("Backend response:", backendData);
    } catch (err) {
      console.error("Error calling backend:", err);
    }
  };

  return (
    <>
      <h1 style={{ textAlign: "center", marginTop: "20px", fontSize: "28px", color: "#c7d2fe" }}>
        AI Study Coach
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", padding: "20px" }}>
        {/* Static cards */}
        {staticCards.map((card) => (
          <Card key={card.id} item={card} onClick={handleCardClick} />
        ))}

        {/* API-driven cards */}
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