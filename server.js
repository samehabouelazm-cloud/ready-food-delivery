let currentQty = 1;

function changeQty(val) {
    currentQty += val;
    if (currentQty < 1) currentQty = 1;
    const qtyDisplay = document.getElementById('qty_display');
    if (qtyDisplay) qtyDisplay.innerText = currentQty;
}

function saveDetails() {
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const addressEl = document.getElementById('customerAddress');
    
    const data = {
        name: nameEl ? nameEl.value : '',
        phone: phoneEl ? phoneEl.value : '',
        address: addressEl ? addressEl.value : ''
    };
    localStorage.setItem('jahez_saved_customer', JSON.stringify(data));
}

window.onload = function() {
    const saved = localStorage.getItem('jahez_saved_customer');
    if (saved) {
        const data = JSON.parse(saved);
        const nameEl = document.getElementById('customerName');
        const phoneEl = document.getElementById('customerPhone');
        const addressEl = document.getElementById('customerAddress');
        
        if (nameEl) nameEl.value = data.name || '';
        if (phoneEl) phoneEl.value = data.phone || '';
        if (addressEl) addressEl.value = data.address || '';
    }
};

function addToCart(itemName, itemPrice) {
    let cart = JSON.parse(localStorage.getItem('jahez_cart')) || [];
    cart.push({ name: itemName, price: itemPrice, quantity: currentQty });
    localStorage.setItem('jahez_cart', JSON.stringify(cart));
    alert(`تمت إضافة ${currentQty} من (${itemName}) إلى السلة بنجاح!`);
    currentQty = 1;
    const qtyDisplay = document.getElementById('qty_display');
    if (qtyDisplay) qtyDisplay.innerText = '1';
}