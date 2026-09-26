const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// --- البيانات في الذاكرة ---
global.menu = global.menu || [
  { id: 1, name: "سمك بلطي مشوي - للكيلو", category: "أسماك", price: 180 },
  { id: 2, name: "وجبة كفتة مشوية", category: "مشويات", price: 150 },
  { id: 3, name: "بيتزا ميكس أجبان", category: "بيتزا", price: 120 }
];

global.drivers = global.drivers || [
  { id: 1, name: "أحمد محمود", phone: "01012345678", status: "متاح" },
  { id: 2, name: "محمد علي", phone: "01198765432", status: "متاح" }
];

global.orders = global.orders || [];

// --- APIs المنيو ---
app.get('/api/menu', (req, res) => res.json(global.menu));
app.post('/api/menu', (req, res) => {
    const newItem = { id: Date.now(), ...req.body };
    global.menu.push(newItem);
    res.status(201).json(newItem);
});

// --- APIs الكباتن ---
app.get('/api/drivers', (req, res) => {
    try {
        res.json(global.drivers);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
});

app.post('/api/drivers', (req, res) => {
    const newDriver = { id: Date.now(), status: 'متاح', ...req.body };
    global.drivers.push(newDriver);
    res.status(201).json(newDriver);
});

app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    global.drivers = global.drivers.filter(d => String(d.id) !== String(id));
    res.json({ message: 'تم الحذف بنجاح' });
});

// --- APIs الطلبات ---
app.get('/api/orders', (req, res) => res.json(global.orders));

app.post('/api/orders', (req, res) => {
    const newOrder = { 
        id: 'ord_' + Math.floor(Math.random() * 1000000), 
        status: 'قيد التحضير', 
        createdAt: new Date(),
        ...req.body 
    };
    global.orders.push(newOrder);
    res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, driverId } = req.body;
    const order = global.orders.find(o => String(o.id) === String(id));
    
    if (order) {
        if (status) order.status = status;
        if (driverId) order.driverId = driverId;
        return res.json(order);
    }
    res.status(404).json({ error: 'الطلب غير موجود' });
});

app.listen(PORT, () => console.log(`🚀 READY OS running on http://localhost:${PORT}`));