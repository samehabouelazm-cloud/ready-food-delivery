const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// --- البيانات في الذاكرة ---

global.menu = global.menu || [
    { id: 1, name: 'وجبة بيتزا مكس أجبان', price: 120, category: 'بيتزا' },
    { id: 2, name: 'برجر دجاج كلاسيك', price: 85, category: 'برجر' },
    { id: 3, name: 'وجبة شاورما عربي', price: 95, category: 'مشويات' }
];

// قائمة الكباتن مع مواقعهم الحالية (إحداثيات افتراضية)
global.drivers = global.drivers || [
    { id: 1, name: 'أحمد محمود', phone: '01012345678', status: 'متاح', location: { lat: 30.0444, lng: 31.2357 } },
    { id: 2, name: 'محمد علي', phone: '01198765432', status: 'متاح', location: { lat: 30.0500, lng: 31.2400 } }
];

global.orders = global.orders || [];

// دالة حساب المسافة بين نقطتين بالإحداثيات (بالكيلومتر) - Haversine Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2); // المسافة بـ كم
}

// --- مسارات الـ API للمنيو ---
app.get('/api/menu', (req, res) => res.json(global.menu));

// --- مسارات الـ API للكباتن ---

// جلب الكباتن مع حساب المسافة لطلب معين إن وُجد
app.get('/api/drivers', (req, res) => {
    const { targetLat, targetLng } = req.query;
    
    const driversWithDistance = global.drivers.map(driver => {
        let distance = null;
        if (targetLat && targetLng && driver.location) {
            distance = calculateDistance(driver.location.lat, driver.location.lng, parseFloat(targetLat), parseFloat(targetLng));
        }
        return { ...driver, distance: distance ? `${distance} كم` : 'غير محدد' };
    });

    res.json(driversWithDistance);
});

// إضافة كابتن جديد برقم الجوال والاسم
app.post('/api/drivers', (req, res) => {
    const { name, phone, lat, lng } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'يرجى إدخال اسم ورقم جوال الكابتن' });
    }
    const newDriver = {
        id: Date.now(),
        name,
        phone,
        status: 'متاح',
        location: { lat: lat || 30.0444, lng: lng || 31.2357 }
    };
    global.drivers.push(newDriver);
    res.status(201).json(newDriver);
});

// تحديث موقع الكابتن أو حالته
app.put('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const { status, location } = req.body;
    const driver = global.drivers.find(d => d.id == id);
    if (!driver) return res.status(404).json({ error: 'الكابتن غير موجود' });

    if (status) driver.status = status;
    if (location) driver.location = location;

    res.json(driver);
});

// --- مسارات الـ API للطلبات ---
app.get('/api/orders', (req, res) => res.json(global.orders));

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    global.orders.push(newOrder);
    res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, driverId } = req.body;
    const order = global.orders.find(o => o.id == id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    if (status) order.status = status;
    if (driverId) order.driverId = driverId;

    res.json(order);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 READY OS Server running on port: ${PORT}`);
});