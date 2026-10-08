const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { getDb } = require('../database/db');
const { vectorStore } = require('../rag/retrieval/vectorStore');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve Frontend compiled build from frontend/dist
const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Route Handlers
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const officerRoutes = require('./routes/officer');
const fieldRoutes = require('./routes/field');
const ragRoutes = require('./routes/rag');
const commonRoutes = require('./routes/common');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/documents', ragRoutes);
app.use('/api/common', commonRoutes);
app.use('/api', commonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NAGAR CONNECT',
    tagline: 'Your Voice. Our Responsibility. A Better Nagar.',
    version: '1.5.0',
    rag_engine: 'Active (128-dim VectorStore)',
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback for Express v5
if (fs.existsSync(distDir)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Boot and startup
async function startServer() {
  try {
    console.log('🏛️ Initializing NAGAR CONNECT Municipal Platform...');
    await getDb();
    console.log('💾 Database connection verified.');

    await vectorStore.initialize();
    const stats = vectorStore.getStats();
    console.log(`🧠 Centralized RAG Engine online (${stats.totalChunks} chunks in memory index, ${stats.totalDocuments} documents).`);

    app.listen(PORT, () => {
      console.log(`\n==========================================================`);
      console.log(`🏛️ NAGAR CONNECT IS READY TO ACCESS AT ONE SINGLE LINK:`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`==========================================================\n`);
    });
  } catch (err) {
    console.error('Fatal server boot error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
