const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const Order = require('./models/Order');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

io.on('connection', (socket) => {
  console.log('عميل متصل بـ Socket:', socket.id);
  socket.on('join_order', (orderId) => {
    socket.join(orderId);
  });
});

app.set('socketio', io);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ready_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بـ MongoDB بنجاح'))
  .catch((err) => console.error('❌ خطأ الاتصال:', err));

// Static Files
app.use(express.static(path.join(__dirname, 'customer_app')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'driver.html'));
});

// Get Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء الجلب', error: error.message });
  }
});

// Create Order + Socket Emit
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();

    const reqIo = req.app.get('socketio');
    if (reqIo) reqIo.emit('new_order_received', newOrder);

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Order Status + Socket Emit
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });

    const reqIo = req.app.get('socketio');
    if (reqIo) {
      reqIo.to(id).emit('order_status_updated', {
        orderId: id,
        status: status
      });
    }

    res.json({ message: 'تم تحديث حالة الطلب', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التحديث', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;