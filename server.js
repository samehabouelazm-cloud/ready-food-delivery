const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const Order = require('./models/Order');

const app = express();
const server = http.createServer(app);

// إعداد Socket.io مع دعم CORS لتجنب أي مشاكل اتصال
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Middleware لقراءة الـ JSON
app.use(express.json());

// خدمة الملفات الاستاتيكية من مجلد customer_app
app.use(express.static(path.join(__dirname, 'customer_app')));

// الاتصال بقاعدة بيانات MongoDB Atlas (مع وجود رابط احتياطي)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.mongodb.net/ready_delivery?retryWrites=true&w=wmajority";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ تم الاتصال بنجاح بقاعدة البيانات MongoDB Atlas'))
.catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message));

// ==================== [ Routes - المسارات ] ====================

// الصفحة الرئيسية (واجهة العميل)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

// صفحة السائق
app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'driver.html'));
});

// 1. إنشاء طلب جديد (POST)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, items, totalAmount, status } = req.body;
    const newOrder = new Order({
      customerName: customerName || "عميل تجريبي",
      items: items || [],
      totalAmount: totalAmount || 0,
      status: status || "معلق"
    });

    const savedOrder = await newOrder.save();

    // إرسال تنبيه فوراً عبر Socket.io بوجود طلب جديد
    io.emit('new_order_received', savedOrder);

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. تحديث حالة الطلب (PATCH)
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: "الطلب غير موجود" });
    }

    // إرسال تحديث الحالة عبر Socket.io
    io.emit('order_status_updated', {
      orderId: updatedOrder._id,
      status: updatedOrder.status
    });

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== [ Socket.io Events ] ====================
io.on('connection', (socket) => {
  console.log('⚡ مستخدم جديد متصل:', socket.id);

  // انضمام العميل لغرفة الطلب الخاص به
  socket.on('join_order', (orderId) => {
    socket.join(orderId);
    console.log(`مستخدم انضم للغرفة الخاصة بالطلب: ${orderId}`);
  });

  // تحديث حالة الطلب اللحظية
  socket.on('update_status', (data) => {
    io.emit('order_status_updated', data);
  });

  // بث موقع السائق اللحظي للعميل (الخريطة)
  socket.on('driver_location_updated', (data) => {
    io.emit('driver_location_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 تم قطع الاتصال:', socket.id);
  });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل بنجاح على المنفذ: ${PORT}`);
});

module.exports = app;