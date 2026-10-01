let cartItem = null;

function addToCart(name, price) {
    cartItem = { name, price };
    document.getElementById('cartSummary').innerHTML = `📦 <b>${name}</b> - ${price} ج.م`;
    alert(`تمت إضافة ${name} بنجاح إلى السلة!`);
}

function checkoutOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone) {
        alert('من فضلك ادخل الاسم ورقم الجوال على الأقل!');
        return;
    }

    if (!cartItem) {
        alert('السلة فارغة، من فضلك اختر منتجاً أولاً!');
        return;
    }

    let msg = `🛒 طلب جديد عبر المنصة:\n`;
    msg += `👤 الاسم: ${name}\n`;
    msg += `📱 الجوال: ${phone}\n`;
    msg += `📍 العنوان: ${address || 'توصيل سريع'}\n`;
    msg += `📦 المنتج: ${cartItem.name} (${cartItem.price} ج.م)\n`;

    window.open(`https://wa.me/201034101822?text=${encodeURIComponent(msg)}`, '_blank');
}