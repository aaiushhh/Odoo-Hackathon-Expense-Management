const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const utilsRoutes = require("./routes/utilsRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const teamRoutes = require("./routes/teamRoutes");
const companyRoutes = require("./routes/companyRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error("CORS policy does not allow this origin."),
          false
        );
      }
      return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Create temp directory for file uploads ---
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/approvalflow", approvalRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/users", userRoutes);

// --- Base Route ---
app.get("/", (req, res) => res.send("Expense Management API is running!"));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "An unexpected error occurred.";
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

// --- MongoDB Connection + Server Start ---
const dbUrl =
  process.env.MONGODB_URL || "mongodb://localhost:27017/expense-management";

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
