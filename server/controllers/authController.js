const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Generate a simple emoji avatar based on name
const getAvatar = (name) => {
  const avatars = ["🧑", "👩", "👨", "🧑‍💻", "👩‍💻", "👨‍💻", "🦸", "🧑‍🎨"];
  const index = name.charCodeAt(0) % avatars.length;
  return avatars[index];
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const avatar = getAvatar(name);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, avatar]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, name, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: { id: result.insertId, name, email, avatar },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, avatar, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: "User not found." });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { register, login, getMe };
