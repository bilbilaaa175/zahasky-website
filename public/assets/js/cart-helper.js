// public/assets/js/cart-helper.js

// 1. Ambil data keranjang dari LocalStorage
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("zahasky_cart")) || [];
  } catch (e) {
    return [];
  }
}

// 2. Update badge keranjang di navbar
function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badgeEl = document.getElementById("cart-count");
  if (badgeEl) {
    badgeEl.textContent = totalCount;
  }
}

// 3. Pop-up Toast dengan Style CSS Murni (Pasti Tampil & Melayang di Paling Depan)
function showToastSuccess(message) {
  let toast = document.getElementById("custom-toast");
  
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "custom-toast";
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      z-index: 999999;
      background-color: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      color: white;
      padding: 24px 32px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    toast.innerHTML = `
      <div style="width:48px; height:48px; border-radius:50%; background-color:#10b981; display:flex; align-items:center; justify-content:center; color:white;">
        <svg style="width:28px; height:28px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p id="toast-message" style="margin:0; font-size:14px; font-weight:500; text-align:center; color:rgba(255,255,255,0.95); font-family:sans-serif;"></p>
    `;
    document.body.appendChild(toast);
  }

  const msgEl = document.getElementById("toast-message");
  if (msgEl) msgEl.textContent = message;

  // Jalankan animasi muncul
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.pointerEvents = "auto";
    toast.style.transform = "translate(-50%, -50%) scale(1)";
  }, 10);

  // Sembunyikan setelah 2 detik
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
    toast.style.transform = "translate(-50%, -50%) scale(0.9)";
  }, 2000);
}

// 4. Tambah produk ke keranjang
function addToCartGlobal(product) {
  let cart = getCart();
  const existingIndex = cart.findIndex((item) => item.id === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.list_price,
      image_url: product.image_url,
      file_format: product.x_file_format || "ZIP",
      quantity: 1
    });
  }

  localStorage.setItem("zahasky_cart", JSON.stringify(cart));
  updateCartBadge();
  showToastSuccess("Produk telah ditambahkan ke keranjang belanja");
}

// Event listener untuk badge & link keranjang navbar
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  const cartBtn = document.querySelector('button[aria-label="Keranjang belanja"]');
  if (cartBtn) {
    cartBtn.onclick = () => {
      window.location.href = "cart.html";
    };
  }
});