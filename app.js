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
    secret: "FA8BF62B9F47A6F33A5E2DB8851F8",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

function preventCaching(req, res, next) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Expires", "0");
  res.setHeader("Pragma", "no-cache");
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is authenticated, proceed
  }
  res.redirect("/login"); // Redirect to login page if not authenticated
}

// app.use(preventCaching);

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

app.get("/", preventCaching, ensureAuthenticated, (req, res) => {
  res.render("home", { user: req.session.user });
});

app.get("/login", preventCaching, (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const getUser = "SELECT * FROM users WHERE email = ?";

  connection.query(getUser, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      req.flash("error_msg", "An error occurred. Please try again.");
      return res.redirect("/login");
    }

    // If user not found
    if (results.length === 0) {
      req.flash("error_msg", "Invalid email");
      return res.redirect("/login");
    }

    // user found
    const user = results[0];
    const isPasswordValid = user.password == password;

    if (!isPasswordValid) {
      req.flash("error_msg", "Invalid password.");
      return res.redirect("/login");
    }

    //login success
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    req.flash("success_msg", "Login successful!");
    res.redirect("/");
  });
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

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.flash(
        "error_msg",
        "An error occurred during logout. Please try again."
      );
      return res.redirect("/");
    }

    res.redirect("/login");
  });
});

// Start the server
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
