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