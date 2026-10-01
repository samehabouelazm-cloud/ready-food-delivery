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
        // جمع بيانات العميل من الحقول الموجودة في الصفحة
        const nameInput = document.querySelector('input[placeholder*="اسم"]') || document.getElementById('customerName');
        const phoneInput = document.querySelector('input[placeholder*="الجوال"]') || document.getElementById('customerPhone');
        const addressInput = document.querySelector('input[placeholder*="العنوان"]') || document.getElementById('customerAddress');

        const customerName = nameInput ? nameInput.value.trim() : '';
        const customerPhone = phoneInput ? phoneInput.value.trim() : '';
        const customerAddress = addressInput ? addressInput.value.trim() : '';

        // التحقق من إدخال البيانات الأساسية
        if (!customerName || !customerPhone) {
            alert("من فضلك أدخل الاسم ورقم الجوال لتمكننا من تنفيذ طلبك.");
            return;
        }

        // رقم واتساب المطعم/الإدارة الخاص بك (حط رقمك هنا بالدولة، مثلاً: 201xxxxxxxx+)
        const adminWhatsAppNumber = "201034101822"; // استبدل هذا الرقم برقمك الصحيح

        // تجهيز نص رسالة الطلب
        let message = `🛒 *طلب جديد عبر منصة جاهز*\n\n`;
        message += `👤 *الاسم:* ${customerName}\n`;
        message += `📱 *الجوال:* ${customerPhone}\n`;
        message += `📍 *العنوان:* ${customerAddress || 'توصيل سريع'}\n\n`;
        message += `🚀 *تم إرسال الطلب بنجاح بانتظار التأكيد!*`;

        // ترميز الرسالة لتتوافق مع روابط الواتساب
        const encodedMessage = encodeURIComponent(message);
        
        // فتح تطبيق واتساب أو الويب مباشرة بالرسالة الجاهزة
        const whatsappURL = `https://wa.me/${adminWhatsAppNumber}?text=${encodedMessage}`;
        
        window.open(whatsappURL, '_blank');
        
        alert("🎉 تم إرسال طلبك وتحويلك للواتساب بنجاح!");

    } catch (err) {
        console.error("خطأ أثناء معالجة الطلب:", err);
        alert("حدث خطأ بسيط، يرجى المحاولة مرة أخرى.");
    }
}

// ربط الدالة بزرار إتمام الطلب تلقائياً
document.addEventListener('DOMContentLoaded', () => {
    // البحث عن زر إتمام الطلب بناءً على النصوص الشائعة
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent.includes('إتمام') || btn.textContent.includes('طلب') || btn.textContent.includes('السلة')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                checkoutOrder();
            });
        }
    });
});