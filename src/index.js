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
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/rate-cards', rateCardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);

// Temporary seeding route for easy cloud database seeding via browser
app.get('/api/seed-database', async (req, res) => {
  try {
    const seed = require('./scripts/seed');
    await seed();
    res.json({
      status: 'success',
      message: 'Database seeded successfully!',
      default_accounts: {
        admin: 'admin@tracker.com / admin123',
        customer: 'customer@tracker.com / customer123',
        retail: 'retail@tracker.com / retail123',
        agent: 'agent1@tracker.com / agent123'
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');

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
