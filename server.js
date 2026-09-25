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
    { id: 3, name: 'سمك بلطي مشوي - للكيلو', price: 160, category: 'مأكولات بحرية' }
];

// مصفوفة الكباتن الإفتراضية
global.drivers = global.drivers && global.drivers.length > 0 ? global.drivers : [
    { id: 1, name: 'أحمد محمود', phone: '01012345678', status: 'متاح', location: { lat: 30.0444, lng: 31.2357 } },
    { id: 2, name: 'محمد علي', phone: '01198765432', status: 'متاح', location: { lat: 30.0500, lng: 31.2400 } }
];

global.orders = global.orders || [];

// دالة حساب المسافة (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
}

// --- API المنيو ---
app.get('/api/menu', (req, res) => res.json(global.menu));

app.post('/api/menu', (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
    const newItem = { id: Date.now(), name, price: parseFloat(price), category: category || 'عام' };
    global.menu.push(newItem);
    res.status(201).json(newItem);
});

// --- API الكباتن ---
app.get('/api/drivers', (req, res) => {
    try {
        const { targetLat, targetLng } = req.query;
        const driversList = global.drivers.map(driver => {
            let distance = null;
            if (targetLat && targetLng && driver.location) {
                distance = calculateDistance(driver.location.lat, driver.location.lng, parseFloat(targetLat), parseFloat(targetLng));
            }
            return { ...driver, distance: distance ? `${distance} كم` : 'غير محدد' };
        });
        res.json(driversList);
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ في السيرفر' });
    }
});

app.post('/api/drivers', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'الاسم ورقم الجوال مطلوبان' });
    
    const newDriver = {
        id: Date.now(),
        name,
        phone,
        status: 'متاح',
        location: { lat: 30.0444, lng: 31.2357 }
    };
    global.drivers.push(newDriver);
    res.status(201).json(newDriver);
});

app.put('/api/drivers/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const driver = global.drivers.find(d => d.id == id);
    if (!driver) return res.status(404).json({ error: 'الكابتن غير موجود' });
    
    driver.status = status;
    res.json(driver);
});

// --- API الطلبات ---
app.get('/api/orders', (req, res) => res.json(global.orders));

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: 'ord_' + Date.now(),
        ...req.body,
        status: 'pending',
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
    if (driverId) {
        order.driverId = driverId;
        const driver = global.drivers.find(d => d.id == driverId);
        if (driver) driver.status = 'مشغول';
    }

    res.json(order);
});

// توجيه الصفحات
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'customer_app', 'index.html')));

app.listen(PORT, () => console.log(`🚀 READY OS Server running on port: ${PORT}`));
// مسار حذف كابتن بواسطة ID
app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = global.drivers.length;
    
    // التصفية لمطابقة ID سواء كان نوعه String أو Number
    global.drivers = global.drivers.filter(d => String(d.id) !== String(id));

    if (global.drivers.length === initialLength) {
        return res.status(404).json({ error: 'الكابتن غير موجود' });
    }

    res.json({ message: 'تم حذف الكابتن بنجاح' });
});