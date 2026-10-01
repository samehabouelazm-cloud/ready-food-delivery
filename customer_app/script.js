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