// ============================================================
// NAGAR CONNECT - MUNICIPAL E-GOVERNANCE BACKEND SERVER
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config/constants');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const officerRoutes = require('./routes/officerRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const slaRoutes = require('./routes/slaRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
app.use(express.static(path.resolve(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/notifications', notificationRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    platform: 'Nagar Connect Municipal Platform',
    version: '1.3.0 (Member 3: Department Officer Management)',
    timestamp: new Date().toISOString()
  });
});

// Fallback to frontend index.html for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛️ NAGAR CONNECT - MUNICIPAL E-GOVERNANCE PLATFORM`);
    console.log(`“Your Voice. Our Responsibility. A Better Nagar.”`);
    console.log(`-------------------------------------------------------`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`   - Citizen Portal:      http://localhost:${PORT}/#citizen-dashboard`);
    console.log(`   - Officer Portal:      http://localhost:${PORT}/#officer-dashboard`);
    console.log(`   - Officer Queue:       http://localhost:${PORT}/#officer-queue`);
    console.log(`   - Health Check:        http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
