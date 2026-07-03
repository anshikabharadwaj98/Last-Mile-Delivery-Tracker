const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { initializeTransporter } = require('./application/notificationService');

// Import routes
const authRoutes = require('./routes/auth');
const zoneRoutes = require('./routes/zones');
const rateCardRoutes = require('./routes/rateCards');
const orderRoutes = require('./routes/orders');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/rate-cards', rateCardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);

const fs = require('fs');

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// SPA Fallback: Serve index.html if it exists, otherwise return API status
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      status: 'success',
      message: 'Velocity Last-Mile API Server is active and operational.',
      environment: process.env.DATABASE_URL ? 'production (PostgreSQL)' : 'development (SQLite)'
    });
  }
});

// Database Synchronization & Server Startup
async function startServer() {
  try {
    console.log('Synchronizing database models...');
    await sequelize.sync();
    console.log('Database synced successfully.');

    // Warm up SMTP transporter and log its status
    await initializeTransporter();

    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  Last-Mile Delivery Tracker Server Running!`);
      console.log(`  Local URL: http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (local file)'}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Critical failure: Could not start the Express server:', error);
    process.exit(1);
  }
}

startServer();
