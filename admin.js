// ==========================================
// إدارة وإضافة المنتجات بدقة تالية
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');
    
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('pName') || document.getElementById('productName');
            const priceInput = document.getElementById('pPrice') || document.getElementById('productPrice');
            const catInput = document.getElementById('pCategory') || document.getElementById('itemCategory');
            const imageFileInput = document.getElementById('pImageFile') || document.getElementById('productImageFile');

            if (!nameInput || !priceInput || !nameInput.value.trim() || !priceInput.value.trim()) {
                alert('يرجى التأكد من حقول ادخال السعر والاسم في لوحة التحكم.');
                return;
            }

            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value) || 0;
            const category = catInput ? catInput.value.trim() : 'عام';
            const imageFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(uploadEvent) {
                    const base64Image = uploadEvent.target.result;
                    saveProductAndRefresh(name, price, category, base64Image);
                };
                reader.readAsDataURL(imageFile);
            } else {
                saveProductAndRefresh(name, price, category, 'https://via.placeholder.com/150');
            }
        });
    }

    loadAdminProducts();
    loadAdminOrders();
});

function saveProductAndRefresh(name, price, category, image) {
    let products = JSON.parse(localStorage.getItem('ready_products')) || [];
    
    const newProduct = {
        id: "p_" + Date.now(),
        name: name,
        price: price,
        category: category,
        image: image
    };
    
    products.push(newProduct);
    localStorage.setItem('ready_products', JSON.stringify(products));

    // تفريغ الحقول بعد الحفظ
    const nameInput = document.getElementById('pName') || document.getElementById('productName');
    const priceInput = document.getElementById('pPrice') || document.getElementById('productPrice');
    const catInput = document.getElementById('pCategory') || document.getElementById('itemCategory');
    const imageFileInput = document.getElementById('pImageFile') || document.getElementById('productImageFile');

    if (nameInput) nameInput.value = "";
    if (priceInput) priceInput.value = "";
    if (catInput) catInput.value = "";
    if (imageFileInput) imageFileInput.value = "";

    alert('✅ تم حفظ وإضافة المنتج بنجاح!');
    loadAdminProducts();
}

// دالة حذف منتج
window.deleteAdminProduct = function(id) {
    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem("ready_products", JSON.stringify(products));
    loadAdminProducts();
};

// عرض المنتجات في لوحة التحكم
function loadAdminProducts() {
    const container = document.getElementById("adminProductsList") || document.getElementById("productsList");
    if (!container) return;

    let products = JSON.parse(localStorage.getItem("ready_products")) || [];
    
    if (products.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 15px;">لا توجد منتجات مسجلة حالياً.</p>`;
        return;
    }

    container.innerHTML = products.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #334155; color: #fff;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.image || 'https://via.placeholder.com/50'}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;">
                <div>
                    <strong>${p.name}</strong><br>
                    <span style="color: #f59e0b; font-size: 14px;">${p.price} ج.م</span> - <span style="color: #38bdf8; font-size: 12px;">${p.category || 'عام'}</span>
                </div>
            </div>
            <button onclick="deleteAdminProduct('${p.id}')" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">حذف</button>
        </div>
    `).join('');
}

// ==========================================
// جلب الطلبات ومراقبتها
// ==========================================
function loadAdminOrders() {
    const ordersContainer = document.getElementById('orders-container') || document.querySelector('.orders-container');
    if (!ordersContainer) return;

    let orders = JSON.parse(localStorage.getItem('ready_orders')) || [];
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding: 20px;">لا توجد طلبات جديدة حالياً</p>';
        return;
    }

    ordersContainer.innerHTML = orders.map((order, index) => `
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; color: #fff; border: 1px solid #334155; margin-bottom: 12px;">
            <h4 style="color: #38bdf8; margin: 0 0 10px 0;">📦 طلب رقم #${order.id || (index + 1)}</h4>
            <p><strong>👤 العميل:</strong> ${order.customerName || order.name || 'غير متوفر'}</p>
            <p><strong>📞 الهاتف:</strong> ${order.phone || 'غير متوفر'}</p>
            <p><strong>💰 الإجمالي:</strong> ${order.total || 0} جنيه</p>
        </div>
    `).join('');
}