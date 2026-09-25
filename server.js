const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// تقديم الملفات الثابتة لجميع التطبيقات (العملاء، الإدارة، الكباتن)
app.use(express.static(path.join(__dirname, 'customer_app')));

// ==========================================
// 1. قاعدة البيانات المؤقتة (في الذاكرة)
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
        createdAt: new Date()
    }
];

let drivers = [
    { id: 'drv_1', name: 'كابتن محمد', phone: '01122334455', isAvailable: true, lat: 30.0444, lng: 31.2357 },
    { id: 'drv_2', name: 'كابتن علي', phone: '01555667788', isAvailable: true, lat: 30.0500, lng: 31.2400 }
];

let isStoreOpen = true;

// ==========================================
// 2. الروابط البرمجية الخاصة بالمنيو (Menu APIs)
// ==========================================

// جلب كامل المنيو للعملاء ولوحة التحكم
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// إضافة وجبة جديدة من لوحة التحكم
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
// 3. الروابط البرمجية للطلبات (Orders APIs)
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
    const { customerName, customerPhone, items, totalAmount, notes } = req.body;
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
        createdAt: new Date()
    };
    orders.unshift(newOrder);
    res.json({ success: true, order: newOrder });
});

// تعديل أو تحديث طلب (حالة الطلب، إسناد كابتن، إلغاء كابتن)
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

// الإسناد التلقائي للكابتن الأقرب
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
// 4. إحصائيات لوحة التحكم وحالة المطعم
// ==========================================

// جلب إحصائيات المبيعات والطلبات وحالة المطعم
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

// فتح أو إغلاق المطعم
app.post('/api/store/toggle', (req, res) => {
    isStoreOpen = !isStoreOpen;
    res.json({ success: true, isStoreOpen: isStoreOpen });
});

// ==========================================
// 5. التشغيل
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل بنجاح على البورت: ${PORT}`);
});