const { Pool } = require("pg")

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "studycoach",
  password: "Alohomora$06",
  port: 5432,
})

module.exports = pool