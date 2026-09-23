const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// مسار المجلد الاستاتيكي بشكل مطلق وصحيح لـ Vercel
const publicPath = path.join(process.cwd(), 'customer_app');
app.use(express.static(publicPath));

// تهيئة Stripe بدون التسبب في توقف السيرفر
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// دالة اتصال MongoDB آمنة
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI غير مضاف في متغيّرات البيئة');
    return;
  }
  return mongoose.connect(uri);
};

// Middleware مرن للاتصال بقاعدة البيانات
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
  next();
});

// Mongoose Schema
const orderSchema = new mongoose.Schema({
  customerName: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: 'تم التأكيد' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// المسارات (Routes)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/driver', (req, res) => {
  res.sendFile(path.join(publicPath, 'driver.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    io.emit('new_order_available', newOrder);
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    io.emit('order_status_updated', { orderId: req.params.id, status: req.body.status });
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Socket.io Events
io.on('connection', (socket) => {
  socket.on('join_order', (id) => socket.join(id));
  socket.on('driver_location_updated', (data) => io.emit('driver_location_updated', data));
  socket.on('update_status', (data) => io.emit('order_status_updated', data));
});

// التشغيل والتصدير لـ Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
}

module.exports = app;