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
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { drivers: [], orders: [], menu: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// APIs الكباتن
app.get('/api/drivers', (req, res) => res.json(readData().drivers));

app.post('/api/drivers', (req, res) => {
  const db = readData();
  const newDriver = { id: Date.now().toString(), ...req.body };
  db.drivers.push(newDriver);
  saveData(db);
  res.status(201).json(newDriver);
});

app.delete('/api/drivers/:id', (req, res) => {
  const db = readData();
  const id = String(req.params.id);

  db.drivers = db.drivers.filter(d => String(d.id) !== id);
  db.orders.forEach(o => {
    if (String(o.driverId) === id) {
      o.driverId = null;
      o.status = 'قيد الانتظار';
    }
  });

  saveData(db);
  res.json({ message: 'تم حذف الكابتن وتنظيف التكليفات' });
});

// APIs الطلبات
app.get('/api/orders', (req, res) => res.json(readData().orders));

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

// الإسناد اليدوي المباشر للطلب
app.put('/api/orders/:id/assign', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { driverId } = req.body;

  const order = db.orders.find(o => String(o.id) === String(id));
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  if (!driverId) {
    return res.status(400).json({ error: 'يرجى اختيار كابتن لإسناد الطلب' });
  }

  const driver = db.drivers.find(d => String(d.id) === String(driverId));
  if (!driver) {
    return res.status(400).json({ error: 'الكابتن المختار غير موجود بالقائمة أو تم حذفه' });
  }

  order.driverId = String(driver.id);
  order.status = `جاري التوصيل مع (${driver.name})`;

  saveData(db);
  res.json({ message: `تم إسناد الطلب بنجاح للكابتن ${driver.name}`, order });
});

// APIs المنيو
app.get('/api/menu', (req, res) => res.json(readData().menu));

app.listen(PORT, () => console.log(`🚀 READY OS running on http://localhost:${PORT}`));