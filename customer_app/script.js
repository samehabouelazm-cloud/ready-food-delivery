let currentQty = 1;

function changeQty(val) {
    currentQty += val;
    if (currentQty < 1) currentQty = 1;
    document.getElementById('qty_display').innerText = currentQty;
}

function saveDetails() {
    const data = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };
    localStorage.setItem('jahez_saved_customer', JSON.stringify(data));
}
let currentQty = 1;

function changeQty(val) {
    currentQty += val;
    if (currentQty < 1) currentQty = 1;
    document.getElementById('qty_display').innerText = currentQty;
}

function saveDetails() {
    const data = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };
    localStorage.setItem('jahez_saved_customer', JSON.stringify(data));
}
window.onload = function() {
    const saved = localStorage.getItem('jahez_saved_customer');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('customerName').value = data.name || '';
        document.getElementById('customerPhone').value = data.phone || '';
        document.getElementById('customerAddress').value = data.address || '';
    }
};

function addToCart(itemName, itemPrice) {
    let cart = JSON.parse(localStorage.getItem('jahez_cart')) || [];
    cart.push({ name: itemName, price: itemPrice, quantity: currentQty });
    localStorage.setItem('jahez_cart', JSON.stringify(cart));
    alert(`تمت إضافة ${currentQty} من (${itemName}) إلى السلة بنجاح!`);
    currentQty = 1;
    document.getElementById('qty_display').innerText = '1';
}