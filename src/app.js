const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const os = require('os');
const restaurantRoutes = require('./routes/restaurants');

const app = express();
app.use(express.json());
app.use(morgan('tiny'));

// Liveness/readiness probe used by Kubernetes. `pod` shows which replica answered.
app.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    service: 'restaurant-service',
    status: dbUp ? 'UP' : 'DOWN',
    database: dbUp ? 'connected' : 'disconnected',
    pod: os.hostname(),
  });
});

app.use('/restaurants', restaurantRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
