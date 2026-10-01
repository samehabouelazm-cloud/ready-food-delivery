document.addEventListener('DOMContentLoaded', async () => {
    try {
        // تحميل المنتجات وعرضها
        const response = await fetch('../data.json');
        const data = await response.json();
        
        const menuContainer = document.getElementById('menuContainer');
        if (menuContainer && data && data.categories) {
            let html = '';
            data.categories.forEach(category => {
                html += `<div class="category-section"><h2>${category.name}</h2><div class="products-grid">`;
                category.products.forEach(product => {
                    html += `
                        <div class="product-card">
                            <h3>${product.name}</h3>
                            <p>${product.price} ج.م</p>
                            <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})" style="background:#f59e0b; color:#fff; padding:8px 12px; border:none; border-radius:5px; cursor:pointer;">إضافة</button>
                        </div>`;
                });
                html += `</div></div>`;
            });
            menuContainer.innerHTML = html;
        }
    } catch (e) {
        console.error("خطأ في تحميل المنتجات:", e);
    }
});

// دالة إتمام الطلب وعارضه عبر الواتساب مباشرة
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'checkoutBtn') {
        const nameInput = document.querySelector('input[placeholder*="اسم"]') || document.getElementById('customerName');
        const phoneInput = document.querySelector('input[placeholder*="الجوال"]') || document.getElementById('customerPhone');
        
        const name = nameInput ? nameInput.value.trim() : 'عميل';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        
        if (!phone) {
            alert('من فضلك أدخل رقم الجوال على الأقل لتتمكن من إتمام الطلب.');
            return;
        }
        
        let msg = `🛒 طلب جديد:\n👤 الاسم: ${name}\n📱 الجوال: ${phone}\n🚀 تم إرسال الطلب بنجاح!`;
        window.open(`https://wa.me/201034101822?text=${encodeURIComponent(msg)}`, '_blank');
    }
});

function addToCart(id, name, price) {
    alert(`تمت إضافة ${name} إلى السلة بنجاح!`);
}