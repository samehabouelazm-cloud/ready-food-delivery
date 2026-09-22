const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, default: 'عميل' },
  address: { type: String, required: true },
  items: [
    {
      title: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_delivery', 'completed'], 
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);