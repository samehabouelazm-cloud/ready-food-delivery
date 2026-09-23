const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// الاتصال بقاعدة بيانات MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ready-os')
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
const Order = mongoose.model('Order', orderSchema);

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
    
    // تنبيه السائقين والأدمن بوجود طلب جديد عبر Socket.io
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
    
    // إرسال تحديث الحالة لجميع المشتركين لحظياً
    io.emit('order_status_updated', { orderId: req.params.id, status });
    
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. API إنشاء جلسة دفع Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
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

// --- إدارة الاتصالات اللحظية (Socket.io) ---
io.on('connection', (socket) => {
  console.log('⚡ عميل جديد متصل:', socket.id);

  // الانضمام لغرفة طلب محدد
  socket.on('join_order', (orderId) => {
    socket.join(orderId);
  });

  // إرسال تحديث موقع السائق اللحظي للعميل والأدمن
  socket.on('driver_location_updated', (data) => {
    io.emit('driver_location_updated', data);
  });

  // إرسال تحديث حالة الطلب
  socket.on('update_status', (data) => {
    io.emit('order_status_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ انقطع اتصال العميل:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});