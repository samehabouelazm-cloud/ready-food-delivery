function sendOrderToSystem(orderData) {
    try {
        const newOrder = {
            id: 'ORD-' + Date.now(),
            customerName: orderData.customerName || 'عميل',
            details: orderData.details || orderData.items || 'طلب جديد',
            total: orderData.total || 0,
            createdAt: new Date().toLocaleTimeString()
        };

        // قراءة الطلبات الحالية
        let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
        orders.push(newOrder);
        
        // الحفظ الإجباري في localStorage الرئيسي
        localStorage.setItem('ready_orders', JSON.stringify(orders));
        
        console.log("تم حفظ الطلب بنجاح في الجذر:", newOrder);
        alert("🎉 تم إرسال طلبك بنجاح!");

    } catch (err) {
        console.error("خطأ في الحفظ:", err);
    }
}