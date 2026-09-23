const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔴 ضع رابط MongoDB Atlas الخاص بك هنا كخيار احتياطي لضمان عدم توقف Vercel
// تنبيه: إذا كانت كلمة المرور تحتوي على رمز @ استبدله بـ %40
const FALLBACK_MONGODB_URI = "mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.mongodb.net/ready_db?retryWrites=true&w=majority";

const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  if (!MONGODB_URI || MONGODB_URI.includes("<USERNAME>")) {
    throw new Error('رابط الاتصال MONGODB_URI غير صحيح أو لم يتم إدخال بيانات المستخدم وكلمة السر بشكل صحيح');
  }

  await mongoose.connect(MONGODB_URI);
}

// Order Schema & Model
const orderSchema = new mongoose.Schema({
  customerName: { type: String, default: 'عميل تجريبي' },
  customerPhone: { type: String, default: '' },
  paymentMethod: { type: String, default: 'cash' },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running successfully! 🚀' });
});

// GET /api/orders - Fetch All Orders
app.get('/api/orders', async (req, res) => {
  try {
    await connectToDatabase();
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'فشل جلب الطلبات' });
  }
});

// POST /api/orders - Create New Order
app.post('/api/orders', async (req, res) => {
  try {
    await connectToDatabase();

    const { customerName, customerPhone, paymentMethod, items, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'السلة فارغة، لا يمكن إرسال طلب فارغ' });
    }

    const newOrder = new Order({
      customerName: customerName || 'عميل تجريبي',
      customerPhone: customerPhone || '',
      paymentMethod: paymentMethod || 'cash',
      items: items,
      totalAmount: Number(totalAmount) || 0,
      status: 'pending',
      createdAt: new Date()
    });

    await newOrder.save();

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الطلب بنجاح 🚀',
      order: newOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ في السيرفر أثناء إرسال الطلب'
    });
  }
});

// PATCH /api/orders/:id - Update Order Status
app.patch('/api/orders/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const { status } = req.body;
    const { id } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update Order Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'فشل تحديث حالة الطلب' });
  }
});

// Export for Vercel Serverless
module.exports = app;