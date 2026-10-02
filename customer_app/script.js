let cartItem = null;
let customerCoords = null;

function loadStoreProducts() {
    let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    
    // لو لوحة التحكم مفيش فيها منتجات متسجلة لسه، نعرض منتجات افتراضية عشان التصميم يفضل شغال واحترافي
    if (products.length === 0) {
        products = [
            { name: 'بيض بلدي - 30 بيضة', price: 130, category: 'المنتجات الطازجة', image: 'https://via.placeholder.com/300' },
            { name: 'كيلو سمك بلطي مشوي', price: 100, category: 'المأكولات البحرية', image: 'https://via.placeholder.com/300' }
        ];
    }

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
            sectionHtml += `
                <div class="product-card">
                    <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="product-img">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <div class="price">${p.price} ج.م</div>
                        <button onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price})" class="add-btn">إضافة للسلة 🛒</button>
                    </div>
                </div>
            `;
        });
        
        sectionHtml += `</div></div>`;
        menuContainer.innerHTML += sectionHtml;
    }
    updateCartDisplay();
}

function addToCart(name, price) {
    cartItem = { name, price };
    updateCartDisplay();
    // تأثير مرئي بسيط أو تنبيه احترافي
    console.log(`Added: ${name} - ${price}`);
}

function getLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const addressInput = document.getElementById('customerAddress');

    if (!navigator.geolocation) {
        if (statusDiv) statusDiv.innerHTML = '⚠️ المتصفح لا يدعم تحديد الموقع.';
        return;
    }

    if (statusDiv) statusDiv.innerHTML = '⏳ جاري تحديد موقعك الحالي بدقة عبر الـ GPS...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            customerCoords = `https://maps.google.com/?q=${lat},${lng}`;
            if (addressInput) addressInput.value = `📍 موقع GPS الحالي (تم التحديد تلقائياً)`;
            if (statusDiv) statusDiv.innerHTML = '✅ تم تحديد الموقع الواقعي بنجاح!';
        },
        (error) => {
            if (statusDiv) statusDiv.innerHTML = '❌ تعذر تحديد الموقع. تأكد من تفعيل صلاحية الـ GPS.';
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
    summaryDiv.innerHTML = `📦 <b>المنتج المختيار:</b> ${cartItem.name} <br>` +
                            `🏷 <b>سعر السلعة:</b> ${cartItem.price} ج.م<br>` +
                            `🛵 <b>قيمة التوصيل للمندوب:</b> ${deliveryFee} ج.م<br>` +
                            `💰 <b>الإجمالي النهائي:</b> <span style="color: #34d399; font-weight: bold;">${total} ج.م</span>`;
}

function checkoutOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    let address = document.getElementById('customerAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const deliveryFee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 20;

    if (!name || !phone || !address) {
        alert('من فضلك ادخل الاسم، الجوال، والعنوان أو موقع الـ GPS!');
        return;
    }

    if (!cartItem) {
        alert('السلة فارغة، اختر منتجاً أولاً من المتجر!');
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

window.onload = loadStoreProducts;