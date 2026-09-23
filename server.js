const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

// تهيئة تطبيق Express وسيرفر HTTP
const app = express();
const server = http.createServer(app);

// تهيئة Socket.io مع إعدادات CORS
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware للتعامل مع البيانات ورسائل JSON والملفات الاستاتيكية
app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// تهيئة مكتبة Stripe اختياريًا لضمان عدم توقف السيرفر عند غياب المفتاح
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// الاتصال بقاعدة بيانات MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ready-os';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// نموذج الطلب (Order Schema)
const orderSchema = new mongoose.Schema({
  customerName: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: 'تم التأكيد' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// --- المسارات (Routes) ---

// 1. مسار الصفحة الرئيسية للعميل
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

// 2. مسار لوحة السائق
app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'driver.html'));
});

// 3. مسار لوحة تحكم الأدمن
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'admin.html'));
});

// 4. API إنشاء طلب جديد
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    // إرسال تنبيه للسائقين والأدمن بوجود طلب جديد عبر Socket.io
    io.emit('new_order_available', newOrder);
    
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. API تحديث حالة الطلب
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // بث التحديث المباشر لجميع الأطراف
    io.emit('order_status_updated', { orderId: req.params.id, status });
    
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. API إنشاء جلسة دفع عبر Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        error: 'مفتاح STRIPE_SECRET_KEY غير مضاف في متغيرات البيئة (Environment Variables).' 
      });
    }

    const { orderId, amount } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'egp',
            product_data: {
              name: `طلب READY OS #${orderId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?status=success&orderId=${orderId}`,
      cancel_url: `${req.headers.origin}/?status=cancelled`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('خطأ في Stripe:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- إدارة اتصالات Socket.io اللحظية ---
io.on('connection', (socket) => {
  console.log('⚡ عميل جديد متصل:', socket.id);

  socket.on('join_order', (orderId) => {
    socket.join(orderId);
  });

  socket.on('driver_location_updated', (data) => {
    io.emit('driver_location_updated', data);
  });

  socket.on('update_status', (data) => {
    io.emit('order_status_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ انقطع اتصال العميل:', socket.id);
  });
});

// --- التشغيل المزدوج (التطوير المحلي + Vercel Serverless) ---
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
  });
}

module.exports = app;