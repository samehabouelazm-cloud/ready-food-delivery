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
  { id: "1", name: "كابتن محمد", phone: "01198765432", status: "متاح" }
];

global.orders = global.orders || [];

// --- APIs المنيو ---
app.get('/api/menu', (req, res) => res.json(global.menu));
app.post('/api/menu', (req, res) => {
    const newItem = { id: Date.now().toString(), ...req.body };
    global.menu.push(newItem);
    res.status(201).json(newItem);
});

// --- APIs الكباتن ---
app.get('/api/drivers', (req, res) => res.json(global.drivers));

app.post('/api/drivers', (req, res) => {
    const newDriver = { id: Date.now().toString(), status: 'متاح', ...req.body };
    global.drivers.push(newDriver);
    res.status(201).json(newDriver);
});

app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    
    // 1. حذف الكابتن من القائمة
    global.drivers = global.drivers.filter(d => String(d.id) !== String(id));

    // 2. إلغاء إسناد أية طلبات كانت مخصصة له
    global.orders.forEach(order => {
        if (String(order.driverId) === String(id)) {
            order.driverId = null;
            order.status = 'قيد الانتظار';
        }
    });

    res.json({ message: 'تم حذف الكابتن بنجاح' });
});

// --- APIs الطلبات ---
app.get('/api/orders', (req, res) => res.json(global.orders));

app.post('/api/orders', (req, res) => {
    const newOrder = { 
        id: 'ord_' + Math.floor(Math.random() * 1000000), 
        status: 'قيد الانتظار', 
        driverId: null,
        createdAt: new Date(),
        ...req.body 
    };
    global.orders.push(newOrder);
    res.status(201).json(newOrder);
});

// مسار الإسناد التلقائي / اليدوي
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    let { status, driverId, autoAssign } = req.body;
    
    const order = global.orders.find(o => String(o.id) === String(id));
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    // إذا تم اختيار "إسناد تلقائي"
    if (autoAssign) {
        if (global.drivers.length === 0) {
            return res.status(400).json({ error: 'لا يوجد كباتن متوفرين حالياً لإسناد الطلب!' });
        }
        // اختيار أول كابتن موجود وقائم بالفعل
        const selectedDriver = global.drivers[0];
        order.driverId = selectedDriver.id;
        order.status = 'في الطريق مع الكابتن';
        return res.json({ message: `تم إسناد الطلب للكابتن: ${selectedDriver.name}`, order });
    }

    if (status !== undefined) order.status = status;
    if (driverId !== undefined) order.driverId = driverId;

    res.json({ message: 'تم تحديث حالة الطلب', order });
});

app.listen(PORT, () => console.log(`🚀 READY OS running on http://localhost:${PORT}`));