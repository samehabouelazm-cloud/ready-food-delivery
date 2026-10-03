// ==========================================
// 1. نظام إدارة وإضافة المنتجات
// ==========================================
function addNewProduct(event) {
    if (event) event.preventDefault();
    
    const nameInput = document.getElementById('productName') || document.getElementById('itemName');
    const priceInput = document.getElementById('productPrice') || document.getElementById('itemPrice');
    const catInput = document.getElementById('itemCategory') || document.getElementById('productCategory');
    const imageInput = document.getElementById('productImage') || document.getElementById('itemImage');

    if (!nameInput || !priceInput) {
        alert('يرجى التأكد من حقول ادخال السعر والاسم في لوحة التحكم.');
        return;
    }

    const newProduct = {
        id: "p_" + Date.now(),
        name: nameInput.value.trim(),
        price: parseFloat(priceInput.value) || 0,
        category: catInput ? catInput.value : "general",
        image: imageInput ? imageInput.value.trim() : 'https://via.placeholder.com/150'
    };

    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    products.push(newProduct);
    localStorage.setItem('ready_products', JSON.stringify(products));

    showNotificationWithSound("✅ تم حفظ وإضافة المنتج بنجاح!", "success");
    
    if (nameInput) nameInput.value = "";
    if (priceInput) priceInput.value = "";
    if (imageInput) imageInput.value = "";

    loadAdminProducts();
}

window.saveProductFromDOM = addNewProduct;

// تحميل وعرض المنتجات في لوحة التحكم
function loadAdminProducts() {
    let container = document.getElementById("adminProductsList") || document.getElementById("productsList");
    if (!container) return;

    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    
    if (products.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 15px;">لا توجد منتجات مضافة حالياً.</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
            <div>
                <strong>${p.name}</strong> - <span style="color: #f59e0b;">${p.price} ج.م</span>
            </div>
            <button onclick="deleteAdminProduct('${p.id}')" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">حذف</button>
        </div>
    `).join('');
}

// حذف منتج
window.deleteAdminProduct = function(id) {
    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem("ready_products", JSON.stringify(products));
    loadAdminProducts();
    showNotificationWithSound("🗑️ تم حذف المنتج بنجاح", "info");
};

// ==========================================
// 2. نظام إدارة السائقين
// ==========================================
window.addDriver = function() {
    const nameInput = document.getElementById('driverNameInput');
    const phoneInput = document.getElementById('driverPhoneInput');
    
    if (!nameInput || !phoneInput) return;
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        showNotificationWithSound("⚠️ برجاء إدخال اسم ورقم السائق!", "error");
        return;
    }

    let drivers = JSON.parse(localStorage.getItem("ready_drivers")) || [];
    drivers.push({ id: "drv_" + Date.now(), name, phone });
    localStorage.setItem("ready_drivers", JSON.stringify(drivers));

    showNotificationWithSound("🚗 تم حفظ وإضافة السائق بنجاح!", "success");
    nameInput.value = '';
    phoneInput.value = '';
};

// ==========================================
// 3. نظام التنبيهات والأصوات
// ==========================================
window.enableAudioAlerts = function() {
    localStorage.setItem('audio_allowed', 'true');
    playBeepSound();
    alert("✅ تم تفعيل التنبيهات الصوتية بنجاح!");
};

function showNotificationWithSound(message, type = "success") {
    playBeepSound();

    let notif = document.getElementById("adminNotificationToast");
    if (!notif) {
        notif = document.createElement("div");
        notif.id = "adminNotificationToast";
        notif.style.cssText = "position: fixed; bottom: 20px; left: 20px; z-index: 9999; padding: 15px 25px; border-radius: 8px; font-weight: bold; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s ease; font-family: Tahoma, sans-serif;";
        document.body.appendChild(notif);
    }

    if (type === "success") notif.style.background = "#10b981";
    else if (type === "error") notif.style.background = "#ef4444";
    else notif.style.background = "#3b82f6";

    notif.innerText = message;
    notif.style.opacity = "1";

    setTimeout(() => {
        notif.style.opacity = "0";
    }, 4000);
}

function playBeepSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.log("Audio Context not supported or blocked by browser policy");
    }
}

// ==========================================
// 4. نظام جلب وعرض طلبات العملاء والتحديث الحي
// ==========================================
function loadAdminOrders() {
    const ordersContainer = document.getElementById('orders-container') || document.querySelector('.orders-container');
    if (!ordersContainer) return;

    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 20px; font-size: 16px;">لا توجد طلبات جديدة حالياً</p>';
        return;
    }

    ordersContainer.innerHTML = '';

    orders.forEach((order, index) => {
        let detailsText = 'طلب جديد';
        if (order.items && Array.isArray(order.items)) {
            detailsText = order.items.map(i => `${i.name} (${i.quantity || 1})`).join(', ');
        } else if (order.details) {
            detailsText = typeof order.details === 'object' ? JSON.stringify(order.details) : order.details;
        }

        let card = document.createElement('div');
        card.style.cssText = "background: #1e293b; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #334155; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
        card.innerHTML = `
            <h4 style="color: #38bdf8; margin: 0 0 10px 0; font-size: 18px;">📦 طلب رقم #${order.id || (index + 1)}</h4>
            <p><strong>👤 العميل:</strong> ${order.customerName || order.name || 'غير متوفر'}</p>
            <p><strong>📞 الهاتف:</strong> ${order.phone || 'غير متوفر'}</p>
            <p><strong>🛒 التفاصيل:</strong> ${detailsText}</p>
            <p><strong>💰 الإجمالي:</strong> ${order.total || 0} جنيه</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">التاريخ: ${order.createdAt || 'الآن'}</p>
        `;
        ordersContainer.appendChild(card);
    });
}

// التشغيل الأولي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadAdminOrders();
    loadAdminProducts();
});

// مراقبة الطلبات الجديدة وتنبيه الإدارة تلقائياً
setInterval(() => {
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    if (typeof window.lastOrderCount === 'undefined') {
        window.lastOrderCount = orders.length;
    }
    if (orders.length !== window.lastOrderCount) {
        if (orders.length > window.lastOrderCount) {
            playBeepSound();
            showNotificationWithSound("🚨 وصل طلب جديد للمتجر!", "success");
        }
        window.lastOrderCount = orders.length;
        loadAdminOrders();
    }
}, 1000);
// إدارة المنتجات وحفظها مع الصورة (Base64)
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const imageFile = document.getElementById('productImageFile').files[0];

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            const base64Image = uploadEvent.target.result;
            saveNewProduct(name, price, base64Image);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveNewProduct(name, price, '');
    }
});

function saveNewProduct(name, price, image) {
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    products.push({ id: Date.now(), name, price, image });
    localStorage.setItem('ready_products', JSON.stringify(products));
    alert('تم إضافة المنتج بنجاح!');
    location.reload();
}

// دالة حذف المنتج
window.deleteProduct = function(id) {
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem('ready_products', JSON.stringify(products));
    loadAdminProducts();
}

function loadAdminProducts() {
    const productsList = document.getElementById('adminProductsList');
    if (!productsList) return;
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    productsList.innerHTML = products.map(p => `
        <div class="product-row" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; background:#1e293b; padding:10px; border-radius:8px;">
            <img src="${p.image || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
            <span>${p.name}</span>
            <span>${p.price} ج.م</span>
            <button onclick="deleteProduct(${p.id})" style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button>
        </div>
    `).join('');
}

// نظام مراقبة الطلبات الجديدة والتنبيه الصوتي (Web Audio API) للوحة الإدارة
function playBeepSound() {
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
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio not supported or restricted");
    }
}

setInterval(() => {
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    if (typeof window.lastOrderCount === 'undefined') {
        window.lastOrderCount = orders.length;
    }
    if (orders.length !== window.lastOrderCount) {
        if (orders.length > window.lastOrderCount) {
            playBeepSound();
        }
        window.lastOrderCount = orders.length;
        if (typeof loadAdminOrders === 'function') {
            loadAdminOrders();
        }
    }
}, 1000);

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProducts();
});