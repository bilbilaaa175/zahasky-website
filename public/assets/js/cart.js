// public/assets/js/cart.js

// Status simpan id item yang dicentang
let selectedItems = new Set();

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function renderCartPage() {
  const cart = getCart();
  const emptyView = document.getElementById("cart-empty");
  const contentView = document.getElementById("cart-content");
  const itemsContainer = document.getElementById("cart-items-list");

  if (!cart || cart.length === 0) {
    if (emptyView) {
      emptyView.classList.remove("hidden");
      emptyView.classList.add("flex");
    }
    if (contentView) {
      contentView.classList.add("hidden");
      contentView.classList.remove("flex");
    }
    return;
  }

  if (emptyView) emptyView.classList.add("hidden");
  if (contentView) contentView.classList.remove("hidden");

  // Secara default jika pertama kali buka, centang semua item
  if (selectedItems.size === 0 && cart.length > 0) {
    cart.forEach(item => selectedItems.add(item.id));
  }

  itemsContainer.innerHTML = cart.map((item) => {
    const itemTotal = item.price * item.quantity;
    const isChecked = selectedItems.has(item.id) ? "checked" : "";

    // LOGIKA PENENTU LINK DETAIL PRODUK
    let targetPage = "catalog.html"; // Default fallback jika tidak terdeteksi

    const itemType = (item.page_type || item.type || item.category || "").toLowerCase();

    if (itemType.includes("package")) {
      targetPage = "package.html";
    } else if (itemType.includes("publicity") || itemType.includes("jurnal")) {
      targetPage = "publicity.html";
    } else if (itemType.includes("catalog")) {
      targetPage = "catalog.html";
    }
return `
  <div class="px-4 py-4 md:px-6 md:py-5 grid cart-table-grid gap-4 items-center bg-white">
    
    <!-- KOLOM 1: CHECKBOX -->
    <div class="flex items-center justify-start">
      <input type="checkbox" 
             value="${item.id}" 
             ${isChecked} 
             onchange="toggleItemSelect(${item.id}, this.checked)" 
             class="item-checkbox w-4 h-4 accent-brown cursor-pointer" />
    </div>

    <!-- KOLOM 2: PRODUK (Gambar + Teks) -->
    <a href="${targetPage}?id=${item.id}" class="flex items-center gap-3 md:gap-4 w-full group hover:opacity-80 transition-opacity">
      <img src="${item.image_url}" alt="${item.name}" 
           class="w-14 h-14 md:w-20 md:h-20 aspect-square object-cover bg-brown/5 shrink-0 border border-brown/10 rounded-none group-hover:border-brown/40 transition-colors" 
           onerror="this.src='https://via.placeholder.com/80?text=No+Image'"/>
      <div class="flex-1 min-w-0">
        <h3 class="font-serif font-semibold text-brown text-sm md:text-base leading-snug truncate group-hover:underline">${item.name}</h3>
        <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-brown/10 text-brown rounded-none">
          ${item.file_format || "ZIP"}
        </span>
      </div>
    </a>

    <!-- KOLOM 3: HARGA SATUAN -->
    <div class="text-left text-xs md:text-sm text-ink whitespace-nowrap">
      <span>${formatRupiah(item.price)}</span>
    </div>

    <!-- KOLOM 4: KUANTITAS -->
    <div class="flex items-center justify-start">
      <div class="flex items-center border border-brown/20 bg-white rounded-none">
        <button type="button" onclick="updateQty(${item.id}, -1)" class="w-6 h-6 md:w-8 md:h-8 text-xs md:text-base font-semibold text-brown hover:bg-brown/10 transition-colors flex items-center justify-center border-r border-brown/20">-</button>
        <span class="w-8 md:w-12 text-center text-xs font-mono font-semibold">${item.quantity}</span>
        <button type="button" onclick="updateQty(${item.id}, 1)" class="w-6 h-6 md:w-8 md:h-8 text-xs md:text-base font-semibold text-brown hover:bg-brown/10 transition-colors flex items-center justify-center border-l border-brown/20">+</button>
      </div>
    </div>

    <!-- KOLOM 5: TOTAL HARGA -->
    <div class="text-left font-mono text-xs md:text-sm font-bold text-brown whitespace-nowrap">
      <span>${formatRupiah(itemTotal)}</span>
    </div>

    <!-- KOLOM 6: AKSI -->
    <div class="text-left">
      <button type="button" onclick="removeItem(${item.id})" class="text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition-colors">
        Hapus
      </button>
    </div>

  </div>
`;
  }).join("");

  updateSummary();
}

function updateSummary() {
  const cart = getCart();
  let selectedCount = 0;
  let totalPrice = 0;

  cart.forEach(item => {
    if (selectedItems.has(item.id)) {
      selectedCount += item.quantity;
      totalPrice += item.price * item.quantity;
    }
  });

  const totalCartItemsCount = document.getElementById("total-cart-items-count");
  const summarySelectedCount = document.getElementById("summary-selected-count");
  const summaryPrice = document.getElementById("summary-total-price");
  const checkAllHeader = document.getElementById("check-all-header");
  const checkAllFooter = document.getElementById("check-all-footer");

  if (totalCartItemsCount) totalCartItemsCount.textContent = cart.length;
  if (summarySelectedCount) summarySelectedCount.textContent = selectedCount;
  if (summaryPrice) summaryPrice.textContent = formatRupiah(totalPrice);

  const isAllChecked = cart.length > 0 && selectedItems.size === cart.length;
  if (checkAllHeader) checkAllHeader.checked = isAllChecked;
  if (checkAllFooter) checkAllFooter.checked = isAllChecked;
}

function toggleItemSelect(id, isChecked) {
  if (isChecked) {
    selectedItems.add(id);
  } else {
    selectedItems.delete(id);
  }
  updateSummary();
}

function toggleSelectAll(isChecked) {
  const cart = getCart();
  if (isChecked) {
    cart.forEach(item => selectedItems.add(item.id));
  } else {
    selectedItems.clear();
  }
  renderCartPage();
}

function updateQty(id, change) {
  let cart = getCart();
  const index = cart.findIndex((item) => item.id === id);
  if (index > -1) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
      selectedItems.delete(id);
    }
    localStorage.setItem("zahasky_cart", JSON.stringify(cart));
    if (typeof updateCartBadge === "function") updateCartBadge();
    renderCartPage();
  }
}

function removeItem(id) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== id);
  selectedItems.delete(id);
  localStorage.setItem("zahasky_cart", JSON.stringify(cart));
  if (typeof updateCartBadge === "function") updateCartBadge();
  renderCartPage();
}

function deleteSelectedItems() {
  if (selectedItems.size === 0) {
    alert("Pilih minimal satu produk untuk dihapus.");
    return;
  }
  let cart = getCart();
  cart = cart.filter((item) => !selectedItems.has(item.id));
  selectedItems.clear();
  localStorage.setItem("zahasky_cart", JSON.stringify(cart));
  if (typeof updateCartBadge === "function") updateCartBadge();
  renderCartPage();
}

function checkout() {
  if (selectedItems.size === 0) {
    if (typeof showToastSuccess === 'function') {
      showToastSuccess("Pilih minimal 1 produk untuk melanjutkan checkout!");
    } else {
      alert("Silakan pilih minimal satu produk untuk di-checkout!");
    }
    return;
  }

  const cart = getCart();
  const itemsToCheckout = cart.filter(item => selectedItems.has(item.id));

  if (itemsToCheckout.length === 0) {
    alert("Produk yang dipilih tidak ditemukan di keranjang.");
    return;
  }

  // Simpan item yang akan di-checkout ke sessionStorage
  sessionStorage.setItem('checkout_items', JSON.stringify(itemsToCheckout));

  // Redirect ke halaman checkout
  window.location.href = 'checkout.html';
}

document.addEventListener("DOMContentLoaded", renderCartPage);