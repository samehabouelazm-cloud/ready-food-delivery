const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Order = require('./models/Order');

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ready_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح!'))
  .catch((err) => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

app.use(express.static(path.join(__dirname, 'customer_app')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'driver.html'));
});

// إرسال طلب جديد
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      customerName: req.body.customerName || 'عميل تجريبي',
      address: req.body.address || 'القاهرة',
      items: req.body.items || [],
      totalAmount: req.body.totalAmount || 0,
      status: 'pending'
    });
    await newOrder.save();
    console.log('✅ تم حفظ طلب جديد:', newOrder._id);
    res.status(201).json({ message: 'تم استلام الطلب', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء الحفظ', error: error.message });
  }
});

// جلب الطلبات
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء الجلب', error: error.message });
  }
});

// تحديث حالة الطلب
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: 'تم تحديث حالة الطلب', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التحديث', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});