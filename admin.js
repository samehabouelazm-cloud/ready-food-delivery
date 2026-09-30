import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBur8SO0RjrJvutWYRy7QdRepUJWtQzQLY",
    authDomain: "readystore-542e0.firebaseapp.com",
    projectId: "readystore-542e0",
    storageBucket: "readystore-542e0.firebasestorage.app",
    messagingSenderId: "698121296035",
    appId: "1:698121296035:web:6d237104d976e11120c716",
    measurementId: "G-56NZSGK3P2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let audioContext = null;
let allOrders = [];
let previousOrdersCount = -1;
let driversListGlobal = [];

window.onload = function() {
    checkAdminSoundSetup();
    listenToAdminOrders();
    listenToMenuAndDrivers();
};

function checkAdminSoundSetup() {
    if (localStorage.getItem('jahez_admin_sound_active') === 'true') {
        document.getElementById('adminSoundBadge').style.display = 'none';
    } else {
        document.getElementById('adminSoundBadge').style.display = 'block';
    }
}

window.enableAdminSound = function() {
    initAudioContext();
    playAdminAlertSound();
    localStorage.setItem('jahez_admin_sound_active', 'true');
    document.getElementById('adminSoundBadge').style.display = 'none';
    alert('✅ تم تفعيل التنبيهات الصوتية المستمرة للإدارة بنجاح!');
};

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playAdminAlertSound() {
    try {
        initAudioContext();
        if (!audioContext) return;
        const now = audioContext.currentTime;
        [0, 0.3, 0.6].forEach((delay, i) => {
            let osc = audioContext.createOscillator();
            let gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(700 + (i * 150), now + delay);
            gain.gain.setValueAtTime(0.3, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.2);
        });
    } catch (e) {
        console.log(e);
    }
}

function convertImageFileToBase64(fileInputId) {
    return new Promise((resolve) => {
        const fileInput = document.getElementById(fileInputId);
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            resolve('');
        }
    });
}

window.addMenuItemWithImages = async function() {
    const category = document.getElementById('itemCategory').value.trim();
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!category || !name || isNaN(price)) {
        alert('الرجاء إدخال اسم القسم، اسم الصنف، والسعر بشكل صحيح!');
        return;
    }

    const categoryImageBase64 = await convertImageFileToBase64('categoryImageFile');
    const itemImageBase64 = await convertImageFileToBase64('itemImageFile');

    push(ref(db, 'restaurantMenu'), { 
        category: category, 
        categoryImage: categoryImageBase64, 
        name: name, 
        price: price, 
        image: itemImageBase64 
    }).then(() => {
        alert('✅ تم إضافة الصنف مع الصور من جهازك بنجاح!');
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('categoryImageFile').value = '';
        document.getElementById('itemImageFile').value = '';
    }).catch((error) => {
        alert('خطأ في الإضافة: ' + error.message);
    });
};

window.deleteMenuItem = function(id) {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
        remove(ref(db, 'restaurantMenu/' + id));
    }
};

window.addDriver = function() {
    const name = document.getElementById('driverNameInput').value.trim();
    const phone = document.getElementById('driverPhoneInput').value.trim();
    if (!name || !phone) {
        alert('الرجاء إدخال اسم ورقم هاتف الكابتن!');
        return;
    }
    push(ref(db, 'driversTeam'), { name: name, phone: phone }).then(() => {
        document.getElementById('driverNameInput').value = '';
        document.getElementById('driverPhoneInput').value = '';
        alert('✅ تمت إضافة الكابتن بنجاح');
    });
};

window.deleteDriver = function(id) {
    remove(ref(db, 'driversTeam/' + id));
};

window.updateOrderDriverAndDelivery = function(orderId) {
    let driverSelect = document.getElementById('driver_select_' + orderId);
    let deliveryInput = document.getElementById('delivery_fee_' + orderId);
    
    let selectedDriver = driverSelect ? driverSelect.value : '';
    let deliveryFee = deliveryInput ? parseFloat(deliveryInput.value) || 0 : 0;

    update(ref(db, 'adminOrders/' + orderId), {
        driver: selectedDriver,
        deliveryFee: deliveryFee
    }).then(() => {
        alert('✅ تم تحديث بيانات التوصيل والكابتن بنجاح!');
    });
};

window.printOrderInvoice = function(orderId) {
    let order = allOrders.find(o => o.id == orderId);
    if (!order) return;

    let deliveryFee = parseFloat(order.deliveryFee || 0);
    let itemsTotal = parseFloat(order.total || 0);
    let finalTotal = itemsTotal + deliveryFee;

    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>فاتورة شراء رقم #${order.id}</title>
            <style>
                body { font-family: Tahoma, sans-serif; padding: 20px; direction: rtl; color: #333; }
                .invoice-box { max-width: 450px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h2 { text-align: center; color: #f59e0b; }
                table { width: 100%; margin-top: 15px; border-collapse: collapse; }
                table td { padding: 10px; border-bottom: 1px solid #eee; text-align: right; }
                table tr.total td { font-weight: bold; border-top: 2px solid #333; font-size: 16px; color: #0f172a; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <h2>منصة جاهز - فاتورة المشتريات</h2>
                <p><strong>رقم الطلب:</strong> #${order.id}</p>
                <p><strong>اسم العميل:</strong> ${order.customerName || 'غير متوفر'}</p>
                <p><strong>رقم الجوال:</strong> ${order.customerPhone || 'غير متوفر'}</p>
                <p><strong>العنوان:</strong> ${order.customerAddress || 'غير متوفر'}</p>
                <p><strong>الكابتن المسند:</strong> ${order.driver || 'لم يُحدد بعد'}</p>
                <hr>
                <table>
                    <tr>
                        <td>قيمة المشتريات (الأصناف)</td>
                        <td>${itemsTotal.toFixed(2)} جنيه</td>
                    </tr>
                    <tr>
                        <td>قيمة التوصيل المضافة</td>
                        <td>${deliveryFee.toFixed(2)} جنيه</td>
                    </tr>
                    <tr class="total">
                        <td>الإجمالي النهائي المطلوب</td>
                        <td>${finalTotal.toFixed(2)} جنيه</td>
                    </tr>
                </table>
                <br>
                <p style="text-align: center; font-size: 12px; color: #666;">شكراً لاستخدامكم منصة جاهز 🚀</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

function listenToAdminOrders() {
    const ordersRef = ref(db, 'adminOrders');
    onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('adminOrdersContainer');
        if (!data) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">لا توجد طلبات واردة حالياً.</p>';
            allOrders = [];
            previousOrdersCount = 0;
            return;
        }

        allOrders = [];
        Object.keys(data).forEach(key => {
            allOrders.push({ id: key, ...data[key] });
        });

        if (previousOrdersCount !== -1 && allOrders.length > previousOrdersCount) {
            if (localStorage.getItem('jahez_admin_sound_active') === 'true') {
                playAdminAlertSound();
            }
        }
        previousOrdersCount = allOrders.length;

        let html = '';
        allOrders.forEach(order => {
            let itemsText = order.items ? order.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : '';
            let currentDeliveryFee = order.deliveryFee || 0;
            let calculatedTotal = parseFloat(order.total || 0) + parseFloat(currentDeliveryFee);

            let driversOptions = '<option value="">-- اختر الكابتن --</option>';
            driversListGlobal.forEach(d => {
                let selected = (order.driver === d.name) ? 'selected' : '';
                driversOptions += `<option value="${d.name}" ${selected}>${d.name} (${d.phone})</option>`;
            });

            html += `
                <div class="order-card-admin">
                    <h3 style="color: #f59e0b; margin-top: 0;">📦 طلب رقم #${order.id}</h3>
                    <p><strong>اسم العميل:</strong> ${order.customerName}</p>
                    <p><strong>رقم الجوال:</strong> ${order.customerPhone}</p>
                    <p><strong>العنوان:</strong> ${order.customerAddress}</p>
                    <p><strong>الأصناف:</strong> ${itemsText}</p>
                    <p><strong>إجمالي المشتريات:</strong> ${order.total} جنيه</p>
                    
                    <div style="background: #0f172a; padding: 10px; border-radius: 6px; margin: 10px 0;">
                        <label style="font-size: 13px; color: #fbbf24;">إسناد للكابتن:</label>
                        <select id="driver_select_${order.id}">${driversOptions}</select>
                        
                        <label style="font-size: 13px; color: #fbbf24;">قيمة التوصيل اليدوية (جنيه):</label>
                        <input type="number" id="delivery_fee_${order.id}" value="${currentDeliveryFee}" placeholder="أدخل قيمة التوصيل">
                        
                        <button type="button" style="background: #3b82f6; padding: 8px; margin-top: 5px;" onclick="updateOrderDriverAndDelivery('${order.id}')">💾 حفظ تعيين الكابتن والتوصيل</button>
                    </div>

                    <p style="color: #22c55e; font-weight: bold; font-size: 16px;">الإجمالي النهائي المطلوب: ${calculatedTotal.toFixed(2)} جنيه</p>
                    <p><strong>الحالة:</strong> ${order.status}</p>

                    <button type="button" style="background: #8b5cf6; margin-top: 8px; padding: 10px;" onclick="printOrderInvoice('${order.id}')">🖨️ طباعة فاتورة المشتريات والتوصيل</button>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

function listenToMenuAndDrivers() {
    onValue(ref(db, 'driversTeam'), (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('driversListContainer');
        driversListGlobal = [];
        if (!data) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">لا توجد كباتن مسجلة حالياً.</p>';
            return;
        }
        let html = '';
        Object.keys(data).forEach(key => {
            let d = data[key];
            driversListGlobal.push(d);
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <span>🚴 ${d.name} (${d.phone})</span>
                    <button class="btn-danger" onclick="deleteDriver('${key}')">حذف</button>
                </div>
            `;
        });
        container.innerHTML = html;
    });

    onValue(ref(db, 'restaurantMenu'), (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('adminMenuContainer');
        if (!data) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">لا توجد أصناف مضافة حالياً.</p>';
            return;
        }
        let html = '';
        Object.keys(data).forEach(key => {
            let item = data[key];
            let imgSrc = item.image ? item.image : 'https://via.placeholder.com/60';
            html += `
                <div class="menu-item-card">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${imgSrc}" class="item-img">
                        <div>
                            <h4 style="margin: 0; color: #fff;">${item.name}</h4>
                            <span style="font-size: 12px; color: #f59e0b;">${item.category}</span>
                            <p style="margin: 4px 0 0 0; color: #22c55e; font-weight: bold;">${item.price} جنيه</p>
                        </div>
                    </div>
                    <button class="btn-danger" onclick="deleteMenuItem('${key}')">حذف</button>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}