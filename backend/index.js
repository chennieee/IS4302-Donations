require('dotenv').config();
const express = require('express');
const cors = require('cors');

const CampaignController = require('./src/controllers/campaignController');
const UserController = require('./src/controllers/userController');
const Indexer = require('./src/services/indexer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database and controllers
const campaignController = new CampaignController();
const userController = new UserController();
const indexer = new Indexer();

// Initialize DB tables and start indexer on startup
(async () => {
  await campaignController.initialize();
  await userController.initialize();
  console.log('✓ database and controllers initialized');

  // Start blockchain indexer
  await indexer.initialize();
  await indexer.start();
  console.log('✓ blockchain indexer started');
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
app.post('/api/campaigns', (req, res) => campaignController.createCampaign(req, res));
app.get('/api/campaigns/:address', (req, res) => campaignController.getCampaign(req, res));
app.get('/api/campaigns/:address/events', (req, res) => campaignController.getCampaignEvents(req, res));
app.post('/api/campaigns/:address/donate', (req, res) => campaignController.recordDonation(req, res));

// User routes
app.get('/api/users/:address', userController.getUser);
app.put('/api/users/:address', userController.updateUser);

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
  console.log(`  POST /api/campaigns`);
  console.log(`  GET  /api/campaigns/:address`);
  console.log(`  GET  /api/campaigns/:address/events`);
  console.log(`  GET  /api/users/:address`);
  console.log(`  PUT  /api/users/:address\n`)
});