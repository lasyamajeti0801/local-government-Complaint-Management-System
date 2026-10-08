/**
 * NAGAR CONNECT - Central Backend Server & RAG Engine
 * Serves REST APIs, Central RAG Intelligence, and Web App
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initSchema, query: dbQuery } = require('../database/db');
const { seed } = require('../database/seed/seed');
const { ragPipeline } = require('../rag');

// Routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const officerRoutes = require('./routes/officerRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const ragRoutes = require('./routes/ragRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/documents', ragRoutes); // Document management endpoints
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await dbQuery('SELECT COUNT(*) as count FROM users');
    const compCount = await dbQuery('SELECT COUNT(*) as count FROM complaints');
    const docCount = await dbQuery('SELECT COUNT(*) as count FROM documents');
    const stats = await ragPipeline.getStats();

    res.json({
      status: 'UP',
      system: 'NAGAR CONNECT Municipal Intelligence Platform',
      version: '1.0.0 (Member 5 RAG Active)',
      database: 'CONNECTED',
      stats: {
        totalUsers: userCount[0]?.count || 0,
        totalComplaints: compCount[0]?.count || 0,
        totalDocuments: docCount[0]?.count || 0,
        ragVectorChunks: stats.totalChunks,
        ragQueriesServed: stats.totalQueriesAnswered
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'DEGRADED', error: err.message });
  }
});

// Serve frontend static assets if built
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.originalUrl
  });
});

async function startServer() {
  try {
    console.log('🏛️ Initializing Nagar Connect Platform...');
    await initSchema();

    // Check if database needs initial seeding
    const userCheck = await dbQuery('SELECT COUNT(*) as count FROM users');
    if (!userCheck[0] || userCheck[0].count === 0) {
      console.log('🌱 Performing initial database seeding...');
      await seed();
    }

    // Initialize RAG Engine
    await ragPipeline.initialize();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🏛️ NAGAR CONNECT SERVER RUNNING AT: http://localhost:${PORT}`);
      console.log(`📜 Tagline: "Your Voice. Our Responsibility. A Better Nagar."`);
      console.log(`🧠 Central RAG Pipeline: ACTIVE (128-dim Hybrid Search)`);
      console.log(`🔑 RBAC Active: Citizen, Officer, Field, Admin, Commissioner, Knowledge, SuperAdmin`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Critical failure starting Nagar Connect Server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
