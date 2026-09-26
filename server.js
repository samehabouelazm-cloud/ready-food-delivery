const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

// --- البيانات في الذاكرة (معرفات نصية موحدة) ---
global.menu = global.menu || [
  { id: "1", name: "سمك بلطي مشوي - للكيلو", category: "أسماك", price: 180 },
  { id: "2", name: "وجبة كفتة مشوية", category: "مشويات", price: 150 }
];

global.drivers = global.drivers || [
  { id: "101", name: "كابتن أحمد", phone: "01012345678", status: "متاح" }
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

// حذف الكابتن + إزالة إسناده من كافة الطلبات
app.delete('/api/drivers/:id', (req, res) => {
  const { id } = req.params;
  
  // 1. حذف الكابتن
  global.drivers = global.drivers.filter(d => String(d.id) !== String(id));

  // 2. تصفية جميع الطلبات الموكلة له وإعادتها لقيد الانتظار
  global.orders.forEach(order => {
    if (String(order.driverId) === String(id)) {
      order.driverId = null;
      order.status = 'قيد الانتظار';
    }
  });

  res.json({ message: 'تم حذف الكابتن وتنظيف الطلبات بنجاح' });
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

// تحديث حالة وإسناد الطلب مع التحقق الإجباري من وجود الكابتن
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, driverId, autoAssign } = req.body;
  
  const order = global.orders.find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  // في حالة الإسناد التلقائي
  if (autoAssign) {
    if (global.drivers.length === 0) {
      return res.status(400).json({ error: 'لا يوجد كباتن مسجلين حالياً لإسناد الطلب!' });
    }
    const driver = global.drivers[0];
    order.driverId = String(driver.id);
    order.status = 'في الطريق مع الكابتن';
    return res.json({ message: `تم إسناد الطلب للكابتن: ${driver.name}`, order });
  }

  // في حالة الإسناد اليدوي
  if (driverId) {
    const exists = global.drivers.some(d => String(d.id) === String(driverId));
    if (!exists) {
      return res.status(400).json({ error: 'الكابتن المختار غير موجود أو تم حذفه!' });
    }
    order.driverId = String(driverId);
    order.status = status || 'في الطريق مع الكابتن';
  } else if (status) {
    order.status = status;
  }

  res.json({ message: 'تم تحديث الطلب بنجاح', order });
});

app.listen(PORT, () => console.log(`🚀 READY OS running on http://localhost:${PORT}`));