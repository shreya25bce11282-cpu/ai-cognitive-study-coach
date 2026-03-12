const express = require("express") //This loads the Express framework so we can create a server.

const app = express() //This creates your server application. Everything the backend does will go through app.

const PORT = 5000 //This sets the port number for your server. You can change this if you want, but 5000 is a common choice for development.

//This means:
//If someone visits: localhost:5000/health
// The server responds:AI Study Coach Server Running
app.get("/health", (req, res) => {
  res.send("AI Study Coach Server Running")
})

app.get ("/test", (req, res) => {
  res.send("Backend working correctly")
})

//This tells Node: Start the server and listen for requests.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})