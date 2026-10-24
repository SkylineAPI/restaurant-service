const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, default: 'Main Course' },
  available: { type: Boolean, default: true },
});

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
    menu: [menuItemSchema],
  },
  { timestamps: true }
);

// Expose `id` instead of `_id` in API responses
const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
};
menuItemSchema.set('toJSON', toJSON);
restaurantSchema.set('toJSON', toJSON);

module.exports = mongoose.model('Restaurant', restaurantSchema);
