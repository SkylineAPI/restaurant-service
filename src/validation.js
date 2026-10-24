// Pure business logic for validating an order against a restaurant's menu.
// Kept free of Express/Mongo so it can be unit tested in isolation.

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.details = details;
  }
}

/**
 * Validates requested items against a restaurant and returns priced line items.
 * @param {object} restaurant - restaurant document (plain object or mongoose doc)
 * @param {Array<{menuItemId: string, quantity: number}>} items
 */
function validateOrderItems(restaurant, items) {
  if (!restaurant.isOpen) {
    throw new ValidationError(`Restaurant '${restaurant.name}' is currently closed`);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  const errors = [];
  const lines = [];

  for (const { menuItemId, quantity } of items) {
    const menuItem = restaurant.menu.find((m) => String(m.id ?? m._id) === String(menuItemId));
    if (!menuItem) {
      errors.push(`Menu item ${menuItemId} not found`);
    } else if (!menuItem.available) {
      errors.push(`Menu item '${menuItem.name}' is not available`);
    } else if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push(`Invalid quantity for '${menuItem.name}'`);
    } else {
      lines.push({
        menuItemId: String(menuItem.id ?? menuItem._id),
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity,
        lineTotal: Math.round(menuItem.price * quantity * 100) / 100,
      });
    }
  }

  if (errors.length) {
    throw new ValidationError('Order validation failed', errors);
  }

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  return {
    valid: true,
    restaurantId: String(restaurant.id ?? restaurant._id),
    restaurantName: restaurant.name,
    items: lines,
    subtotal,
  };
}

module.exports = { validateOrderItems, ValidationError };
