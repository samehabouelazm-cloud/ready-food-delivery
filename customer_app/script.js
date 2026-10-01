function sendOrderToSystem(orderData) {
    try {
        const newOrder = {
            id: 'ORD-' + Date.now(),
            customerName: orderData.customerName || 'عميل كريم',
            details: orderData.details || orderData.items || 'طلب جديد',
            total: orderData.total || 0,
            createdAt: new Date().toLocaleTimeString()
        };

        // جلب الطلبات أو إنشاء مصفوفة جديدة
        let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
        orders.push(newOrder);
        
        // حفظ إجباري في التخزين المشترك
        localStorage.setItem('ready_orders', JSON.stringify(orders));
        
        // تنبيه صوتي فوري للعميل أو للسيستم
        try {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => {});
        } catch (e) {}

        alert("🎉 تم إرسال طلبك بنجاح!");

    } catch (err) {
        console.error("خطأ في إرسال الطلب:", err);
    }
}
// دالة إتمام الطلب وحفظه في التخزين المشترك
function checkoutOrder() {
    try {
        // جمع بيانات العميل من الحقول
        const customerNameInput = document.querySelector('input[placeholder*="اسم"]') || document.getElementById('customerName');
        const customerPhoneInput = document.querySelector('input[placeholder*="الجوال"]') || document.getElementById('customerPhone');
        const customerAddressInput = document.querySelector('input[placeholder*="العنوان"]') || document.getElementById('customerAddress');

        const orderData = {
            id: 'ORD-' + Date.now(),
            customerName: customerNameInput ? customerNameInput.value : 'عميل كريم',
            phone: customerPhoneInput ? customerPhoneInput.value : 'غير متوفر',
            address: customerAddressInput ? customerAddressInput.value : 'توصيل سريع',
            details: 'طلب جديد من قائمة المأكولات',
            total: 0, // أو القيمة الإجمالية من السلة
            createdAt: new Date().toLocaleTimeString()
        };

        // جلب الطلبات القديمة أو مصفوفة فارغة
        let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
        orders.push(orderData);
        
        // حفظ البيانات في localStorage
        localStorage.setItem('ready_orders', JSON.stringify(orders));
        
        alert("🎉 تم إرسال طلبك بنجاح! سيتم تحويله للوحة الإدارة فوراً.");
        
        // تحديث الصفحة أو تصفير السلة إن أمكن
    } catch (err) {
        console.error("خطأ أثناء إرسال الطلب:", err);
    }
}

// ربط الدالة بزرار إتمام الطلب تلقائياً عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.querySelector('button[id*="checkout"], button[class*="checkout"], .btn-checkout, button:last-of-type');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutOrder);
    }
});