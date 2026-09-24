const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'customer_app')));

const MONGODB_URI = process.env.MONGODB_URI;

// تحسين طريقة الاتصال لمنع الـ Timeout في Vercel
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    if (!MONGODB_URI) {
    }

    mongoose.set('strictQuery', false);
    cachedDb = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // مهلة 5 ثوانٍ بحد أقصى
        socketTimeoutMS: 45000,
    });
    return cachedDb;
}

// Order Schema
const orderSchema = new mongoose.Schema({
    customerName: { type: String, default: 'عميل جديد' },
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
    driverName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ==================== ENDPOINTS ====================

app.post('/api/orders', async (req, res) => {
    try {
        await connectToDatabase();
        const orderData = req.body;

        if (!orderData || !orderData.totalAmount) {
            return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
        }

        const newOrder = new Order(orderData);
        await newOrder.save();
        return res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error("MongoDB Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        await connectToDatabase();
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/orders/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        return res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/orders/:id/assign', async (req, res) => {
    try {
        await connectToDatabase();
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                driverName: req.body.driverName || 'كابتن التوصيل',
                status: 'delivering'
            },
            { new: true }
        );
        return res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}