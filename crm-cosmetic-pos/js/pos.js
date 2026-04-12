// Global State
let cart = [];
let products = [];
let currentCategory = 'all';
let customer = null;
let selectedPaymentMethod = 'cash';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  renderProducts();
  updateCart();
  setupEventListeners();
  
  // Focus search box
  document.getElementById('searchInput').focus();
});

// Load products from JSON
async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    products = await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
    products = [];
  }
}

// Render products
function renderProducts() {
  const productGrid = document.getElementById('productGrid');
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  let filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                         product.price.toString().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
  
  productGrid.innerHTML = filteredProducts.map(product => `
    <div class="product-card ${product.stock === 0 ? 'out-of-stock' : ''}" 
         onclick="${product.stock > 0 ? `addToCart(${product.id})` : 'showOutOfStockAlert()'}">
      ${product.badge ? `<div class="product-badge badge-${product.badge}">
        ${product.badge === 'sale' ? '🔥 Sale' : '⭐ Best'}
      </div>` : ''}
      <div class="product-image">${product.image}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">${formatCurrency(product.price)}</div>
      <div class="product-stock ${getStockClass(product.stock)}">
        ${product.stock === 0 ? 'HẾT HÀNG' : `📦 Còn: ${product.stock}`}
      </div>
    </div>
  `).join('');
}

// Get stock class
function getStockClass(stock) {
  if (stock === 0) return 'stock-out';
  if (stock < 5) return 'stock-low';
  if (stock < 10) return 'stock-medium';
  return 'stock-high';
}

// Add to cart
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      alert(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      maxStock: product.stock
    });
  }
  
  updateCart();
}

// Update cart display
function updateCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount;
  
  // Render cart items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="cart-empty">🛒 Giỏ hàng trống</div>';
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-header">
          <div class="cart-item-name">${item.name}</div>
          <button class="btn btn-remove" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-controls">
            <div class="btn-qty" onclick="decreaseQuantity(${item.id})">−</div>
            <input type="number" class="qty-input" value="${item.quantity}" 
                   onchange="updateQuantity(${item.id}, this.value)" min="1" max="${item.maxStock}">
            <div class="btn-qty" onclick="increaseQuantity(${item.id})">+</div>
          </div>
          <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
        </div>
      </div>
    `).join('');
    
    // Add gift item if applicable
    if (shouldAddGift()) {
      cartItemsContainer.innerHTML += `
        <div class="cart-item cart-gift-item">
          <div class="gift-label">🎁 QUÀ TẶNG (Tự động áp dụng)</div>
          <div class="cart-item-name">✨ Mascara Mini (KM Mua 2 Tặng 1)</div>
          <div class="cart-item-controls">
            <div></div>
            <div class="item-price">0đ</div>
          </div>
        </div>
      `;
    }
  }
  
  // Update promotion section
  const promotionSection = document.getElementById('promotionSection');
  if (discount > 0 || shouldAddGift()) {
    promotionSection.style.display = 'block';
    document.getElementById('promotionDetails').innerHTML = `
      ${discount > 0 ? `<div class="promotion-item">✅ Chương trình: "Mừng 8/3 - Giảm 10%"</div>
      <div class="promotion-item">Giảm: ${formatCurrency(discount)}</div>` : ''}
      ${shouldAddGift() ? `<div class="promotion-item">✅ Quà tặng: Mascara Mini (x1)</div>` : ''}
    `;
  } else {
    promotionSection.style.display = 'none';
  }
  
  // Update summary
  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('discount').textContent = formatCurrency(discount);
  document.getElementById('total').textContent = formatCurrency(total);
  document.getElementById('points').textContent = `+${Math.floor(total / 10000)} điểm`;
  
  // Update button state
  document.getElementById('btnCheckout').disabled = cart.length === 0;
}

// Calculate functions
function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateDiscount(subtotal) {
  // 10% discount for 8/3 promotion if subtotal > 500k
  if (subtotal >= 500000) {
    return Math.floor(subtotal * 0.1);
  }
  return 0;
}

function shouldAddGift() {
  // Gift if buying 2 or more makeup items
  const makeupCount = cart.filter(item => {
    const product = products.find(p => p.id === item.id);
    return product && product.category === 'makeup';
  }).reduce((sum, item) => sum + item.quantity, 0);
  
  return makeupCount >= 2;
}

// Cart operations
function removeFromCart(productId) {
  if (confirm('Xóa sản phẩm này khỏi giỏ hàng?')) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
  }
}

function increaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item && item.quantity < item.maxStock) {
    item.quantity++;
    updateCart();
  } else {
    alert(`Chỉ còn ${item.maxStock} sản phẩm trong kho!`);
  }
}

function decreaseQuantity(productId) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    if (item.quantity > 1) {
      item.quantity--;
      updateCart();
    } else {
      removeFromCart(productId);
    }
  }
}

function updateQuantity(productId, newQuantity) {
  const item = cart.find(item => item.id === productId);
  const qty = parseInt(newQuantity);
  
  if (item && qty > 0 && qty <= item.maxStock) {
    item.quantity = qty;
    updateCart();
  } else if (qty > item.maxStock) {
    alert(`Chỉ còn ${item.maxStock} sản phẩm trong kho!`);
    updateCart();
  }
}

// Category filter
function filterCategory(category) {
  currentCategory = category;
  
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderProducts();
}

// Search
function handleSearch() {
  renderProducts();
}

// Customer search
function searchCustomer() {
  // Simulate customer search - in real app, this would open a modal
  customer = {
    phone: '0901234567',
    name: 'Nguyễn Văn A',
    tier: 'GOLD',
    points: 2450
  };
  
  document.getElementById('customerDetails').innerHTML = `
    <div class="customer-name">📱 ${customer.phone} - ${customer.name}</div>
    <div class="customer-tier">⭐ Hạng: ${customer.tier} | 💎 ${customer.points} điểm</div>
  `;
}

function clearCustomer() {
  customer = null;
  document.getElementById('customerDetails').innerHTML = `
    <div class="customer-name">Khách vãng lai</div>
  `;
}

// Checkout
function checkout() {
  if (cart.length === 0) return;
  
  const total = calculateSubtotal() - calculateDiscount(calculateSubtotal());
  document.getElementById('modalTotal').textContent = formatCurrency(total);
  document.getElementById('paymentModal').classList.add('active');
  
  // Select default payment method
  selectPaymentMethod('cash');
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  
  // Update UI
  document.querySelectorAll('.payment-method').forEach(el => {
    el.classList.remove('selected');
  });
  document.getElementById(`payment-${method}`).classList.add('selected');
  
  // Show/hide cash input
  const cashSection = document.getElementById('cashInputSection');
  if (method === 'cash') {
    cashSection.style.display = 'block';
  } else {
    cashSection.style.display = 'none';
  }
}

function calculateChange() {
  const total = calculateSubtotal() - calculateDiscount(calculateSubtotal());
  const received = parseFloat(document.getElementById('cashReceived').value) || 0;
  const change = received - total;
  
  document.getElementById('changeAmount').textContent = formatCurrency(Math.max(0, change));
  
  // Enable complete button if enough cash
  document.getElementById('btnComplete').disabled = received < total;
}

function setQuickAmount(amount) {
  const total = calculateSubtotal() - calculateDiscount(calculateSubtotal());
  let quickAmount = total;
  
  // Round up to nearest denomination
  if (amount === 20000) {
    quickAmount = Math.ceil(total / 20000) * 20000;
  } else if (amount === 50000) {
    quickAmount = Math.ceil(total / 50000) * 50000;
  } else if (amount === 100000) {
    quickAmount = Math.ceil(total / 100000) * 100000;
  } else if (amount === 200000) {
    quickAmount = Math.ceil(total / 200000) * 200000;
  } else if (amount === 500000) {
    quickAmount = Math.ceil(total / 500000) * 500000;
  }
  
  document.getElementById('cashReceived').value = quickAmount;
  calculateChange();
}

function completePayment() {
  // Close payment modal
  closeModal('paymentModal');
  
  // Generate order code
  const orderCode = generateOrderCode();
  const orderTime = new Date().toLocaleString('vi-VN');
  
  // Show success modal
  document.getElementById('orderCode').textContent = orderCode;
  document.getElementById('orderTime').textContent = orderTime;
  document.getElementById('successModal').classList.add('active');
  
  // Auto redirect after 5 seconds
  let countdown = 5;
  const countdownEl = document.getElementById('countdown');
  const interval = setInterval(() => {
    countdown--;
    countdownEl.textContent = `Tự động chuyển sang đơn mới sau ${countdown} giây...`;
    
    if (countdown <= 0) {
      clearInterval(interval);
      newOrder();
    }
  }, 1000);
}

function generateOrderCode() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `POS-${year}${month}${day}-${random}`;
}

function printReceipt() {
  alert('Đang in hóa đơn...\n(Trong ứng dụng thật sẽ kết nối với máy in nhiệt)');
}

function sendReceipt() {
  alert('Đã gửi hóa đơn qua Email/SMS!');
}

function newOrder() {
  // Clear cart
  cart = [];
  customer = null;
  selectedPaymentMethod = 'cash';
  
  // Reset UI
  clearCustomer();
  updateCart();
  document.getElementById('searchInput').value = '';
  document.getElementById('searchInput').focus();
  
  // Close modals
  closeModal('successModal');
  closeModal('paymentModal');
}

function cancelOrder() {
  if (cart.length > 0) {
    if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      newOrder();
    }
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Alert functions
function showOutOfStockAlert() {
  alert('⚠️ Sản phẩm này hiện đã HẾT HÀNG!');
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Setup event listeners
function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // F12 - Checkout
    if (e.key === 'F12') {
      e.preventDefault();
      if (cart.length > 0) {
        checkout();
      }
    }
    
    // ESC - Cancel
    if (e.key === 'Escape') {
      const paymentModal = document.getElementById('paymentModal');
      const successModal = document.getElementById('successModal');
      
      if (paymentModal.classList.contains('active')) {
        closeModal('paymentModal');
      } else if (successModal.classList.contains('active')) {
        closeModal('successModal');
      } else {
        cancelOrder();
      }
    }
    
    // F1 - New order
    if (e.key === 'F1') {
      e.preventDefault();
      newOrder();
    }
    
    // F2 - Search customer
    if (e.key === 'F2') {
      e.preventDefault();
      searchCustomer();
    }
    
    // F3 - Focus search
    if (e.key === 'F3') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
  
  // Enter in payment modal
  document.getElementById('cashReceived')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const btnComplete = document.getElementById('btnComplete');
      if (!btnComplete.disabled) {
        completePayment();
      }
    }
  });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
