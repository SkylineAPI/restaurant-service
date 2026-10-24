const test = require('node:test');
const assert = require('node:assert');
const { validateOrderItems, ValidationError } = require('../src/validation');

const restaurant = {
  id: 'r1',
  name: 'Spice Garden',
  isOpen: true,
  menu: [
    { id: 'm1', name: 'Paneer Tikka', price: 250, available: true },
    { id: 'm2', name: 'Butter Naan', price: 40.5, available: true },
    { id: 'm3', name: 'Biryani', price: 300, available: false },
  ],
};

test('prices valid items and computes subtotal', () => {
  const result = validateOrderItems(restaurant, [
    { menuItemId: 'm1', quantity: 2 },
    { menuItemId: 'm2', quantity: 3 },
  ]);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.items.length, 2);
  assert.strictEqual(result.subtotal, 621.5);
});

test('rejects unavailable and unknown items', () => {
  assert.throws(
    () => validateOrderItems(restaurant, [
      { menuItemId: 'm3', quantity: 1 },
      { menuItemId: 'nope', quantity: 1 },
    ]),
    (err) => err instanceof ValidationError && err.details.length === 2
  );
});

test('rejects orders when restaurant is closed', () => {
  assert.throws(
    () => validateOrderItems({ ...restaurant, isOpen: false }, [{ menuItemId: 'm1', quantity: 1 }]),
    ValidationError
  );
});

test('rejects empty orders and bad quantities', () => {
  assert.throws(() => validateOrderItems(restaurant, []), ValidationError);
  assert.throws(() => validateOrderItems(restaurant, [{ menuItemId: 'm1', quantity: 0 }]), ValidationError);
});
