const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// تقديم الملفات الثابتة من مجلد customer_app
app.use(express.static(path.join(__dirname, 'customer_app')));

// ==========================================
// 1. قواعد البيانات المؤقتة (في الذاكرة)
// ==========================================

let menu = [
    { id: '1', name: 'برجر كلاسيك', category: 'برجر', price: 120, imageUrl: 'https://via.placeholder.com/150' },
    { id: '2', name: 'بيتزا مارجريتا', category: 'بيتزا', price: 150, imageUrl: 'https://via.placeholder.com/150' },
    { id: '3', name: 'شاورما دجاج', category: 'مشويات', price: 90, imageUrl: 'https://via.placeholder.com/150' }
];

let orders = [
    {
        _id: 'ord_' + Date.now(),
        customerName: 'أحمد محمود',
        customerPhone: '01012345678',
        notes: 'بدون بصل، صوص ثوم إضافي',
        items: [{ name: 'برجر كلاسيك', price: 120, quantity: 1 }],
        totalAmount: 120,
        status: 'pending',
        driverName: '',
        driverPhone: '',
        location: { lat: 30.0444, lng: 31.2357 },
        createdAt: new Date()
    }
];

let drivers = [
    { id: 'drv_1', name: 'كابتن محمد', phone: '01122334455', isAvailable: true, lat: 30.0444, lng: 31.2357 },
    { id: 'drv_2', name: 'كابتن علي', phone: '01555667788', isAvailable: true, lat: 30.0500, lng: 31.2400 }
];

let isStoreOpen = true;

// ==========================================
// 2. مسارات التوجيه للصفحات (Page Routes)
// ==========================================

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer_app', 'admin.html'));
});

app.get('/driver.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer_app', 'driver.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer_app', 'index.html'));
});

// ==========================================
// 3. الروابط البرمجية للمنيو (Menu APIs)
// ==========================================

// جلب كامل المنيو
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// إضافة وجبة جديدة
app.post('/api/menu', (req, res) => {
    const { name, category, price, imageUrl } = req.body;
    if (!name || !category || !price) {
        return res.status(400).json({ success: false, message: 'يرجى إكمال البيانات المطلوبة' });
    }
    const newItem = {
        id: Date.now().toString(),
        name,
        category,
        price: Number(price),
        imageUrl: imageUrl || 'https://via.placeholder.com/150'
    };
    menu.push(newItem);
    res.json({ success: true, item: newItem });
});

// حذف وجبة من المنيو
app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    menu = menu.filter(item => item.id !== id && item._id !== id);
    res.json({ success: true, message: 'تم حذف الصنف من المنيو' });
});

// ==========================================
// 4. الروابط البرمجية للطلبات (Orders APIs)
// ==========================================

// جلب جميع الطلبات
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// إنشاء طلب جديد من قبل العميل
app.post('/api/orders', (req, res) => {
    if (!isStoreOpen) {
        return res.status(400).json({ success: false, message: 'المطعم مغلق حالياً، يرجى المحاولة لاحقاً.' });
    }
    const { customerName, customerPhone, items, totalAmount, notes, location } = req.body;
    const newOrder = {
        _id: 'ord_' + Date.now(),
        customerName: customerName || 'عميل',
        customerPhone: customerPhone || '',
        notes: notes || '',
        items: items || [],
        totalAmount: Number(totalAmount) || 0,
        status: 'pending',
        driverName: '',
        driverPhone: '',
        location: location || { lat: 30.0444, lng: 31.2357 },
        createdAt: new Date()
    };
    orders.unshift(newOrder);
    res.json({ success: true, order: newOrder });
});

// تحديث حالة الطلب أو الكابتن
app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o._id === id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    Object.assign(order, req.body);
    res.json({ success: true, order });
});

// حذف طلب
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter(o => o._id !== id);
    res.json({ success: true, message: 'تم حذف الطلب' });
});

// الإسناد التلقائي للطلب للكابتن المتاح
app.post('/api/orders/:id/auto-assign', (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o._id === id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const availableDriver = drivers.find(d => d.isAvailable);
    if (!availableDriver) {
        return res.status(400).json({ success: false, message: 'لا يوجد كباتن متاحون حالياً' });
    }

    order.driverName = availableDriver.name;
    order.driverPhone = availableDriver.phone;
    order.status = 'delivering';

    res.json({
        success: true,
        message: `تم إسناد الطلب للكابتن: ${availableDriver.name}`,
        order
    });
});

// ==========================================
// 5. إحصائيات النظام وحالة المطعم
// ==========================================

app.get('/api/stats', (req, res) => {
    const totalSales = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    res.json({
        totalOrders: orders.length,
        pendingOrders: pendingOrders,
        totalSales: totalSales,
        isStoreOpen: isStoreOpen
    });
});

app.post('/api/store/toggle', (req, res) => {
    isStoreOpen = !isStoreOpen;
    res.json({ success: true, isStoreOpen: isStoreOpen });
});

// ==========================================
// 6. تشغيل السيرفر
// ==========================================

const PORT = process.env.PORT || 3000;
// قائمة الكباتن في الذاكرة
global.drivers = global.drivers || [
    { id: 1, name: 'أحمد محمود', phone: '01012345678', status: 'متاح' },
    { id: 2, name: 'محمد علي', phone: '01198765432', status: 'مشغول' }
];

// مسار جلب قائمة الكباتن
app.get('/api/drivers', (req, res) => {
    res.json(global.drivers);
});

// مسار إضافة كابتن جديد
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
app.listen(PORT, () => {
    console.log(`🚀 READY OS Server running on port: ${PORT}`);
});