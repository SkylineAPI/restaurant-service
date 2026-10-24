const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurantdb';

async function start() {
  // Retry so the service survives starting before MongoDB is ready
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB');
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`restaurant-service listening on port ${PORT}`));
}

start();
