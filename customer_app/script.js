// دالة شاملة لضمان جلب وعرض المنتجات المحلية في الواجهة فوراً
document.addEventListener("DOMContentLoaded", function() {
    loadAndRenderProducts();
});

function loadAndRenderProducts() {
    let savedProducts = JSON.parse(localStorage.getItem("ready_products")) || [];
    
    if (savedProducts.length > 0) {
        // لو مصفوفة المنتجات الأساسية موجودة، نضيف عليها المنتجات الجديدة لو مش موجودة
        if (typeof menuItems !== 'undefined' && Array.isArray(menuItems)) {
            savedProducts.forEach(sp => {
                if (!menuItems.some(m => m.id === sp.id)) {
                    menuItems.unshift(sp); // إضافته في أول القائمة
                }
            });
        } else {
            // لو مفيش مصفوفة أساسية، بنعرفها بالمنتجات المحفوظة
            window.menuItems = savedProducts;
        }

        // إعادة تشغيل دالة العرض في الموقع لو موجودة
        if (typeof renderMenu === 'function') {
            renderMenu();
        } else {
            // عرض يدوي لو الدالة مش معرفة بالاسم ده
            renderProductsManually(savedProducts);
        }
    }
}

function renderProductsManually(products) {
    // البحث عن مكان عرض المنتجات في صفحة العميل
    let container = document.getElementById("menuContainer") || document.getElementById("productsGrid") || document.querySelector(".products-grid");
    if (!container) return;

    container.innerHTML = products.map(p => `
        <div class="product-card" style="background: #1e293b; border-radius: 12px; padding: 15px; color: #fff; border: 1px solid #334155;">
            <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px;">
            <h3 style="margin: 10px 0 5px; font-size: 16px;">${p.name}</h3>
            <p style="color: #f59e0b; font-weight: bold; margin-bottom: 10px;">${p.price} ج.م</p>
            <button onclick="addToCart('${p.id}')" style="background: #10b981; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; width: 100%;">إضافة للسلة</button>
        </div>
    `).join('');
}
// الكود الثالث: إرسال الطلب من صفحة العميل إلى لوحة التحكم مباشرة
function checkoutOrder() {
    // 1. جلب سلة المشتريات الحالية للعميل
    const cart = JSON.parse(localStorage.getItem('ready_cart')) || [];
    
    if (cart.length === 0) {
        alert('سلة المشتريات فارغة! أضف منتجات أولاً 🛒');
        return;
    }

    // 2. تجهيز هيكل الطلب الجديد
    const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        items: cart,
        total: cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0),
        status: 'قيد المراجعة',
        time: new Date().toLocaleTimeString('ar-SA'),
        date: new Date().toLocaleDateString('ar-SA')
    };

    // 3. جلب الطلبات السابقة وحفظ الطلب الجديد في المفتاح المشترك
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    orders.unshift(newOrder); // وضع الطلب الجديد في البداية
    localStorage.setItem('ready_orders', JSON.stringify(orders));

    // 4. تفريغ السلة بعد نجاح الطلب
    localStorage.removeItem('ready_cart');
    
    // 5. إشعار العميل وتوجيهه لصفحة التتبع أو الرئيسية
    alert('تم إرسال طلبك بنجاح إلى الإدارة! 🎉 سيتم متابعته فوراً.');
    
    // إعادة تحميل الصفحة أو التوجيه لصفحة التتبع إن وجدت
    window.location.reload();
}
// دالة إرسال الطلب من صفحة العميل وحفظه بشكل صحيح
function sendOrderToSystem(orderData) {
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    
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
    
    orders.push(newOrder);
localStorage.removeItem('ready_cart');
    
    console.log("تم إرسال الطلب بنجاح:", newOrder);
    alert("تم إرسال طلبك بنجاح يا بطل! 🚀");
}