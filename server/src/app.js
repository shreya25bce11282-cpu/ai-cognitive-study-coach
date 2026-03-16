import express from "express";
import pool from "./db/db.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";


const app = express();
const PORT = 5000;

app.use(express.json());



// Routes from routes folder
app.use("/", sessionRoutes);
app.use("/", analyticsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.send("AI Study Coach Server Running");
});

app.get("/test", (req, res) => {
  res.send("Backend working correctly");
});

app.get("/version", (req, res) => {
  res.json({
    app: "AI Cognitive Study Coach",
    version: "1.0.0"
  });
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



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testDB();
});