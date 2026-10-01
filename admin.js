// admin.js - الكود الشامل والمحدث لإدارة المطعم والتنبيهات وحفظ المنتجات والسائقين بدون أخطاء

document.addEventListener("DOMContentLoaded", function() {
    console.log("READY OS - لوحة التحكم تعمل بكفاءة عالية");
    loadAdminProducts();
    setupAdminListeners();
});

function setupAdminListeners() {
    const addItemForm = document.getElementById("addItemForm");
    if (addItemForm) {
        addItemForm.addEventListener("submit", function(e) {
            e.preventDefault();
            saveNewProduct();
        });
    }
}

// دالة حفظ وإضافة منتج جديد وتفادي أي شلل أو توقف
function saveNewProduct() {
    const name = document.getElementById("itemName") ? document.getElementById("itemName").value : "";
    const price = document.getElementById("itemPrice") ? document.getElementById("itemPrice").value : "";
    const category = document.getElementById("itemCategory") ? document.getElementById("itemCategory").value : "general";
    const image = document.getElementById("itemImage") ? document.getElementById("itemImage").value : "";

    if (!name || !price) {
        showAdminNotification("⚠️ برجاء إدخال اسم المنتج والسعر على الأقل!", "error");
        return;
    }

    const newProduct = {
        id: "prod_" + Date.now(),
        name: name,
        price: parseFloat(price),
        category: category,
        image: image || "https://via.placeholder.com/150"
    };

    // حفظ محلياً لضمان عدم ضياع البيانات وسرعة الاستجابة (LocalStorage)
    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    products.push(newProduct);
    localStorage.setItem("ready_products", JSON.stringify(products));

    showAdminNotification("✅ تم إضافة وحفظ المنتج بنجاح وتحديث النظام!", "success");
    
    // إعادة تعيين النموذج
    const form = document.getElementById("addItemForm");
    if (form) form.reset();
    
    loadAdminProducts();
}

// عرض المنتجات في لوحة التحكم
function loadAdminProducts() {
    const container = document.getElementById("adminProductsList");
    if (!container) return;

    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    
    if (products.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد منتجات مضافة حالياً. أضف منتجك الأول!</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
            <div>
                <strong>${p.name}</strong> - <span style="color: #f59e0b;">${p.price} ج.م</span>
            </div>
            <button onclick="deleteProduct('${p.id}')" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">حذف</button>
        </div>
    `).join('');
}

// دالة حذف منتج
window.deleteProduct = function(id) {
    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem("ready_products", JSON.stringify(products));
    loadAdminProducts();
    showAdminNotification("🗑️ تم حذف المنتج بنجاح", "info");
};

// إضافة سائق جديد بدون مشاكل
window.addDriver = function() {
    const nameInput = document.getElementById('driverNameInput');
    const phoneInput = document.getElementById('driverPhoneInput');
    
    if (!nameInput || !phoneInput) return;
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        showAdminNotification("⚠️ برجاء إدخال اسم ورقم هاتف السائق!", "error");
        return;
    }

    let drivers = JSON.parse(localStorage.getItem("ready_drivers")) || [];
    drivers.push({ id: "drv_" + Date.now(), name, phone });
    localStorage.setItem("ready_drivers", JSON.stringify(drivers));

    showAdminNotification("🚗 تم إضافة السائق بنجاح!", "success");
    nameInput.value = '';
    phoneInput.value = '';
    
    if (typeof loadDriversList === 'function') loadDriversList();
};

// نظام التنبيهات الفورية الفعالة داخل اللوحة
function showAdminNotification(message, type = "success") {
    let notif = document.getElementById("adminNotificationToast");
    if (!notif) {
        notif = document.createElement("div");
        notif.id = "adminNotificationToast";
        notif.style.cssText = "position: fixed; bottom: 20px; left: 20px; z-index: 9999; padding: 15px 25px; border-radius: 8px; font-weight: bold; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s ease;";
        document.body.appendChild(notif);
    }

    if (type === "success") notif.style.background = "#10b981";
    else if (type === "error") notif.style.background = "#ef4444";
    else notif.style.background = "#3b82f6";

    notif.innerText = message;
    notif.style.opacity = "1";

    setTimeout(() => {
        notif.style.opacity = "0";
    }, 3500);
}