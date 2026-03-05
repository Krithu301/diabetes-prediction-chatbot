import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  initDb,
  savePrediction,
  fetchHistoryForUser,
  fetchById,
  saveUser,
  findUserByEmail,
  getUserById,
  saveUserInfo,
  getUserInfo,
  clearHistoryForUser
} from "./src/db.js";
import { loadModelAndPredict } from "./src/model_adaptor.js";
import PDFDocument from "pdfkit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Initialize DB
try {
  await initDb();
  console.log("✅ Database initialized");
} catch (err) {
  console.error("❌ DB init failed:", err);
  process.exit(1);
}

// ---------------- AUTH HELPERS ----------------
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "No token provided" });
  const token = h.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ---------------- ROUTES ----------------

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const id = await saveUser({ name, email, password_hash: hash });
    const user = await getUserById(id);
    const token = generateToken(user);

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (e) {
    console.error("Register failed:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (e) {
    console.error("Login failed:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

// Save user info
app.post("/api/user/info", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    await saveUserInfo(uid, req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error("Save user info failed:", e);
    res.status(500).json({ error: "Failed to save user info" });
  }
});

// Get user info
app.get("/api/user/info", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const info = await getUserInfo(uid);
    res.json({ info });
  } catch (e) {
    console.error("Fetch user info failed:", e);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

// ---------------- PREDICTION ----------------
app.post("/api/predict", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const features = req.body.features || req.body;
    if (!features || typeof features !== "object") {
      return res.status(400).json({ error: "Invalid features payload" });
    }

    const prediction = await loadModelAndPredict(features);

    const id = await savePrediction({
      user_id: uid,
      user: JSON.stringify(req.body.user || {}),
      input: JSON.stringify(features),
      output: JSON.stringify(prediction),
    });

    res.json({ id, prediction });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Prediction failed", detail: err.message });
  }
});

// ---------------- HISTORY ----------------
app.get("/api/history", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const rows = await fetchHistoryForUser(uid);
    res.json(rows);
  } catch (e) {
    console.error("History fetch failed:", e);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// 🧹 Clear history
app.delete("/api/clear-history", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    await clearHistoryForUser(uid);
    res.json({ message: "All history cleared successfully" });
  } catch (err) {
    console.error("Failed to clear history:", err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// ------------------- PDF REPORT -------------------
app.get("/api/report/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const row = await fetchById(id);
    if (!row) return res.status(404).send("Report not found");
    if (row.user_id !== req.user.id) return res.status(403).send("Forbidden");

    // Safe JSON parsing
    const safeParse = (val) => {
      try {
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      } catch {
        return {};
      }
    };

    const userInfo = await getUserById(req.user.id);
    const inputData = safeParse(row.input);
    const outputData = safeParse(row.output);

    // PDF setup
    const doc = new PDFDocument({ margin: 50 });
    const filename = `Diabetes_Report_${id}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ===== HEADER =====
    doc
      .rect(0, 0, doc.page.width, 60)
      .fill("#cc0000")
      .fillColor("white")
      .fontSize(22)
      .text("Smart Diabetes Health Predictor", 50, 20, { align: "center" });
    doc.moveDown(2);

    // ===== TITLE =====
    doc
      .fillColor("#cc0000")
      .fontSize(16)
      .text("Comprehensive Health Prediction Report", { align: "center" })
      .moveDown(1);

    // ===== USER INFO =====
    doc
      .fillColor("#cc0000")
      .fontSize(14)
      .text("User Information", { underline: true })
      .moveDown(0.5)
      .fillColor("black")
      .fontSize(12)
      .text(`Name: ${userInfo?.name || "N/A"}`)
      .text(`Email: ${userInfo?.email || "N/A"}`)
      .moveDown(1);

    // ===== INPUT DATA =====
    doc
      .fillColor("#cc0000")
      .fontSize(14)
      .text("Health Input Data", { underline: true })
      .moveDown(0.3)
      .fillColor("black");

    const labelMap = {
      pregnancies: "Pregnancies",
      glucose: "Glucose Level",
      bloodpressure: "Blood Pressure",
      skinthickness: "Skin Thickness",
      insulin: "Insulin Level",
      bmi: "Body Mass Index (BMI)",
      dpf: "Diabetes Pedigree Function",
      age: "Age",
    };

    Object.entries(inputData).forEach(([key, val]) => {
      const label = labelMap[key] || key;
      doc.text(`${label}: ${val}`);
    });
    doc.moveDown(1);

    // ===== PREDICTION RESULT =====
    doc
      .fillColor("#cc0000")
      .fontSize(14)
      .text("Prediction Result", { underline: true })
      .moveDown(0.3);

    const risk = outputData.label || "Unknown";
    const probability = ((outputData.prob || 0) * 100).toFixed(2);
    const color = risk.toLowerCase().includes("high") ? "#ff0000" : "#009900";

    doc
      .fontSize(12)
      .fillColor(color)
      .text(`Risk Level: ${risk}`)
      .fillColor("black")
      .text(`Probability: ${probability}%`)
      .moveDown(0.5);

    const rec =
      risk.toLowerCase().includes("high")
        ? "You have a higher chance of diabetes. Please consult a doctor, follow a balanced diet, and monitor your glucose levels regularly."
        : "You currently show a low chance of diabetes. Maintain your healthy lifestyle and monitor periodically.";

    doc
      .moveDown(0.5)
      .rect(45, doc.y, doc.page.width - 90, 60)
      .strokeColor("#cc0000")
      .lineWidth(1)
      .stroke()
      .fontSize(12)
      .fillColor("black")
      .text(rec, 50, doc.y + 10, { width: doc.page.width - 100 })
      .moveDown(3);

    // ===== FOOTER =====
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Generated on: ${new Date(row.created_at).toLocaleString()}`, {
        align: "center",
      })
      .moveDown(0.5)
      .text(
        "This report is generated by Smart Diabetes Health Predictor for informational purposes only.",
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("Report generation failed:", err);
    res.status(500).send("Failed to generate report");
  }
});

// ---------------- TEST ROUTE ----------------
app.get("/api/predict/test", async (req, res) => {
  try {
    const sample = {
      pregnancies: 1,
      glucose: 120,
      bloodpressure: 70,
      skinthickness: 20,
      insulin: 79,
      bmi: 28.5,
      dpf: 0.3,
      age: 33,
    };
    const pred = await loadModelAndPredict(sample);
    res.json({ ok: true, sample, pred });
  } catch (e) {
    console.error("Predict test failed:", e);
    res.status(500).json({ error: "Predict test failed", detail: e.message });
  }
});

// ---------------- GLOBAL HANDLERS ----------------
process.on("unhandledRejection", (r) => console.error("UnhandledRejection", r));
process.on("uncaughtException", (err) => console.error("UncaughtException", err));

// ---------------- CHATBOT ROUTE ----------------
app.post("/chatapi/chat", (req, res) => {
  const msg = req.body.message?.toLowerCase() || "";

  // Initial home message
  if (msg === "start") {
    return res.json({
      response: "👋 Hi! I'm Diabie, your health buddy. Tap a button to continue!",
      buttons: [
        { label: "Diabetes Info", value: "diabetes" },
        { label: "Exercise Tips", value: "exercise" },
        { label: "Healthy Food", value: "diet" }
      ]
    });
  }

  // Diabetes Info
  if (msg === "diabetes") {
    return res.json({
      response: "Diabetes is a condition of high blood sugar. What do you want to know?",
      buttons: [
        { label: "Symptoms", value: "symptoms" },
        { label: "Causes", value: "causes" },
        { label: "Back", value: "start" }
      ]
    });
  }

  // Exercise Tips
  if (msg === "exercise") {
    return res.json({
      response: "Choose an exercise type!",
      buttons: [
        { label: "Morning Exercise", value: "morning_ex" },
        { label: "Evening Exercise", value: "evening_ex" },
        { label: "Back", value: "start" }
      ]
    });
  }

  // Diet Tips
  if (msg === "diet") {
    return res.json({
      response: "Choose a meal plan!",
      buttons: [
        { label: "Breakfast Ideas", value: "breakfast" },
        { label: "Lunch Ideas", value: "lunch" },
        { label: "Dinner Ideas", value: "dinner" },
        { label: "Back", value: "start" }
      ]
    });
  }

  // Basic info responses
  if (msg === "symptoms") {
    return res.json({
      response: "Common diabetes symptoms include: thirst, tiredness, weight loss.",
      buttons: [{ label: "Back", value: "diabetes" }]
    });
  }

  if (msg === "causes") {
    return res.json({
      response: "Diabetes can be caused by genetics, lifestyle, or insulin issues.",
      buttons: [{ label: "Back", value: "diabetes" }]
    });
  }

  if (msg === "morning_ex") {
    return res.json({
      response: "Morning exercises: Walking, yoga, stretching (20 minutes).",
      buttons: [{ label: "Back", value: "exercise" }]
    });
  }

  if (msg === "evening_ex") {
    return res.json({
      response: "Evening exercises: Light jogging, cycling, pranayama.",
      buttons: [{ label: "Back", value: "exercise" }]
    });
  }

  if (msg === "breakfast") {
    return res.json({
      response: "Breakfast ideas: Oats, idli, dosa without oil, boiled eggs, fruits.",
      buttons: [{ label: "Back", value: "diet" }]
    });
  }

  if (msg === "lunch") {
    return res.json({
      response: "Lunch ideas: Brown rice, chapati, vegetables, dal.",
      buttons: [{ label: "Back", value: "diet" }]
    });
  }

  if (msg === "dinner") {
    return res.json({
      response: "Dinner ideas: Soup, salad, sprouts, light chapati.",
      buttons: [{ label: "Back", value: "diet" }]
    });
  }

  // Default fallback
  return res.json({
    response: "I didn't understand that. Please use the buttons.",
    buttons: [{ label: "Back to Home", value: "start" }]
  });
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
