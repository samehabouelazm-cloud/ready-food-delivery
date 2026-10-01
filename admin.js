// admin.js - الكود الشامل لإصلاح الحفظ والتنبيهات الصوتية والفورية

document.addEventListener("DOMContentLoaded", function() {
    console.log("READY OS - لوحة التحكم جاهزة ومحدثة");
    loadAdminProducts();
    setupProductFormListener();
});

// ربط نموذج إضافة المنتجات بضمان كامل
function setupProductFormListener() {
    // نبحث عن أي فورم أو زر إرسال للمنتجات
    const forms = document.querySelectorAll("form, #addItemForm, .add-product-form");
    forms.forEach(form => {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            saveProductFromDOM();
        });
    });

    // لو فيه زرار صريح لحفظ المنتج
    const saveBtn = document.getElementById("saveProductBtn") || document.querySelector(".save-product-btn");
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