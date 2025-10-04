const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const utilsRoutes = require("./routes/utilsRoutes");
const approvalRoutes = require("./routes/approvalRoutes");

const app = express();

// --- Middlewares ---
app.use(express.json());

// --- CORS Setup ---
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
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

// --- Base Route ---
app.get("/", (req, res) =>
  res.send("Expense Management System API is running!")
);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/approvalflow", approvalRoutes);

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
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URL, {
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
