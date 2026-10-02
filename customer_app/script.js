let cartItem = null;
let customerCoords = null;

function loadStoreProducts() {
    let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    const menuContainer = document.getElementById('dynamicMenu');
    if (!menuContainer) return;
    menuContainer.innerHTML = '';

    if (products.length === 0) {
        menuContainer.innerHTML = '<div class="section" style="text-align: center; color: #94a3b8; font-size: 13px;">لا توجد منتجات معروضة حالياً. استخدم لوحة التحكم لإضافة المنتجات.</div>';
        updateCartDisplay();
        return;
    }

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
            sectionHtml += `<div class="product-card"><img src="${p.image}" alt="${p.name}" class="product-img"><div class="product-info"><h3>${p.name}</h3><div class="price">${p.price} ج.م</div></div><button onclick="addToCart('${p.name}', ${p.price})">إضافة للسلة 🛒</button></div>`;
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
    const deliveryFee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 0;

    if (!cartItem) {
        summaryDiv.innerHTML = `السلة فارغة حالياً.. اختر منتجك المفضل!<br>🛵 <b>قيمة التوصيل للمندوب:</b> ${deliveryFee} ج.م`;
        return;
    }

    let total = parseFloat(cartItem.price) + deliveryFee;
    summaryDiv.innerHTML = `📦 <b>المنتج:</b> ${cartItem.name} <br>` +
                            `🏷️ <b>سعر الشراء للسلعة:</b> ${cartItem.price} ج.م<br>` +
                            `🛵 <b>قيمة التوصيل للمندوب:</b> ${deliveryFee} ج.م<br>` +
                            `💰 <b>إجمالي الفاتورة للعميل:</b> <span style="color: #34d399;">${total} ج.م</span>`;
}

function checkoutOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    let address = document.getElementById('customerAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const deliveryFee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 0;

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
        locationText += `\n🔗 رابط الخريطة الحقيقي: ${customerCoords}`;
    }

    let msg = `🧾 *فاتورة طلب جديدة متكاملة*\n` +
              `-------------------\n` +
              `👤 *بيانات العميل:*\n` +
              `• الاسم: ${name}\n` +
              `• الجوال: ${phone}\n` +
              `• العنوان والموقع: ${locationText}\n` +
              `• طريقة الدفع: ${payment}\n` +
              `-------------------\n` +
              `📦 *تفاصيل الأسعار:*\n` +
              `• سعر السلعة: ${itemPrice} ج.م\n` +
              `• التوصيل (للمندوب): ${deliveryFee} ج.م\n` +
              `-------------------\n` +
              `💰 *الإجمالي النهائي:* ${total} ج.م`;

    window.open(`https://wa.me/201034101822?text=${encodeURIComponent(msg)}`, '_blank');
}

window.onload = loadStoreProducts;