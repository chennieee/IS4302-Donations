require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./src/models/database');
const CampaignController = require('./src/controllers/campaignController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database and controller
const campaignController = new CampaignController();

// Initialize DB tables on startup
(async () => {
  await campaignController.initialize();
  console.log('Database initialized');
})();

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Donations Backend',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Campaign routes
app.get('/api/campaigns', (req, res) => campaignController.getCampaigns(req, res));
app.get('/api/campaigns/:address', (req, res) => campaignController.getCampaign(req, res));
app.get('/api/campaigns/:address/events', (req, res) => campaignController.getCampaignEvents(req, res));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ API ready at http://localhost:${PORT}/api`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/campaigns`);
  console.log(`  GET  /api/campaigns/:address`);
  console.log(`  GET  /api/campaigns/:address/events\n`);
});
