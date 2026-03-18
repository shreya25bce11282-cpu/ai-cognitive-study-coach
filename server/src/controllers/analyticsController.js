import pool from "../db/db.js";

export const getFatigue = async (req, res) => {
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
};

export const getOptimalSession = async (req, res) => {
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
};

export const getSummary = async (req, res) => {
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
};

export const getSubjectPerformance = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        subject,
        COUNT(*) AS sessions,
        AVG(focus_rating) AS avg_focus,
        AVG(fatigue_rating) AS avg_fatigue,
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60),2)
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
};

export const getStudyPlan = async (req, res) => {
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
};

export const getBurnoutRisk = async (req, res) => {
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

    const fatigueValues = sessions.map(s => Number(s.fatigue_rating));

const fatigueTrend =
  fatigueValues[fatigueValues.length - 1] - fatigueValues[0];

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

    if (
      avgDuration > 90 &&
      avgFatigue >= 3 &&
      avgFocus <= 3 &&
      fatigueTrend > 0
      ) {
      burnoutRisk = "HIGH";
      recommendation = "Fatigue is increasing. Take a break immediately.";
        }
      else if (avgDuration > 60 && avgFatigue >= 3 && fatigueTrend >= 0) {
      burnoutRisk = "MEDIUM";
      recommendation = "Fatigue is building up. Consider shorter sessions.";
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
};

