// دمج المنتجات المخزنة محلياً مع المنتجات الافتراضية
document.addEventListener("DOMContentLoaded", function() {
    let savedProducts = JSON.parse(localStorage.getItem("ready_products")) || [];
    if (savedProducts.length > 0 && typeof menuItems !== 'undefined') {
        // دمج المنتجات المضافة لو مش موجودة
        savedProducts.forEach(sp => {
            if (!menuItems.some(m => m.id === sp.id)) {
                menuItems.push(sp);
            }
        });
        if (typeof renderMenu === 'function') renderMenu();
    }
});
let currentQty = 1;

// دالة تغيير الكمية (تعمل الآن بالموجب والسالب بدقة)
function changeQty(val) {
    currentQty += val;
    if (currentQty < 1) currentQty = 1;
    const qtyDisplay = document.getElementById('qty_display');
    if (qtyDisplay) {
        qtyDisplay.innerText = currentQty;
    }
}

// دالة حفظ بيانات العميل في localStorage لضمان استمراريتها
function saveDetails() {
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');

    if (!nameEl || !phoneEl || !addressEl) return;

    const customerData = {
        name: nameEl.value.trim(),
        phone: phoneEl.value.trim(),
        address: addressEl.value.trim()
    };

    localStorage.setItem('jahez_saved_customer', JSON.stringify(customerData));
    alert('تم حفظ بيانات التوصيل بنجاح!');
}

// إضافة المنتج للسلة مع الكمية المختارة
function addToCart(itemName, itemPrice) {
    saveDetails(); // حفظ البيانات تلقائياً عند الإضافة
    let cart = JSON.parse(localStorage.getItem('jahez_cart')) || [];
    
    cart.push({
        name: itemName,
        price: itemPrice,
        quantity: currentQty
    });

    localStorage.setItem('jahez_cart', JSON.stringify(cart));
    alert(`تمت إضافة ${currentQty} من (${itemName}) إلى السلة بنجاح!`);
    
    // إعادة تعيين الكمية إلى 1 بعد الإضافة
    currentQty = 1;
    const qtyDisplay = document.getElementById('qty_display');
    if (qtyDisplay) qtyDisplay.innerText = '1';
}

// استرجاع البيانات المحفوظة تلقائياً عند فتح الصفحة
window.onload = function() {
    const saved = localStorage.getItem('jahez_saved_customer');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            const nameEl = document.getElementById('customerName');
            const phoneEl = document.getElementById('customerPhone');
            const addressEl = document.getElementById('customerAddress');

            if (nameEl && data.name) nameEl.value = data.name;
            if (phoneEl && data.phone) phoneEl.value = data.phone;
            if (addressEl && data.address) addressEl.value = data.address;
        } catch (e) {
            console.error("Error loading saved customer data", e);
        }
    }
};
// دالة إرسال الطلب من تطبيق العميل لتتطابق تماماً مع لوحة الإدارة والكابتن
function sendCustomerOrder(cartItems, customerDetails) {
    const ordersRef = ref(db, 'adminOrders');
    
    let subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrderData = {
        customerName: customerDetails.name,       // اسم العميل
        customerPhone: customerDetails.phone,     // رقم الجوال
        customerAddress: customerDetails.address, // العنوان
        items: cartItems,                         // قائمة الأصناف والكميات
        total: subtotal,                          // إجمالي المشتريات
        deliveryFee: 20,                          // قيمة التوصيل الافتراضية
        status: 'جديد',                           // حالة الطلب الابتدائية
        timestamp: Date.now()
    };

    push(ordersRef, newOrderData).then(() => {
        alert('✅ تم إرسال طلبك بنجاح! جاري متابعته من الإدارة.');
    }).catch((error) => {
        alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    });
}