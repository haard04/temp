// backend/models/Product.js
const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  price: String,
  date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  title: String,
  url: String,
  description: String,
  highlights: String,
  rating: String,
  reviews: String,
  imageUrl: String,
  totalPurchases: String,
  priceHistory: [priceHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
