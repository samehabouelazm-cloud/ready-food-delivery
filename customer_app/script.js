function sendOrderToSystem(orderData) {
    // 1. جلب الطلبات الحالية من المفتاح المشترك
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    
    // 2. تجهيز كائن الطلب الجديد بكامل بياناته
    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customerName: orderData && orderData.name ? orderData.name : 'عميل كريم',
        phone: orderData && orderData.phone ? orderData.phone : '',
        address: orderData && orderData.address ? orderData.address : '',
        items: orderData && orderData.items ? orderData.items : (JSON.parse(localStorage.getItem('ready_cart')) || []),
        total: orderData && orderData.total ? orderData.total : 0,
        status: 'جديد',
        captain: '',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    
    // 3. إضافة الطلب للقائمة وحفظه في الـ localStorage فوراً (الخطوة الأهم)
    orders.push(newOrder);
    localStorage.setItem('ready_orders', JSON.stringify(orders));
    localStorage.removeItem('ready_cart');
    
    // 4. تشغيل صوت تنبيه (Notification Sound) للتاكيد
    try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play().catch(e => console.log("Audio play blocked:", e));
    } catch (err) {
        console.log("Sound error:", err);
    }
    
    console.log("تم إرسال الطلب بنجاح:", newOrder);
    alert("تم إرسال طلبك بنجاح يا بطل! 🚀");
}