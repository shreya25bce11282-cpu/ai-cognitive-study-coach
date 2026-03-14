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

    const { session_id } = req.body

    const result = await pool.query(
      "UPDATE study_sessions SET end_time = NOW() WHERE id = $1 RETURNING *",
      [session_id]
    )

    const start = new Date(result.rows[0].start_time)
    const end = new Date(result.rows[0].end_time)

    const duration = Math.round((end - start) / 60000)

    res.json({
      id: result.rows[0].id,
      duration_minutes: duration
    })

  } catch (err) {
    console.error(err)
    res.status(500).send("Error ending session")
  }
})

app.get("/sessions/stats", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT 
       COUNT(*) AS total_sessions,
       SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60) AS total_minutes,
       AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) AS avg_session_minutes
       FROM study_sessions
       WHERE end_time IS NOT NULL`
    )

    
  res.json({
  total_sessions: parseInt(result.rows[0].total_sessions),
  total_minutes: Math.round(result.rows[0].total_minutes),
  avg_session_minutes: Math.round(result.rows[0].avg_session_minutes)
})

  } catch (err) {
    console.error(err)
    res.status(500).send("Error fetching stats")
  }
})