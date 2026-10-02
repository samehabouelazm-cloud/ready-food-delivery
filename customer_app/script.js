let cartItem = null;
let customerCoords = null;

function loadStoreProducts() {
    // جلب المنتجات أو وضع منتج تجريبي افتراضي لو الـ localStorage فاضي
    let products = JSON.parse(localStorage.getItem('storeProducts')) || [
        { name: 'وجبة سريعة تجريبية 🍔', price: 150, category: 'الوجبات', image: 'https://via.placeholder.com/150' },
        { name: 'مشروب بارد 🥤', price: 25, category: 'المشروبات', image: 'https://via.placeholder.com/150' }
    ];

    const menuContainer = document.getElementById('dynamicMenu');
    if (!menuContainer) return;
    menuContainer.innerHTML = '';

    let categories = {};
    products.forEach(p => {
        let catName = p.category || 'أقسام عامة';
        if (!categories[catName]) categories[catName] = [];
        categories[catName].push(p);
    });

    for (let cat in categories) {
        let items = categories[cat];
        let sectionHtml = `<div class="section"><div class="section-header"><h2>📂 ${cat}</h2></div><div class="products-grid">`;
        items.forEach(p => {
            sectionHtml += `<div class="product-card" style="background:#1e293b;padding:12px;border-radius:8px;text-align:center;color:#fff;margin:5px;">
                <img src="${p.image}" alt="${p.name}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;">
                <h3 style="font-size:15px;margin:8px 0;">${p.name}</h3>
                <div style="color:#34d399;font-weight:bold;margin-bottom:8px;">${p.price} ج.م</div>
                <button onclick="addToCart('${p.name}', ${p.price})" style="background:#38bdf8;color:#0f172a;border:none;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer;width:100%;">إضافة للسلة 🛒</button>
            </div>`;
        });
        sectionHtml += `</div></div>`;
        menuContainer.innerHTML += sectionHtml;
    }
    updateCartDisplay();
}

function addToCart(name, price) {
    cartItem = { name, price };
    updateCartDisplay();
    alert(`تمت إضافة "${name}" إلى السلة بنجاح!`);
}

function getLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const addressInput = document.getElementById('customerAddress');

    if (!navigator.geolocation) {
        statusDiv.innerHTML = '⚠️ المتصفح لا يدعم تحديد الموقع.';
        return;
    }

    statusDiv.innerHTML = '⏳ جاري تحديد موقعك الحالي بدقة...';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            customerCoords = `https://maps.google.com/?q=${lat},${lng}`;
            addressInput.value = `موقع GPS الواقعي (تم تحديده تلقائياً)`;
            statusDiv.innerHTML = '✅ تم تحديد الموقع الواقعي بنجاح!';
        },
        (error) => {
            statusDiv.innerHTML = '❌ تعذر تحديد الموقع. تأكد من تفعيل الـ GPS.';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateCartDisplay() {
    const summaryDiv = document.getElementById('cartSummary');
    if (!summaryDiv) return;
    const deliveryFee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 20;

    if (!cartItem) {
        summaryDiv.innerHTML = `السلة فارغة حالياً.. اختر منتجاً مفضلاً!<br>🛵 <b>قيمة التوصيل للمندوب:</b> ${deliveryFee} ج.م`;
        return;
    }

    let total = parseFloat(cartItem.price) + deliveryFee;
    summaryDiv.innerHTML = `📦 <b>المنتج:</b> ${cartItem.name} <br>` +
                            `🏷️️ <b>سعر الشراء للسلعة:</b> ${cartItem.price} ج.م<br>` +
                            `🛵 <b>قيمة التوصيل للمندوب:</b> ${deliveryFee} ج.م<br>` +
                            `💰 <b>إجمالي الفاتورة للعميل:</b> <span style="color: #34d399;">${total} ج.م</span>`;
}

function checkoutOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    let address = document.getElementById('customerAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const deliveryFee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 20;

    if (!name || !phone || !address) {
        alert('من فضلك ادخل الاسم، الجوال، والعنوان أو الموقع!');
        return;
    }

    if (!cartItem) {
        alert('السلة فارغة، اختر منتجاً أولاً!');
        return;
    }

    let itemPrice = parseFloat(cartItem.price);
    let total = itemPrice + deliveryFee;
    let locationText = address;
    
    if (customerCoords) {
        locationText += `\nرابط الخريطة: ${customerCoords}`;
    }

    let msg = "🧾 فاتورة طلب جديدة متكاملة\n" +
              "-------------------\n" +
              "👤 بيانات العميل:\n" +
              "• الاسم: " + name + "\n" +
              "• الجوال: " + phone + "\n" +
              "• العنوان: " + locationText + "\n" +
              "• الدفع: " + payment + "\n" +
              "-------------------\n" +
              "📦 تفاصيل الأسعار:\n" +
              "• سعر السلعة: " + itemPrice + " ج.م\n" +
              "• التوصيل: " + deliveryFee + " ج.م\n" +
              "-------------------\n" +
              "💰 الإجمالي النهائي: " + total + " ج.م";

    window.open(`https://wa.me/201034101822?text=${encodeURIComponent(msg)}`, '_blank');
}

// تشغيل تحميل المنتجات فور فتح الصفحة
window.onload = loadStoreProducts;