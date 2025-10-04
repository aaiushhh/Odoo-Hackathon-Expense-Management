const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

// Load environment variables
dotenv.config();
const port = process.env.PORT || 3000; // Use environment variable or default
const dbUrl = process.env.MONGODB_URL;

// --- Routes Import ---
// Assuming your auth routes file is at './routes/authRoutes.js'
const authRoutes = require('./routes/authRoutes'); 


// --- Middlewares ---
app.use(express.json()); // Body parser for JSON


// --- Database Connection ---
async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB.");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Exit process on failure
        process.exit(1); 
    }
}
main();


const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']; 

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true); 
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies/authorization headers
}));

// --- Base Route ---
app.get("/", (req, res) => res.send("Expense Management System API is running!"));


// --- Mount Routes ---
// This registers all endpoints defined in authRoutes.js under the /api/auth path
app.use('/api/auth', authRoutes);


// --- Global Error Handler Middleware ---
// This catches errors passed by controllers (using next(error))
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    const status = err.status || 500;
    const message = err.message || 'An unexpected error occurred.';
    res.status(status).json({
        success: false,
        message: message,
        // Only expose detailed stack in development
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});


// --- Server Start ---
app.listen(port, () => 
    console.log(`Server listening on port ${port}.`)
);