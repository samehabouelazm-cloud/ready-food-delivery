let cart = [];
let currentProducts = [];
let customerCoords = null;

const originalDefaultProducts = [
    { name: "كيلو طماطم", price: 20, category: "السوق", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400" },
    { name: "كيلو سمك بلطي مشوي", price: 100, category: "المشويات", image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
    { name: "بيض بلدي - 30 بيضة", price: 130, category: "السوبر ماركت", image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400" }
];

const trackingStepsList = [
    "تم استلام الطلب من الإدارة وجاري التحضير",
    "الطلب بيتحضر أو بيجهز",
    "الطلب استلمه المندوب",
    "المندوب اتحرك بالطلب",
    "المندوب في الطريق إليك",
    "المندوب على بعد أمتار من موقعك",
    "استعد وافتح الباب - الكابتن وصل",
    "تم تسليم الطلب بنجاح"
];

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.log('Audio context blocked');
    }
}

function loadStoreProducts() {
    let savedProducts = localStorage.getItem('storeProducts');
    let products = savedProducts ? JSON.parse(savedProducts) : originalDefaultProducts;

    currentProducts = products;
    let grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    currentProducts.forEach((p, index) => {
        grid.innerHTML += `
            <div class="product-card" data-name="${p.name}">
                <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200?text=READY'">
                <div class="product-info">
                    <span class="product-cat">${p.category || 'عام'}</span>
                    <div class="product-title">${p.name}</div>
                    <div class="product-price">${p.price} ج.م</div>
                    <button class="add-to-cart" onclick="addToCart(${index})">إضافة للسلة 🛒</button>
                </div>
            </div>
        `;
    });

    let fee = localStorage.getItem('storeDeliveryFee') || 20;
    let feeDisplay = document.getElementById('deliveryFeeDisplay');
    if(feeDisplay) feeDisplay.innerText = fee;
    
    updateCartUI();
    updateAdminBadge();
}

function filterProducts() {
    let query = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        let name = card.getAttribute('data-name').toLowerCase();
        card.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

function getMyLocation() {
    let statusDiv = document.getElementById('locationStatus');
    if (!navigator.geolocation) {
        statusDiv.style.color = '#ef4444';
        statusDiv.innerText = 'متصفحك لا يدعم تحديد الموقع.';
        return;
    }

    statusDiv.style.color = '#f59e0b';
    statusDiv.innerText = '⏳ جاري تحديد موقعك بدقة...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            customerCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            statusDiv.style.color = '#34d399';
            statusDiv.innerHTML = `✅ تم تحديث موقعك! (<a href="https://maps.google.com/?q=${customerCoords.lat},${customerCoords.lng}" target="_blank" style="color:#38bdf8;">عرض الخريطة</a>)`;
        },
        (error) => {
            statusDiv.style.color = '#ef4444';
            statusDiv.innerText = '⚠️ تعذر تحديد الموقع. اسمح بالوصول من المتصفح.';
        },
        { enableHighAccuracy: true }
    );
}

function addToCart(index) {
    let product = currentProducts[index];
    let existing = cart.find(i => i.name === product.name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name: product.name, price: product.price, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    let tbody = document.getElementById('cartTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="color: #94a3b8;">السلة فارغة حالياً.</td></tr>`;
        let gt = document.getElementById('grandTotalDisplay');
        if(gt) gt.innerText = '0';
        return;
    }

    cart.forEach((item, idx) => {
        let itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        tbody.innerHTML += `
            <tr>
                <td><b>${item.name}</b></td>
                <td>${item.price} ج.م</td>
                <td><input type="number" value="${item.qty}" min="1" style="width: 50px; text-align: center; background:#0f172a; color:#fff; border:1px solid #475569;" onchange="updateQty(${idx}, this.value)"></td>
                <td>${itemTotal} ج.م</td>
                <td><button onclick="removeFromCart(${idx})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">حذف</button></td>
            </tr>
        `;
    });

    let fee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 20;
    let grandTotal = subtotal + (subtotal > 0 ? fee : 0);
    let gt = document.getElementById('grandTotalDisplay');
    if(gt) gt.innerText = grandTotal;
}

function updateQty(idx, qty) {
    let q = parseInt(qty);
    if (q > 0) cart[idx].qty = q;
    updateCartUI();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCartUI();
}

function submitOrder() {
    if (cart.length === 0) {
        alert('السلة فارغة! أضف منتجات أولاً.');
        return;
    }

    let name = document.getElementById('custName').value.trim();
    let phone = document.getElementById('custPhone').value.trim();
    let address = document.getElementById('custAddress').value.trim();
    let paymentMethod = document.getElementById('paymentMethod').value;

    if (!name || !phone || !address) {
        alert('من فضلك أدخل الاسم ورقم الهاتف وعنوان الاستلام بالتفصيل!');
        return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let fee = parseFloat(localStorage.getItem('storeDeliveryFee')) || 20;
    let grandTotal = subtotal + fee;

    let orderId = Math.floor(1000 + Math.random() * 9000);
    let newOrder = {
        id: orderId,
        date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        coords: customerCoords,
        items: [...cart],
        total: grandTotal,
        paymentMethod: paymentMethod,
        trackingStatus: trackingStepsList[0],
        isNew: true
    };

    let orders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    orders.unshift(newOrder);
    localStorage.setItem('storeOrders', JSON.stringify(orders));
    localStorage.setItem('lastActiveOrderPhone', phone);

    playNotificationSound();

    let itemsText = cart.map(i => `• ${i.name} (×${i.qty}) : ${i.price * i.qty} ج.م`).join('\n');
    let mapLink = customerCoords ? `https://maps.google.com/?q=${customerCoords.lat},${customerCoords.lng}` : 'لم يحدد موقع GPS';

    let whatsappMessage = `🚨 *طلب جديد رقم #${orderId}* 🚀\n\n` +
        `👤 *الاسم:* ${name}\n` +
        `📞 *الهاتف:* ${phone}\n` +
        `📍 *العنوان:* ${address}\n` +
        `🗺 *رابط الخريطة:* ${mapLink}\n\n` +
        `🛒 *المنتجات المطلوبة:*\n${itemsText}\n\n` +
        `💰 *الإجمالي:* ${grandTotal} ج.م\n` +
        `💳 *الدفع:* ${paymentMethod}`;

    cart = [];
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custAddress').value = '';
    let locStatus = document.getElementById('locationStatus');
    if(locStatus) locStatus.innerText = '';
    customerCoords = null;
    updateCartUI();
    updateAdminBadge();

    let successBanner = document.getElementById('successBanner');
    if(successBanner) {
        successBanner.style.display = 'block';
        setTimeout(() => { successBanner.style.display = 'none'; }, 8000);
    }

    let adminPhone = '201034101822';
    let whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=` + encodeURIComponent(whatsappMessage);
    window.location.href = whatsappUrl;
}

function toggleTrackingSection() {
    let section = document.getElementById('trackingSection');
    if (!section) return;
    section.style.display = (section.style.display === 'block') ? 'none' : 'block';
    if (section.style.display === 'block') {
        renderLiveTracking();
    }
}

function updateAdminBadge() {
    let orders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    let newCount = orders.filter(o => o.isNew).length;
    let badge = document.getElementById('adminBadge');
    if (badge) {
        if (newCount > 0) {
            badge.innerText = newCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderLiveTracking() {
    let orders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    let lastPhone = localStorage.getItem('lastActiveOrderPhone');
    let content = document.getElementById('trackingContent');
    if (!content) return;
    
    let myOrder = orders.find(o => o.customerPhone === lastPhone) || orders[0];

    if (!myOrder) {
        content.innerHTML = `<p style="color: #94a3b8;">لا توجد طلبات نشطة للعرض حالياً.</p>`;
        return;
    }

    let status = myOrder.trackingStatus || trackingStepsList[0];
    let stepsHtml = '';
    let isNear = status.includes('على بعد أمتار') || status.includes('استعد وافتح الباب');

    trackingStepsList.forEach((s, idx) => {
        let isActive = status === s;
        stepsHtml += `<div class="tracking-step ${isActive ? 'active' : ''}">
            <span>${isActive ? '📍 🟢' : '⚪'}</span> ${idx + 1}. ${s}
        </div>`;
    });

    content.innerHTML = `
        <div style="margin-bottom: 12px; font-size: 13px; color: #38bdf8;">
            <b>رقم الطلب: #${myOrder.id}</b> | الحالة: <span style="color:#34d399">${status}</span>
        </div>
        ${stepsHtml}
        <div class="alert-box" id="alertBox" style="display: ${isNear ? 'block' : 'none'};">
            🚨 تنبيه: الكابتن أصبح قريباً جداً، يرجى الاستعداد وافتح الباب!
        </div>
    `;
}

setInterval(() => {
    let trackSec = document.getElementById('trackingSection');
    if (trackSec && trackSec.style.display === 'block') {
        renderLiveTracking();
    }
}, 3000);

window.onload = loadStoreProducts;
document.addEventListener('DOMContentLoaded', () => {
    loadCustomerProducts();
});

function loadCustomerProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
let products = JSON.parse(localStorage.getItem('storeProducts')) || [
    { name: "كشري مصري مميز", price: 35, category: "🍔 الوجبات السريعة", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=60" },
    { name: "ساندوتش فلافل ساخن", price: 10, category: "🥪 الساندوتشات", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&auto=format&fit=crop&q=60" }
];    
    if (products.length === 0) {
        grid.innerHTML = '<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">لا توجد منتجات مضافة حالياً من لوحة الإدارة.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" style="background:#1e293b; border-radius:10px; overflow:hidden; padding:15px; text-align:center;">
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
            <h3 style="color:#fff; font-size:16px; margin-bottom:8px;">${p.name}</h3>
            <p style="color:#38bdf8; font-weight:bold; margin-bottom:12px;">${p.price} ج.م</p>
            <button onclick="addToCart(${p.id})" style="background:#0ea5e9; color:#fff; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; width:100%;">إضافة للسلة 🛒</button>
        </div>
    `).join('');
}

let cart = [];

function addToCart(productId) {
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    let product = products.find(p => p.id === productId);
    if (!product) return;

    let existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="color: #94a3b8;">السلة فارغة حالياً.</p>';
        cartTotal.innerHTML = '';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:5px;">
            <span>${item.name} (x${item.qty})</span>
            <span>${item.price * item.qty} ج.م</span>
        </div>`;
    }).join('');

    cartTotal.innerHTML = `الإجمالي الكلي: ${total} ج.م`;
}

function checkoutOrder() {
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    let newOrder = {
        id: Date.now(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        time: new Date().toLocaleTimeString()
    };
    
    orders.push(newOrder);
    localStorage.setItem('ready_orders', JSON.stringify(orders));

    alert('تم إرسال طلبك بنجاح للمتجر!');
    cart = [];
    updateCartUI();
}

function toggleTrackingSection() {
    const section = document.getElementById('trackingSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    const grid = document.getElementById('productsGrid');
    
    let filtered = products.filter(p => p.name.toLowerCase().includes(query));
    
    grid.innerHTML = filtered.map(p => `
        <div class="product-card" style="background:#1e293b; border-radius:10px; overflow:hidden; padding:15px; text-align:center;">
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
            <h3 style="color:#fff; font-size:16px; margin-bottom:8px;">${p.name}</h3>
            <p style="color:#38bdf8; font-weight:bold; margin-bottom:12px;">${p.price} ج.م</p>
            <button onclick="addToCart(${p.id})" style="background:#0ea5e9; color:#fff; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; width:100%;">إضافة للسلة 🛒</button>
        </div>
    `).join('');
}