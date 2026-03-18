import pool from "../db/db.js";

/* -------------------- FATIGUE -------------------- */
export const getFatigue = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
        AS avg_fatigue_duration
      FROM study_sessions
      WHERE fatigue_rating >= 3
      AND end_time IS NOT NULL
      AND (end_time - start_time) < INTERVAL '5 hours'
    `);

    const value = result.rows[0]?.avg_fatigue_duration;

    res.json({
      avg_fatigue_duration: value ?? 0,
      message: value
        ? "Fatigue duration calculated successfully"
        : "Not enough fatigue data yet"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching fatigue analytics");
  }
};


/* -------------------- OPTIMAL SESSION -------------------- */
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
      AND (end_time - start_time) < INTERVAL '5 hours'
    `, [subject]);

    const value = result.rows[0]?.optimal_session_minutes;

    res.json({
      subject,
      optimal_session_minutes: value ?? 0,
      insight: value
        ? `You perform best in ~${value} minute sessions for ${subject}.`
        : "Not enough data for this subject yet"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching optimal session");
  }
};


/* -------------------- SUMMARY -------------------- */
export const getSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_sessions,
        ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 2) AS total_hours,
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 2) AS avg_session_minutes
      FROM study_sessions
      WHERE end_time IS NOT NULL
    `);

    const data = result.rows[0];

    res.json({
      total_sessions: Number(data.total_sessions),
      total_hours: Number(data.total_hours ?? 0),
      avg_session_minutes: Number(data.avg_session_minutes ?? 0)
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching summary analytics");
  }
};


/* -------------------- SUBJECT PERFORMANCE -------------------- */
export const getSubjectPerformance = async (req, res) => {
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

    const cleaned = result.rows.map(r => ({
      subject: r.subject,
      sessions: Number(r.sessions),
      avg_focus: Number(r.avg_focus || 0).toFixed(2),
      avg_fatigue: Number(r.avg_fatigue || 0).toFixed(2),
      avg_duration_minutes: Number(r.avg_duration_minutes || 0)
    }));

    res.json(cleaned);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching subject performance");
  }
};


/* -------------------- STUDY PLAN -------------------- */
export const getStudyPlan = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
        AS recommended_minutes
      FROM study_sessions
      WHERE focus_rating >= 4
      AND end_time IS NOT NULL
      AND (end_time - start_time) < INTERVAL '5 hours'
    `);

    const recommended = result.rows[0]?.recommended_minutes;

    res.json({
      recommended_session_minutes: recommended ?? 45,
      insight: recommended
        ? `Your ideal session length is around ${recommended} minutes.`
        : "Start with 45-minute sessions and adjust based on focus."
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching study recommendation");
  }
};


/* -------------------- BURNOUT RISK -------------------- */
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

    const fatigueValues = sessions.map(s => Number(s.fatigue_rating || 0));
    const fatigueTrend =
      fatigueValues[fatigueValues.length - 1] - fatigueValues[0];

    let burnoutRisk = "LOW";
    let recommendation = "You're in a healthy study rhythm.";

    if (avgDuration > 90 && avgFatigue >= 3 && avgFocus <= 3 && fatigueTrend > 0) {
      burnoutRisk = "HIGH";
      recommendation = "Your fatigue is rising while focus drops. Pause now before burnout hits.";
    } else if (avgDuration > 60 && avgFatigue >= 3 && fatigueTrend >= 0) {
      burnoutRisk = "MEDIUM";
      recommendation = "You're starting to feel strain. Consider shorter sessions and breaks.";
    }

    res.json({
      sessions_analyzed: sessions.length,
      avg_duration_minutes: Number(avgDuration.toFixed(2)),
      avg_fatigue: Number(avgFatigue.toFixed(2)),
      avg_focus: Number(avgFocus.toFixed(2)),
      fatigue_trend: fatigueTrend,
      burnout_risk: burnoutRisk,
      recommendation
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error analyzing burnout risk");
  }
};


/* -------------------- BREAK RECOMMENDATION -------------------- */
export const getBreakRecommendation = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes,
        fatigue_rating
      FROM study_sessions
      WHERE end_time IS NOT NULL
      ORDER BY start_time DESC
      LIMIT 3
    `);

    const sessions = result.rows;

    if (sessions.length === 0) {
      return res.json({
        recommendation: "No data yet. Start studying first."
      });
    }

    const avgDuration =
      sessions.reduce((sum, s) => sum + Number(s.duration_minutes), 0) /
      sessions.length;

    const avgFatigue =
      sessions.reduce((sum, s) => sum + (s.fatigue_rating || 0), 0) /
      sessions.length;

    let recommendation;

    if (avgDuration > 90 || avgFatigue >= 4) {
      recommendation = "You've been pushing hard. Take a 30-minute reset.";
    } else if (avgDuration > 60 || avgFatigue >= 3) {
      recommendation = "Take a short 10–15 minute break to stay sharp.";
    } else {
      recommendation = "You're in a good flow. Keep going.";
    }

    res.json({
      avg_duration_minutes: Number(avgDuration.toFixed(2)),
      avg_fatigue: Number(avgFatigue.toFixed(2)),
      recommendation
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating break recommendation");
  }
};


/* -------------------- PREDICT SESSION DURATION -------------------- */
export const predictSessionDuration = async (req, res) => {
  try {
    const { subject } = req.query;

    const result = await pool.query(`
      SELECT
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes,
        focus_rating,
        fatigue_rating
      FROM study_sessions
      WHERE subject = $1
      AND end_time IS NOT NULL
      AND (end_time - start_time) < INTERVAL '5 hours'
    `, [subject]);

    const sessions = result.rows;

    if (sessions.length === 0) {
      return res.json({
        subject,
        predicted_duration: 45,
        insight: "No past data. Starting with a balanced default."
      });
    }

    const goodSessions = sessions.filter(
      s => s.focus_rating >= 4 && s.fatigue_rating <= 3
    );

    const baseSessions = goodSessions.length > 0 ? goodSessions : sessions;

    const avgDuration =
      baseSessions.reduce((sum, s) => sum + Number(s.duration_minutes), 0) /
      baseSessions.length;

    const cappedDuration = Math.min(avgDuration, 120);

    let insight;

    if (cappedDuration <= 45) {
      insight = "You work best in short, focused bursts.";
    } else if (cappedDuration <= 90) {
      insight = "You maintain strong focus in medium-length sessions.";
    } else {
      insight = "You can go long, but watch fatigue levels.";
    }

    res.json({
      subject,
      predicted_duration: Number(cappedDuration.toFixed(0)),
      based_on_sessions: baseSessions.length,
      insight
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error predicting session duration");
  }
};


/* -------------------- BEST STUDY TIME -------------------- */
export const getBestStudyTime = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM start_time) AS hour,
        AVG(focus_rating) AS avg_focus,
        AVG(fatigue_rating) AS avg_fatigue,
        COUNT(*) as sessions
      FROM study_sessions
      WHERE end_time IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY avg_focus DESC, avg_fatigue ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({
        best_hour: null,
        message: "Not enough data yet"
      });
    }

    const best = result.rows[0];

    let insight;

    if (best.avg_focus >= 4.5 && best.avg_fatigue <= 2.5) {
      insight = `Peak performance around ${best.hour}:00. Use this time for hardest tasks.`;
    } else if (best.avg_focus >= 4) {
      insight = `Good focus around ${best.hour}:00. Ideal for important study.`;
    } else {
      insight = `You study at ${best.hour}:00, but performance can improve.`;
    }

    res.json({
      best_hour: `${best.hour}:00`,
      avg_focus: Number(best.avg_focus).toFixed(2),
      avg_fatigue: Number(best.avg_fatigue).toFixed(2),
      sessions_analyzed: Number(best.sessions),
      insight
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error finding best study time");
  }
};