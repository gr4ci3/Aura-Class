require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection (port 5173 is standard Vite dev server)
app.use(cors({
  origin: '*', // In development, allow requests from any host
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/upload', uploadRoutes);

const { isSupabaseConfigured } = require('./supabaseClient');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isSupabaseConfigured() ? 'Supabase PostgreSQL (Primary Cloud Engine)' : (process.env.DB_FILE || 'database.json'),
    supabaseConnected: isSupabaseConfigured(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🌌 AuraClass Backend running on http://localhost:${PORT}`);
  console.log(`📂 Database Engine: ${isSupabaseConfigured() ? 'Supabase PostgreSQL (Cloud)' : path.resolve(__dirname, process.env.DB_FILE || 'database.json')}`);
  console.log(`🚀 Press Ctrl+C to terminate the server`);
  console.log(`==================================================`);
});
