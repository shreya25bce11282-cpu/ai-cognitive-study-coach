import pool from "../db/db.js";

export const getSessions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM study_sessions
      ORDER BY start_time DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching sessions");
  }
};

export const startSession = async (req, res) => {
  try {

    const { subject } = req.body;

    const result = await pool.query(
      `INSERT INTO study_sessions (subject, start_time)
       VALUES ($1, NOW())
       RETURNING *`,
      [subject]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error starting session");
  }
};

export const endSession = async (req, res) => {
  try {

    const { session_id, fatigue_rating, focus_rating } = req.body;

    const result = await pool.query(
      `UPDATE study_sessions
       SET end_time = NOW(),
           fatigue_rating = $1,
           focus_rating = $2
       WHERE id = $3
       RETURNING *`,
      [fatigue_rating, focus_rating, session_id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error ending session");
  }
};