const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware لتمرير بيانات JSON والملفات الاستاتيكية
app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// --- قواعد البيانات في الذاكرة (In-Memory Data) ---

// 1. القائمة الأولية للمنيو
global.menu = global.menu || [
    { id: 1, name: 'وجبة بيتزا مكس أجبان', price: 120, category: 'بيتزا' },
    { id: 2, name: 'برجر دجاج كلاسيك', price: 85, category: 'برجر' },
    { id: 3, name: 'وجبة شاورما عربي', price: 95, category: 'مشويات' }
];

// 2. قائمة الكباتن الأولية
global.drivers = global.drivers || [
    { id: 1, name: 'أحمد محمود', phone: '01012345678', status: 'متاح' },
    { id: 2, name: 'محمد علي', phone: '01198765432', status: 'مشغول' }
];

// 3. قائمة الطلبات الأولية
global.orders = global.orders || [];

// --- مسارات الـ API الخاصة بالمنيو (Menu API) ---

app.get('/api/menu', (req, res) => {
    res.json(global.menu);
});

app.post('/api/menu', (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'يرجى إدخال اسم الوجبة والسعر' });
    }
    const newItem = { id: Date.now(), name, price: parseFloat(price), category: category || 'عام' };
    global.menu.push(newItem);
    res.status(201).json(newItem);
});

// --- مسارات الـ API الخاصة بالكباتن (Drivers API) ---

// جلب قائمة الكباتن
app.get('/api/drivers', (req, res) => {
    res.json(global.drivers);
});

// إضافة كابتن جديد
app.post('/api/drivers', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'يرجى إدخال اسم ورقم هاتف الكابتن' });
    }
    const newDriver = {
        id: Date.now(),
        name,
        phone,
        status: 'متاح'
    };
    global.drivers.push(newDriver);
    res.status(201).json(newDriver);
});

// تحديث حالة الكابتن
app.put('/api/drivers/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const driver = global.drivers.find(d => d.id == id);
    if (!driver) {
        return res.status(404).json({ error: 'الكابتن غير موجود' });
    }
    driver.status = status;
    res.json(driver);
});

// --- مسارات الـ API الخاصة بالطلبات (Orders API) ---

// جلب جميع الطلبات
app.get('/api/orders', (req, res) => {
    res.json(global.orders);
});

// جلب طلب محدد بواسطة ID
app.get('/api/orders/:id', (req, res) => {
    const order = global.orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json(order);
});

// إنشاء طلب جديد
app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        ...orderData,
        createdAt: new Date().toISOString()
    };
    global.orders.push(newOrder);
    res.status(201).json(newOrder);
});

// تحديث حالة الطلب وإسناد الكابتن
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, driverId } = req.body;
    const order = global.orders.find(o => o.id == id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    if (status) order.status = status;
    if (driverId) order.driverId = driverId;

    res.json(order);
});

// --- توجيه الصفحات الرئيسية ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 READY OS Server running on port: ${PORT}`);
});