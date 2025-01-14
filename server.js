const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;


app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, "public"))); 


const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "12345@shubham", 
  database: "mess_payment_system", 
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to the MySQL database.");
});

// Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const query = "SELECT * FROM admin WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (results.length > 0) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "Invalid username or password" });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
