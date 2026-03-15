import express from "express";
import pool from "./db/db.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();
const PORT = 5000;

app.use(express.json());

// Routes from routes folder
app.use("/", sessionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.send("AI Study Coach Server Running");
});

app.get("/test", (req, res) => {
  res.send("Backend working correctly");
});

// Test database connection
async function testDB() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (err) {
    console.error("Database connection error", err);
  }
}

// ---------------- ANALYTICS ----------------

// Fatigue analytics
app.get("/analytics/fatigue", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
      AS avg_fatigue_duration
      FROM study_sessions
      WHERE fatigue_rating >= 3
      AND end_time IS NOT NULL
    `);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching fatigue analytics");
  }
});

// Optimal session length
app.get("/analytics/optimal-session", async (req, res) => {
  try {

    const { subject } = req.query;

    const result = await pool.query(`
      SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
      AS optimal_session_minutes
      FROM study_sessions
      WHERE focus_rating >= 4
      AND subject = $1
      AND end_time IS NOT NULL
    `,[subject]);

    res.json({
      subject,
      optimal_session_minutes: result.rows[0].optimal_session_minutes
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching optimal session");
  }
});

// Summary analytics
app.get("/analytics/summary", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_sessions,
        ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600),2) AS total_hours,
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60),2) AS avg_session_minutes
      FROM study_sessions
      WHERE end_time IS NOT NULL
    `);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching summary analytics");
  }
});

// Subject performance
app.get("/analytics/subject-performance", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        subject,
        COUNT(*) AS sessions,
        AVG(focus_rating) AS avg_focus,
        AVG(fatigue_rating) AS avg_fatigue,
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 2)
        AS avg_duration_minutes
      FROM study_sessions
      WHERE end_time IS NOT NULL
      GROUP BY subject
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching subject performance");
  }
});

// Study plan recommendation
app.get("/analytics/recommend-study-plan", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
      AS recommended_minutes
      FROM study_sessions
      WHERE focus_rating >= 4
      AND end_time IS NOT NULL
      AND EXTRACT(EPOCH FROM (end_time - start_time)) / 60 < 300
    `);

    const recommended = result.rows[0].recommended_minutes;

    if (recommended == null) {
      res.json({
        recommended_session_minutes: 45
      });
    } else {
      res.json({
        recommended_session_minutes: recommended
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching study recommendation");
  }
});

// Burnout risk analysis
app.get("/analytics/burnout-risk", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes,
        fatigue_rating,
        focus_rating
      FROM study_sessions
      WHERE end_time IS NOT NULL
      ORDER BY start_time DESC
      LIMIT 5
    `);

    const sessions = result.rows;

    if (sessions.length === 0) {
      return res.json({
        burnout_risk: "UNKNOWN",
        reason: "No completed sessions yet"
      });
    }

    const avgDuration =
      sessions.reduce((sum, s) => sum + Number(s.duration_minutes), 0) /
      sessions.length;

    const avgFatigue =
      sessions.reduce((sum, s) => sum + (s.fatigue_rating || 0), 0) /
      sessions.length;

    const avgFocus =
      sessions.reduce((sum, s) => sum + (s.focus_rating || 0), 0) /
      sessions.length;

    let burnoutRisk = "LOW";
    let recommendation = "You're in a healthy study rhythm.";

    if (avgDuration > 90 && avgFatigue >= 3 && avgFocus <= 3) {
      burnoutRisk = "HIGH";
      recommendation = "Take a 30 minute break and shorten future sessions.";
    } 
    else if (avgDuration > 60 && avgFatigue >= 3) {
      burnoutRisk = "MEDIUM";
      recommendation = "Consider shorter sessions or a quick break.";
    }

    res.json({
      sessions_analyzed: sessions.length,
      avg_duration_minutes: avgDuration.toFixed(2),
      avg_fatigue: avgFatigue.toFixed(2),
      avg_focus: avgFocus.toFixed(2),
      burnout_risk: burnoutRisk,
      recommendation
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error analyzing burnout risk");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testDB();
});