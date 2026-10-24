const express = require('express');
const mongoose = require('mongoose');
const Restaurant = require('../models/restaurant');
const { validateOrderItems, ValidationError } = require('../validation');

const router = express.Router();

// Wraps async handlers so rejected promises reach the error middleware
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

async function loadRestaurant(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Restaurant not found' });
    return null;
  }
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) res.status(404).json({ error: 'Restaurant not found' });
  return restaurant;
}

// ---------- Commands ----------

// Register a new restaurant
router.post('/', wrap(async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).json(restaurant);
}));

// Update restaurant details (e.g. open/close)
router.patch('/:id', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  const { menu, ...updates } = req.body;
  Object.assign(restaurant, updates);
  await restaurant.save();
  res.json(restaurant);
}));

// Add an item to the menu
router.post('/:id/menu', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  restaurant.menu.push(req.body);
  await restaurant.save();
  res.status(201).json(restaurant.menu[restaurant.menu.length - 1]);
}));

// Update a menu item (price / availability)
router.put('/:id/menu/:itemId', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  const item = restaurant.menu.id(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  Object.assign(item, req.body);
  await restaurant.save();
  res.json(item);
}));

// Remove a menu item
router.delete('/:id/menu/:itemId', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  const item = restaurant.menu.id(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  item.deleteOne();
  await restaurant.save();
  res.status(204).end();
}));

// Validate an order's items and return authoritative prices.
// Called synchronously by the Order Service before it creates an order.
router.post('/:id/validate-order', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  try {
    res.json(validateOrderItems(restaurant, req.body.items));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(422).json({ valid: false, error: err.message, details: err.details });
    }
    throw err;
  }
}));

// ---------- Queries ----------

// List / search restaurants: ?cuisine=Indian&open=true
router.get('/', wrap(async (req, res) => {
  const filter = {};
  if (req.query.cuisine) filter.cuisine = new RegExp(`^${req.query.cuisine}$`, 'i');
  if (req.query.open) filter.isOpen = req.query.open === 'true';
  const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
  res.json(restaurants);
}));

router.get('/:id', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (restaurant) res.json(restaurant);
}));

router.get('/:id/menu', wrap(async (req, res) => {
  const restaurant = await loadRestaurant(req, res);
  if (!restaurant) return;
  const menu = req.query.available === 'true'
    ? restaurant.menu.filter((m) => m.available)
    : restaurant.menu;
  res.json(menu);
}));

module.exports = router;
