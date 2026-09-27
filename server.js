const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer_app')));

const DATA_FILE = path.join(__dirname, 'data.json');

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
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { drivers: [], orders: [], menu: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("خطأ في حفظ البيانات:", e);
  }
}

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

// APIs الكباتن
app.get('/api/drivers', (req, res) => {
  const db = readData();
  res.json(db.drivers || []);
});

app.post('/api/drivers', (req, res) => {
  const db = readData();
  const newDriver = { id: Date.now().toString(), ...req.body };
  if (!db.drivers) db.drivers = [];
  db.drivers.push(newDriver);
  saveData(db);
  res.status(201).json(newDriver);
});

app.delete('/api/drivers/:id', (req, res) => {
  const db = readData();
  const id = String(req.params.id);
  db.drivers = (db.drivers || []).filter(d => String(d.id) !== id);
  (db.orders || []).forEach(o => {
    if (String(o.driverId) === id) {
      o.driverId = null;
      o.status = 'قيد الانتظار';
    }
  });
  saveData(db);
  res.json({ message: 'تم الحذف' });
});

// APIs الطلبات
app.get('/api/orders', (req, res) => {
  const db = readData();
  res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
  const db = readData();
  const newOrder = {
    id: 'ord_' + Math.floor(Math.random() * 1000000),
    status: 'قيد الانتظار',
    driverId: null,
    createdAt: new Date(),
    driverLocation: { lat: 31.584, lng: 31.085 },
    ...req.body
  };
  if (!db.orders) db.orders = [];
  db.orders.push(newOrder);
  saveData(db);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/assign', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { driverId } = req.body;
  
  const order = (db.orders || []).find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  const driver = (db.drivers || []).find(d => String(d.id) === String(driverId));
  if (!driver) return res.status(400).json({ error: 'الكابتن غير موجود' });

  order.driverId = String(driver.id);
  order.status = `جاري التوصيل مع (${driver.name})`;
  saveData(db);
  res.json({ message: `تم إسناد الطلب للكابتن ${driver.name}`, order });
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { status, location } = req.body;

  const order = (db.orders || []).find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  if (status) order.status = status;
  if (location) order.driverLocation = location;
  saveData(db);
  res.json({ message: 'تم تحديث الحالة بنجاح', order });
});

// APIs المنيو
app.get('/api/menu', (req, res) => {
  const db = readData();
  res.json(db.menu || []);
});

app.listen(PORT, () => console.log(`🚀 جاهز في بلطيم شغال على http://localhost:${PORT}`));