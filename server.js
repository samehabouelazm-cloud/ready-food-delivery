const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

const DATA_FILE = path.join(__dirname, 'data.json');

// دالة قراءة البيانات
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      drivers: [{ id: "101", name: "كابتن محمد", phone: "01198765432" }],
      orders: [],
      menu: [{ id: "1", name: "وجبة كفتة", category: "مشويات", price: 150 }]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { drivers: [], orders: [], menu: [] };
  }
}

// دالة حفظ البيانات
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- APIs الكباتن ---
app.get('/api/drivers', (req, res) => {
  const db = readData();
  res.json(db.drivers);
});

app.post('/api/drivers', (req, res) => {
  const db = readData();
  const newDriver = { id: Date.now().toString(), ...req.body };
  db.drivers.push(newDriver);
  saveData(db);
  res.status(201).json(newDriver);
});

// الحذف الحقيقي والدائم للطلب والكابتن
app.delete('/api/drivers/:id', (req, res) => {
  const db = readData();
  const id = String(req.params.id);

  // حذف الكابتن نهائياً من الملف
  db.drivers = db.drivers.filter(d => String(d.id) !== id);

  // إزالة إسناده من جميع الطلبات
  db.orders.forEach(o => {
    if (String(o.driverId) === id) {
      o.driverId = null;
      o.status = 'قيد الانتظار';
    }
  });

  saveData(db);
  res.json({ message: 'تم الحذف الدائم وتحديث الملف بنجاح' });
});

// --- APIs الطلبات ---
app.get('/api/orders', (req, res) => {
  const db = readData();
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = readData();
  const newOrder = {
    id: 'ord_' + Math.floor(Math.random() * 1000000),
    status: 'قيد الانتظار',
    driverId: null,
    createdAt: new Date(),
    ...req.body
  };
  db.orders.push(newOrder);
  saveData(db);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { status, driverId, autoAssign } = req.body;

  const order = db.orders.find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  if (autoAssign) {
    if (db.drivers.length === 0) {
      return res.status(400).json({ error: 'لا يوجد كباتن مسجلين حالياً!' });
    }
    const driver = db.drivers[0];
    order.driverId = String(driver.id);
    order.status = 'في الطريق مع الكابتن';
    saveData(db);
    return res.json({ message: `تم إسناد الطلب للكابتن: ${driver.name}`, order });
  }

  if (driverId) {
    const exists = db.drivers.some(d => String(d.id) === String(driverId));
    if (!exists) {
      return res.status(400).json({ error: 'هذا الكابتن غير موجود أو تم حذفه!' });
    }
    order.driverId = String(driverId);
    order.status = status || 'في الطريق مع الكابتن';
  } else if (status) {
    order.status = status;
  }

  saveData(db);
  res.json({ message: 'تم تحديث الطلب بنجاح', order });
});

// --- APIs المنيو ---
app.get('/api/menu', (req, res) => res.json(readData().menu));

app.listen(PORT, () => console.log(`🚀 READY OS running on http://localhost:${PORT}`));