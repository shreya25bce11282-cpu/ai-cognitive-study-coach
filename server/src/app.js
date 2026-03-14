const express = require("express") //This loads the Express framework so we can create a server.
const pool = require("./db/db")
const app = express() //This creates your server application. Everything the backend does will go through app.

const PORT = 5000 //This sets the port number for your server. You can change this if you want, but 5000 is a common choice for development.
app.use(express.json())

//This means:
//If someone visits: localhost:5000/health
// The server responds:AI Study Coach Server Running
async function testDB() {
  try {
    const result = await pool.query("SELECT NOW()")
    console.log("Database connected:", result.rows[0])
  } catch (err) {
    console.error("Database connection error", err)
  }
}

app.get("/health", (req, res) => {
  res.send("AI Study Coach Server Running")
})

app.get ("/test", (req, res) => {
  res.send("Backend working correctly")
})

//This tells Node: Start the server and listen for requests.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  testDB()
})

app.post("/sessions/start", async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO study_sessions (subject, start_time) VALUES ('General Study', NOW()) RETURNING *"
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).send("Error starting session")
  }
})

app.post("/sessions/end", async (req, res) => {
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
});

app.get("/analytics/fatigue", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)) 
       AS avg_fatigue_duration
       FROM study_sessions
       WHERE fatigue_rating >= 3
       AND end_time IS NOT NULL`
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching fatigue analytics");
  }
});

app.get("/analytics/optimal-session", async (req, res) => {
  try {

    const { subject } = req.query;

    const result = await pool.query(
      `SELECT
       ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60))
       AS optimal_session_minutes
       FROM study_sessions
       WHERE focus_rating >= 4
       AND subject = $1
       AND end_time IS NOT NULL`,
      [subject]
    );

    res.json({
      subject,
      optimal_session_minutes: result.rows[0].optimal_session_minutes
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching optimal session");
  }
});

app.get("/sessions", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT *
       FROM study_sessions
       ORDER BY start_time DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching sessions");
  }
});