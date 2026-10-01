function sendOrderToSystem(orderData) {
    try {
        // تجهيز بيانات الطلب الجديد
        const newOrder = {
            id: 'ORD-' + Date.now(),
            items: orderData.items || [],
            total: orderData.total || 0,
            customerName: orderData.customerName || 'عميل كريم',
            phone: orderData.phone || '',
            address: orderData.address || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // جلب الطلبات الحالية من التخزين المشترك
        let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
        orders.push(newOrder);
        
        // حفظ القائمة المحدثة
        localStorage.setItem('ready_orders', JSON.stringify(orders));
        localStorage.removeItem('ready_cart');

        // تنبيه صوتي لو متاح
        try {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log("Audio blocked"));
        } catch (e) {}

        console.log("تم حفظ الطلب بنجاح:", newOrder);
        alert("🎉 تم إرسال طلبك بنجاح!");

        // الانتقال لصفحة تتبع الطلب لو حابب (مثلا order-status.html أو تظبيط الصفحة الحالية)
        // window.location.href = 'tracking.html'; // فعلها لو عندك صفحة تتبع

    } catch (error) {
        console.error("خطأ في إرسال الطلب:", error);
        alert("حدث خطأ أثناء إرسال الطلب، برجاء المحاولة مرة أخرى.");
    }
}