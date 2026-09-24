const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// تقديم الملفات الثابتة (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'customer_app')));

// الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;
async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }
    if (!MONGODB_URI) {
        throw new Error("متغير البيئة MONGODB_URI غير معرف!");
    }
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
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
    status: { type: String, default: 'pending' }, // pending, accepted, rejected
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ==================== ENDPOINTS / API ====================

// 1. استقبال طلب جديد من العميل
app.post('/api/orders', async (req, res) => {
    try {
        await connectToDatabase();
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ success: true, message: 'تم إرسال الطلب بنجاح', order: newOrder });
    } catch (error) {
        console.error("خطأ في حفظ الطلب:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. جلب جميع الطلبات للوحة الإدارة
app.get('/api/orders', async (req, res) => {
    try {
        await connectToDatabase();
        const orders = await Order.find().sort({ createdAt: -1 }); // الأحدث أولاً
        res.status(200).json(orders);
    } catch (error) {
        console.error("خطأ في جلب الطلبات:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. تحديث حالة الطلب من الإدارة (موافقة / إلغاء)
app.patch('/api/orders/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status: status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        }

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error("خطأ في تحديث الحالة:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// التوافق مع Vercel Serverless Functions
module.exports = app;

// التشغيل المحلي فقط
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
// 1. تحديث الـ Schema ليشمل بيانات الكابتن
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
    status: { type: String, default: 'pending' }, // pending, accepted, delivering, rejected
    driverName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// 2. إضافة Endpoint استلام الكابتن للطلب
app.patch('/api/orders/:id/assign', async (req, res) => {
    try {
        await connectToDatabase();
        const { id } = req.params;
        const { driverName } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { 
                driverName: driverName || 'كابتن التوصيل',
                status: 'delivering' // تغيير الحالة إلى جاري التوصيل
            },
            { new: true }
        );

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error("خطأ في إسناد الطلب للكابتن:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});