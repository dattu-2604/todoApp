const express = require("express");
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const port = 7777;

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: "erlgherg", // Change this to a secret key for your app
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Create a MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "todoapp",
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database as ID " + connection.threadId);
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // checking email already exists or not
  const checkEmail = "SELECT * FROM users WHERE email = ?";

  connection.query(checkEmail, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      req.flash("error_msg", "An error occurred. Please try again.");
      return res.redirect("/signup");
    }

    // user already exists
    if (results.length > 0) {
      req.flash(
        "error_msg",
        "Email is already registered. Please use a different email."
      );
      return res.redirect("/signup");
    }

    // user doesnt exist, proceed with registration
    const insertSql =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    connection.query(insertSql, [name, email, password], (err) => {
      if (err) {
        console.error("Database error:", err);
        req.flash(
          "error_msg",
          "An error occurred during registration. Please try again."
        );
        return res.redirect("/signup");
      }

      req.flash("success_msg", "Registration successful!");
      res.redirect("/");
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log("Server is running on port 3000");
});
