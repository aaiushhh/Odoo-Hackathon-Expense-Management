const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create temp directory for file uploads
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const utilsRoutes = require('./routes/utilsRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const teamRoutes = require('./routes/teamRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/approvalflow', approvalRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// 404 handler
// app.use(*, (req, res) => {
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   });
// });

// MongoDB Connection
const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/expense-management';

main()
  .then(() => {
    console.log("Connected to DB.");
  })
  .catch((err) => {
    console.log("DB connection error:", err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.get("/", (req, res) => res.send("Expense Management API is running!"));

app.listen(port, () => console.log(`Server running on port ${port}!`));
