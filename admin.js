// admin.js - الكود الشامل لإصلاح الحفظ والتنبيهات الصوتية والفورية

// الكود الأول: إضافة وحفظ المنتجات لعرضها فوراً للعملاء
function addNewProduct(event) {
    if (event) event.preventDefault();
    
    // تأكد أن أسماء الـ IDs هنا مطابقة للي عندك في نموذج الإضافة في admin.html
    const nameInput = document.getElementById('productName') || document.getElementById('itemName');
    const priceInput = document.getElementById('productPrice') || document.getElementById('itemPrice');
    const imageInput = document.getElementById('productImage') || document.getElementById('itemImage');

    if (!nameInput || !priceInput) {
        alert('يرجى التأكد من حقول ادخال اسم السعر والاسم في لوحة التحكم.');
        return;
    }

    const newProduct = {
        id: Date.now(),
        name: nameInput.value,
        price: parseFloat(priceInput.value),
        image: imageInput ? imageInput.value : 'https://via.placeholder.com/150'
    };

    // حفظ المنتج في الـ localStorage بمفتاح ready_products المشترك مع العميل
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    products.push(newProduct);
    localStorage.setItem('ready_products', JSON.stringify(products));

    alert('تم إضافة المنتج بنجاح وحفظه للعملاء! 🚀');
    location.reload();
}
// دالة حفظ المنتج محلياً وعرضه فوراً مع التنبيه الصوتي
window.saveProductFromDOM = function() {
    const nameInput = document.getElementById("itemName") || document.getElementById("productName") || document.querySelector("input[name='name']");
    const priceInput = document.getElementById("itemPrice") || document.getElementById("productPrice") || document.querySelector("input[name='price']");
    const catInput = document.getElementById("itemCategory") || document.getElementById("productCategory");
    const imgInput = document.getElementById("itemImage") || document.getElementById("productImage");

    const name = nameInput ? nameInput.value.trim() : "";
    const price = priceInput ? priceInput.value.trim() : "";
    const category = catInput ? catInput.value : "general";
    const image = imgInput ? imgInput.value.trim() : "";

    if (!name || !price) {
        showNotificationWithSound("⚠️ برجاء كتابة اسم المنتج والسعر على الأقل!", "error");
        return;
    }

    const newProduct = {
        id: "p_" + Date.now(),
        name: name,
        price: parseFloat(price),
        category: category,
        image: image || "https://via.placeholder.com/150"
    };

    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    products.push(newProduct);
    localStorage.setItem("ready_products", JSON.stringify(products));

    // تحديث داتا الجلوبال لو متاحة
    if (typeof menuItems !== 'undefined') {
        menuItems.push(newProduct);
    }

    showNotificationWithSound("✅ تم حفظ وإضافة المنتج بنجاح!", "success");

    if (nameInput) nameInput.value = "";
    if (priceInput) priceInput.value = "";
    if (imgInput) imgInput.value = "";

    loadAdminProducts();
};

// تحميل وعرض المنتجات في لوحة التحكم
function loadAdminProducts() {
    let container = document.getElementById("adminProductsList") || document.getElementById("productsList");
    if (!container) {
        // لو مش موجود، بننشئه أو ندور على مكان ليه
        return;
    }

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

// إضافة سائق جديد وحفظه
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

// نظام التنبيهات الفورية مع صوت تنبيه حقيقي (Web Audio API) لتشغيل التنبيهات الصوتية بدون ملفات خارجية
function showNotificationWithSound(message, type = "success") {
    // 1. تشغيل التنبيه الصوتي (Beep Sound)
    playBeepSound();

    // 2. إظهار الإشعار المرئي
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

// دالة توليد صوت التنبيه فورياً (تتحل مشكلة التنبيهات الصوتية تماماً بدون مشاكل روابط)
function playBeepSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // نغمة واضحة
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2); // مدة النغمة 0.2 ثانية
    } catch (e) {
        console.log("Audio Context not supported or blocked by browser policy");
    }
}
// الكود الثاني: نظام جلب وعرض طلبات العملاء وتحديثها حياً في لوحة التحكم
function loadAdminOrders() {
    const ordersContainer = document.getElementById('orders-container') || document.querySelector('.orders-container') || document.body;
    
    try {
        // قراءة الطلبات بـ Safety Fallback كامل
        let rawData = localStorage.getItem('ready_orders');
        let orders = [];
        
        if (rawData) {
            orders = JSON.parse(rawData);
        }
        
        // لو مش مصفوفة، نرجّعها مصفوفة فاضية عشان السيستم ما يوقعش
        if (!Array.isArray(orders)) {
            orders = [];
        }

        console.log("Loaded orders in admin:", orders);

        // البحث عن مكان عرض الطلبات أو إنشائه لو مش موجود
        let targetBox = document.getElementById('orders-container');
        if (!targetBox) {
            // لو مش محطوط ID صريح، ندور في الصفحة
            targetBox = document.querySelector('div:has(#orders-container)') || document.body;
        }

        if (orders.length === 0) {
            // تحديث رسالة التحميل بوضوح
            const loadingText = document.querySelector('p');
            if (loadingText && loadingText.innerText.includes('جاري تحميل')) {
                loadingText.innerText = 'لا توجد طلبات جديدة حالياً';
            }
            return;
        }

        // تفريغ وعرض الطلبات
        let htmlContent = '<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">';
        orders.forEach((order, index) => {
            htmlContent.innerHTML += ''; // سيتم بناء الكارد
            let card = document.createElement('div');
            card.style.cssText = "background: #1e293b; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #334155; margin-bottom: 10px;";
            card.innerHTML = `
                <h4 style="color: #38bdf8; margin: 0 0 10px 0;">📦 طلب رقم #${order.id || (index + 1)}</h4>
                <p><strong>👤 العميل:</strong> ${order.customerName || 'غير متوفر'}</p>
                <p><strong>🛒 التفاصيل:</strong> ${JSON.stringify(order.items || order.details || 'طلب عام')}</p>
                <p><strong>💰 الإجمالي:</strong> ${order.total || 0} جنيه</p>
                <p style="font-size: 12px; color: #94a3b8;">التاريخ: ${order.createdAt || 'الآن'}</p>
            `;
            // نتأكد نضيفه مكان "جاري تحميل الطلبات"
        });
        
    } catch (e) {
        console.error("Error loading admin orders:", e);
    }
}
function loadAdminOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;

    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 20px;">لا توجد طلبات جديدة حالياً</p>';
        return;
    }

    ordersContainer.innerHTML = ''; // تفريغ القائمة لتجنب التكرار

    orders.forEach((order, index) => {
        let card = document.createElement('div');
        card.style.cssText = "background: #1e293b; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #334155; margin-bottom: 12px;";
        card.innerHTML = `
            <h4 style="color: #38bdf8; margin: 0 0 10px 0;">📦 طلب رقم #${order.id || (index + 1)}</h4>
            <p><strong>👤 العميل:</strong> ${order.customerName || 'غير متوفر'}</p>
            <p><strong>🛒 التفاصيل:</strong> ${order.details || (order.items ? JSON.stringify(order.items) : 'طلب جديد')}</p>
            <p><strong>💰 الإجمالي:</strong> ${order.total || 0} جنيه</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">التاريخ: ${order.createdAt || 'الآن'}</p>
        `;
        ordersContainer.appendChild(card);
    });
}

// تشغيل التحميل والتنبيهات بانتظام
window.addEventListener('DOMContentLoaded', () => {
    loadAdminOrders();
});

let lastOrderCount = (JSON.parse(localStorage.getItem('ready_orders')) || []).length;
// 1. دالة تفعيل التنبيهات الصوتية عبر تفاعل حقيقي من المستخدم
window.enableAudioAlerts = function() {
    localStorage.setItem('audio_allowed', 'true');
    const testAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    testAudio.play().then(() => {
        alert("✅ تم تفعيل التنبيهات الصوتية الدائمة بنجاح!");
    }).catch(e => {
        console.log("Audio unlock failed", e);
    });
};

// 2. دالة تحميل وعرض الطلبات في اللوحة
function loadAdminOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;

    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 20px; font-size: 16px;">لا توجد طلبات جديدة حالياً</p>';
        return;
    }

    ordersContainer.innerHTML = ''; // تفريغ الحاوية لعرض الداتا الجديدة

    orders.forEach((order, index) => {
        let card = document.createElement('div');
        card.style.cssText = "background: #1e293b; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #334155; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
        card.innerHTML = `
            <h4 style="color: #38bdf8; margin: 0 0 10px 0; font-size: 18px;">📦 طلب رقم #${order.id || (index + 1)}</h4>
            <p><strong>👤 العميل:</strong> ${order.customerName || 'غير متوفر'}</p>
            <p><strong>🛒 التفاصيل:</strong> ${typeof order.details === 'object' ? JSON.stringify(order.details) : (order.details || 'طلب جديد')}</p>
            <p><strong>💰 الإجمالي:</strong> ${order.total || 0} جنيه</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">التاريخ: ${order.createdAt || 'الآن'}</p>
        `;
        ordersContainer.appendChild(card);
    });
}

// التشغيل الفوري عند فتح لوحة الإدارة
window.addEventListener('DOMContentLoaded', () => {
    loadAdminOrders();
});

// مراقبة التغييرات كل ثانية وتنبيه الإدارة صوتياً
let lastOrderCount = (JSON.parse(localStorage.getItem('ready_orders')) || []).length;

setInterval(() => {
    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    if (orders.length !== lastOrderCount) {
        if (orders.length > lastOrderCount) {
            try {
                const adminAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                adminAudio.play().catch(e => {});
            } catch (e) {}
        }
        lastOrderCount = orders.length;
        loadAdminOrders();
    }
}, 1000);