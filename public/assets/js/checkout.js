/**
 * checkout.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Logika lengkap untuk halaman Checkout Zahasky.
 * Menangani: render produk, alamat, metode bayar, validasi, simpan pesanan.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ════════════════════════════════════════════════════════
//  STATE GLOBAL
// ════════════════════════════════════════════════════════
let checkoutItems   = [];                   // Item yang sedang di-checkout
let selectedPayMethod = { type: 'COD', sub: 'Tunai' }; // Default: COD
let savedAddress    = null;                 // Alamat tersimpan
let hasPhysicalItem = false;               // Apakah ada item Publicity (fisik)?
let hasDigitalItem  = false;               // Apakah ada item digital?
const SHIPPING_COST = 15000;               // Ongkir flat untuk Publicity (placeholder)

// ════════════════════════════════════════════════════════
//  FORMAT UTILITY
// ════════════════════════════════════════════════════════
function formatRp(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function generateOrderId() {
  const now    = new Date();
  const yy     = now.getFullYear().toString().slice(2);
  const mm     = String(now.getMonth() + 1).padStart(2, '0');
  const dd     = String(now.getDate()).padStart(2, '0');
  const rand   = Math.floor(Math.random() * 9000) + 1000;
  return `ZHK-${yy}${mm}${dd}-${rand}`;
}

// ════════════════════════════════════════════════════════
//  ENTRY POINT — DOMContentLoaded
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', initCheckoutPage);

async function initCheckoutPage() {
  // 1. Baca data dari sessionStorage
  try {
    const raw = sessionStorage.getItem('checkout_items');
    checkoutItems = raw ? JSON.parse(raw) : [];
  } catch { checkoutItems = []; }

  if (!checkoutItems || checkoutItems.length === 0) {
    showEmptyState();
    return;
  }

  showCheckoutContent();

  // 2. Deteksi tipe produk
  detectProductTypes();

  // 3. Render ringkasan produk
  renderOrderItems();

  // 4. Update summary panel
  updateSummary();

  // 5. Load alamat tersimpan
  loadSavedAddress();

  // 6. Inisialisasi dropdown wilayah
  initCascadingDropdown();

  // 7. Auto-buka modal alamat jika dari publicity (belum ada alamat)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('needAddress') === 'true' && hasPhysicalItem && !savedAddress) {
    setTimeout(() => openAddressModal(), 400);
  }
}

// ════════════════════════════════════════════════════════
//  EMPTY / CONTENT STATE
// ════════════════════════════════════════════════════════
function showEmptyState() {
  const empty   = document.getElementById('checkout-empty');
  const content = document.getElementById('checkout-content');
  const mobile  = document.getElementById('checkout-content-mobile');
  const bar     = document.getElementById('mobile-bottom-bar');
  if (empty)   { empty.classList.remove('hidden'); empty.classList.add('flex'); }
  if (content) content.classList.add('hidden');
  if (mobile)  mobile.classList.add('hidden');
  if (bar)     bar.classList.add('hidden');
}

function showCheckoutContent() {
  const empty   = document.getElementById('checkout-empty');
  const content = document.getElementById('checkout-content');
  const bar     = document.getElementById('mobile-bottom-bar');
  if (empty)   { empty.classList.add('hidden'); empty.classList.remove('flex'); }
  if (content) content.classList.remove('hidden');
  if (bar)     bar.classList.remove('hidden');
}

// ════════════════════════════════════════════════════════
//  DETEKSI TIPE PRODUK
// ════════════════════════════════════════════════════════
function detectProductTypes() {
  hasPhysicalItem = false;
  hasDigitalItem  = false;

  checkoutItems.forEach(item => {
    const t = (item.page_type || item.type || item.category || '').toLowerCase();
    if (t.includes('publicity')) {
      hasPhysicalItem = true;
    } else {
      hasDigitalItem = true;
    }
  });

  // Tampilkan / sembunyikan section alamat
  const sectionAddr = document.getElementById('section-address');
  if (sectionAddr) {
    if (hasPhysicalItem) {
      sectionAddr.classList.remove('hidden');
    } else {
      sectionAddr.classList.add('hidden');
    }
  }

  // Tampilkan info digital box
  const digitalBox = document.getElementById('digital-info-box');
  if (digitalBox) {
    if (hasDigitalItem) digitalBox.classList.remove('hidden');
    else digitalBox.classList.add('hidden');
  }

  // Tampilkan / sembunyikan baris ongkir
  const shippingRow = document.getElementById('shipping-row');
  if (shippingRow) {
    if (hasPhysicalItem) shippingRow.classList.remove('hidden');
    else shippingRow.classList.add('hidden');
  }
}

// ════════════════════════════════════════════════════════
//  RENDER ITEMS
// ════════════════════════════════════════════════════════
function renderOrderItems() {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  container.innerHTML = checkoutItems.map(item => {
    const subtotal = (item.price || 0) * (item.quantity || 1);
    const typeLabel = getTypeLabel(item);
    const typeBadgeColor = (item.page_type || '').toLowerCase().includes('publicity')
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';

    return `
      <div class="px-4 py-4 md:px-5 flex flex-col md:grid gap-3 md:gap-4 items-start md:items-center bg-white"
           style="grid-template-columns: 56px 1fr 110px 80px 110px;">
        
        <!-- Gambar -->
        <img src="${item.image_url || ''}" alt="${item.name || ''}"
             class="w-14 h-14 object-cover bg-brown/5 border border-brown/10 shrink-0 rounded-sm"
             onerror="this.src='https://via.placeholder.com/56?text=No+Img'" />
        
        <!-- Info Produk -->
        <div class="flex-1 min-w-0">
          <p class="font-serif font-semibold text-brown text-sm leading-snug line-clamp-2">${item.name || 'Produk'}</p>
          <div class="flex flex-wrap gap-1.5 mt-1.5">
            <span class="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${typeBadgeColor} rounded">
              ${typeLabel}
            </span>
            ${item.file_format ? `<span class="inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-brown/10 text-brown rounded">${item.file_format}</span>` : ''}
          </div>
          <!-- Mobile: harga + qty + subtotal -->
          <div class="flex items-center justify-between mt-2 md:hidden text-xs text-muted">
            <span>${formatRp(item.price)} × ${item.quantity || 1}</span>
            <span class="font-mono font-bold text-brown">${formatRp(subtotal)}</span>
          </div>
        </div>

        <!-- Harga Satuan (Desktop) -->
        <div class="hidden md:block text-right text-sm text-ink font-mono">${formatRp(item.price)}</div>

        <!-- Qty (Desktop) -->
        <div class="hidden md:block text-center text-sm font-mono text-ink">${item.quantity || 1}</div>

        <!-- Subtotal (Desktop) -->
        <div class="hidden md:block text-right font-mono font-bold text-brown text-sm">${formatRp(subtotal)}</div>

      </div>
    `;
  }).join('');
}

// ════════════════════════════════════════════════════════
//  SUMMARY UPDATE
// ════════════════════════════════════════════════════════
function updateSummary() {
  let subtotal   = 0;
  let totalItems = 0;

  checkoutItems.forEach(item => {
    subtotal   += (item.price || 0) * (item.quantity || 1);
    totalItems += item.quantity || 1;
  });

  const shipping = hasPhysicalItem ? SHIPPING_COST : 0;
  const total    = subtotal + shipping;

  const elCount    = document.getElementById('summary-item-count');
  const elSubtotal = document.getElementById('summary-subtotal');
  const elShipping = document.getElementById('summary-shipping');
  const elTotal    = document.getElementById('summary-total');
  const elMobile   = document.getElementById('mobile-total');
  const qrisTotal  = document.getElementById('qris-total');

  if (elCount)    elCount.textContent    = `(${totalItems} item)`;
  if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
  if (elShipping) elShipping.textContent = formatRp(shipping);
  if (elTotal)    elTotal.textContent    = formatRp(total);
  if (elMobile)   elMobile.textContent   = formatRp(total);
  if (qrisTotal)  qrisTotal.textContent  = formatRp(total);
}

// ════════════════════════════════════════════════════════
//  ALAMAT
// ════════════════════════════════════════════════════════
function loadSavedAddress() {
  try {
    savedAddress = JSON.parse(localStorage.getItem('zahasky_address')) || null;
  } catch { savedAddress = null; }

  renderAddressDisplay();

  // Pre-fill form jika ada data sebelumnya
  if (savedAddress) {
    const { name, phone, province, city, district, postal, detail } = savedAddress;
    if (document.getElementById('addr-name'))     document.getElementById('addr-name').value     = name     || '';
    if (document.getElementById('addr-phone'))    document.getElementById('addr-phone').value    = phone    || '';
    if (document.getElementById('addr-detail'))   document.getElementById('addr-detail').value   = detail   || '';
    if (document.getElementById('addr-postal'))   document.getElementById('addr-postal').value   = postal   || '';

    // Dropdown berjenjang perlu diisi setelah inisialisasi
    if (province && document.getElementById('addr-province')) {
      const sel = document.getElementById('addr-province');
      sel.value = province;
      onProvinceChange(city, district);
    }
  }
}

function renderAddressDisplay() {
  const display = document.getElementById('address-display');
  if (!display) return;

  if (!savedAddress) {
    display.innerHTML = `
      <div class="text-center py-4">
        <p class="text-sm text-muted">Alamat pengiriman belum ditambahkan.</p>
        <button type="button" onclick="openAddressModal()"
          class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brown underline hover:no-underline">
          + Tambah Alamat Sekarang
        </button>
      </div>
    `;
    return;
  }

  const { name, phone, province, city, district, postal, detail } = savedAddress;
  display.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 shrink-0 bg-brown/10 flex items-center justify-center mt-0.5">
        <svg class="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-sm text-ink">${name || '-'} <span class="font-normal text-muted font-mono text-xs">(${phone || '-'})</span></p>
        <p class="text-xs text-muted mt-1 leading-relaxed">
          ${detail || ''}${detail ? ', ' : ''}${district || ''}${district ? ', ' : ''}${city || ''}, ${province || ''} ${postal ? '— ' + postal : ''}
        </p>
      </div>
    </div>
  `;
}

function openAddressModal() {
  const modal = document.getElementById('modal-address');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAddressModal() {
  const modal = document.getElementById('modal-address');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function saveAddress(event) {
  event.preventDefault();

  const name     = document.getElementById('addr-name')?.value.trim()     || '';
  const phone    = document.getElementById('addr-phone')?.value.trim()    || '';
  const province = document.getElementById('addr-province')?.value        || '';
  const city     = document.getElementById('addr-city')?.value            || '';
  const district = document.getElementById('addr-district')?.value        || '';
  const postal   = document.getElementById('addr-postal')?.value          || '';
  const detail   = document.getElementById('addr-detail')?.value.trim()   || '';

  if (!name || !phone || !province || !city || !district || !detail) {
    alert('Harap lengkapi semua field alamat yang wajib diisi (*).');
    return;
  }

  savedAddress = { name, phone, province, city, district, postal, detail };
  localStorage.setItem('zahasky_address', JSON.stringify(savedAddress));

  renderAddressDisplay();
  closeAddressModal();
}

// ════════════════════════════════════════════════════════
//  CASCADING DROPDOWN — WILAYAH INDONESIA
// ════════════════════════════════════════════════════════
function initCascadingDropdown() {
  const provSel = document.getElementById('addr-province');
  if (!provSel || typeof INDONESIA_REGIONS === 'undefined') return;

  // Isi dropdown Provinsi
  const provinces = Object.keys(INDONESIA_REGIONS).sort();
  provinces.forEach(prov => {
    const opt = document.createElement('option');
    opt.value = prov;
    opt.textContent = prov;
    provSel.appendChild(opt);
  });
}

function onProvinceChange(prefillCity, prefillDistrict) {
  const province = document.getElementById('addr-province')?.value;
  const cityEl   = document.getElementById('addr-city');
  const distEl   = document.getElementById('addr-district');
  const postalEl = document.getElementById('addr-postal');

  // Reset lower dropdowns
  if (cityEl) {
    cityEl.innerHTML = '<option value="">-- Pilih Kota --</option>';
    cityEl.disabled  = true;
  }
  if (distEl) {
    distEl.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
    distEl.disabled  = true;
  }
  if (postalEl) postalEl.value = '';

  if (!province || typeof INDONESIA_REGIONS === 'undefined') return;

  const cities = Object.keys(INDONESIA_REGIONS[province] || {}).sort();
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    cityEl.appendChild(opt);
  });

  if (cityEl) cityEl.disabled = false;

  // Pre-fill jika ada data tersimpan
  if (prefillCity && cityEl) {
    cityEl.value = prefillCity;
    onCityChange(prefillDistrict);
  }
}

function onCityChange(prefillDistrict) {
  const province = document.getElementById('addr-province')?.value;
  const city     = document.getElementById('addr-city')?.value;
  const distEl   = document.getElementById('addr-district');
  const postalEl = document.getElementById('addr-postal');

  if (distEl) {
    distEl.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
    distEl.disabled  = true;
  }
  if (postalEl) postalEl.value = '';

  if (!province || !city || typeof INDONESIA_REGIONS === 'undefined') return;

  const districts = Object.keys(INDONESIA_REGIONS[province]?.[city] || {}).sort();
  districts.forEach(dist => {
    const opt = document.createElement('option');
    opt.value = dist;
    opt.textContent = dist;
    distEl.appendChild(opt);
  });

  if (distEl) distEl.disabled = false;

  // Pre-fill
  if (prefillDistrict && distEl) {
    distEl.value = prefillDistrict;
    onDistrictChange();
  }
}

function onDistrictChange() {
  const province = document.getElementById('addr-province')?.value;
  const city     = document.getElementById('addr-city')?.value;
  const district = document.getElementById('addr-district')?.value;
  const postalEl = document.getElementById('addr-postal');

  if (!province || !city || !district || typeof INDONESIA_REGIONS === 'undefined') return;

  const postal = INDONESIA_REGIONS[province]?.[city]?.[district] || '';
  if (postalEl) postalEl.value = postal;
}

// ════════════════════════════════════════════════════════
//  PAYMENT TAB & OPTION
// ════════════════════════════════════════════════════════
function switchPayTab(tabName) {
  const tabs   = ['cod', 'qris', 'ewallet', 'bank'];
  const panels = ['cod', 'qris', 'ewallet', 'bank'];

  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (panel) panel.classList.toggle('hidden', t !== tabName);
  });

  // Reset pay option selection in this tab
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));

  // COD auto-select
  if (tabName === 'cod') {
    selectedPayMethod = { type: 'COD', sub: 'Tunai' };
    const codOpt = document.querySelector('#panel-cod .pay-option');
    if (codOpt) codOpt.classList.add('selected');
    document.getElementById('pay-cod').checked = true;
  } else {
    selectedPayMethod = { type: null, sub: null };
  }
}

function selectPayOption(type, sub, el) {
  // Deselect all pay-option in all panels
  document.querySelectorAll('.pay-option').forEach(e => e.classList.remove('selected'));
  if (el) el.classList.add('selected');

  // Check the radio input inside
  const radio = el?.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  selectedPayMethod = { type, sub };

  // Show E-Wallet instruction
  const ewalletInstr = document.getElementById('ewallet-instruction');
  if (ewalletInstr) {
    if (type === 'E-Wallet') {
      ewalletInstr.classList.remove('hidden');
      document.getElementById('ewallet-name') && (document.getElementById('ewallet-name').textContent = sub);
      document.getElementById('ewallet-name-2') && (document.getElementById('ewallet-name-2').textContent = sub);
    } else {
      ewalletInstr.classList.add('hidden');
    }
  }

  // Show Bank instruction
  const bankInstr = document.getElementById('bank-instruction');
  if (bankInstr) {
    if (type === 'Transfer Bank') {
      bankInstr.classList.remove('hidden');
      document.getElementById('bank-name') && (document.getElementById('bank-name').textContent = sub);
      document.getElementById('bank-name-2') && (document.getElementById('bank-name-2').textContent = sub);
    } else {
      bankInstr.classList.add('hidden');
    }
  }
}

// ════════════════════════════════════════════════════════
//  QRIS MODAL
// ════════════════════════════════════════════════════════
function openQrisModal() {
  const modal = document.getElementById('modal-qris');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeQrisModal() {
  const modal = document.getElementById('modal-qris');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ════════════════════════════════════════════════════════
//  PLACE ORDER — Validasi & Simpan
// ════════════════════════════════════════════════════════
// checkout.js

let pollingInterval = null;

async function placeOrder() {
  if (!checkoutItems || checkoutItems.length === 0) {
    alert('Tidak ada produk untuk di-checkout.');
    return;
  }

  if (hasPhysicalItem && !savedAddress) {
    openAddressModal();
    return;
  }

  const orderId = generateOrderId();
  let subtotal = 0;
  checkoutItems.forEach(item => { subtotal += (item.price || 0) * (item.quantity || 1); });
  const shipping = hasPhysicalItem ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  const orderData = {
    order_id: orderId,
    date: new Date().toISOString(),
    items: checkoutItems,
    payment_method: selectedPayMethod.type,
    payment_sub: selectedPayMethod.sub,
    shipping_address: hasPhysicalItem ? savedAddress : null,
    subtotal,
    shipping_cost: shipping,
    total,
    status: 'PENDING',
    has_physical: hasPhysicalItem,
    has_digital: hasDigitalItem,
  };

  saveOrderToHistory(orderData);
  removeCheckedOutItemsFromCart();

  if (selectedPayMethod.type === 'COD') {
    showSuccessModal(orderData);
    return;
  }

  let customerEmail = 'customer@zahasky.com';
  const dbClient = window.supabaseClient || window.supabase;
  if (dbClient && dbClient.auth) {
    try {
      const { data: { session } } = await dbClient.auth.getSession();
      if (session?.user?.email) customerEmail = session.user.email;
    } catch (e) {}
  }

 // ── 1. E-WALLET (DANA / OVO / GOPAY / SHOPEEPAY) ──────────────────────────
  if (selectedPayMethod.type === 'E-Wallet') {
    const ewalletCode = selectedPayMethod.sub; // DANA, OVO, GOPAY, SHOPEEPAY
    
    // Tampilkan pesan konfirmasi / notifikasi pengalihan
    alert(`Pesanan #${orderId} berhasil dibuat!\n\nKamu akan dialihkan ke halaman pembayaran ${ewalletCode}. Silakan selesaikan pembayaran.`);

    try {
      const res = await fetch('/api/payment/ewallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:     orderId,
          amount:      total,
          ewalletType: ewalletCode,
          phone:       savedAddress?.phone || '081234567890'
        })
      });

      const result = await res.json();
      
      if (res.ok && result.success && result.checkoutUrl) {
        // Alihkan pengguna ke URL E-Wallet resmi dari backend
        window.location.href = result.checkoutUrl;
      } else {
        // Jika backend error (500), tampilkan notifikasi pesan error asli dari backend
        alert('Gagal memproses E-Wallet: ' + (result.message || 'Terjadi kesalahan pada server backend.'));
      }
    } catch (err) {
      console.error('E-Wallet Fetch Error:', err);
      alert('Gagal terhubung ke server backend.');
    }
    return;
  }

  // ── 2. TRANSFER BANK (BCA, BNI, BRI, MANDIRI, PERMATA, BSI, BJB, CIMB, SAMPOERNA) ──
  if (selectedPayMethod.type === 'Transfer Bank') {
    const bankCode = selectedPayMethod.sub; // BCA, BNI, MANDIRI, BRI, dll
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:       orderId,
          amount:        total,
          customerEmail: customerEmail,
          customerName:  savedAddress?.name || 'Customer Zahasky',
          items:         checkoutItems,
          description:   `Pembayaran Pesanan Zahasky (#${orderId})`,
          bankCode:      bankCode
        })
      });

      const result = await res.json();
      if (result.success && result.invoiceUrl) {
        window.location.href = result.invoiceUrl; // Direct ke Halaman VA Bank
      } else {
        alert('Gagal membuat Invoice Bank: ' + (result.message || 'URL tidak tersedia'));
      }
    } catch (err) {
      alert('Kesalahan koneksi Bank API.');
    }
    return;
  }

  // ── TRANSFER BANK: Semua Bank via Xendit Invoice (filter ke 1 bank) ────────
  // Gunakan Xendit Invoice API dengan payment_methods = ['BNI'] / ['BCA'] dll
  // Xendit akan pre-filter halaman invoice hanya menampilkan bank yang dipilih
  if (selectedPayMethod.type === 'Transfer Bank') {
    const bankCode = selectedPayMethod.sub; // 'BCA', 'BNI', 'MANDIRI', dll
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:       orderId,
          amount:        total,
          customerEmail: customerEmail,
          customerName:  savedAddress?.name || 'Customer Zahasky',
          items:         checkoutItems,
          description:   `Pembayaran Pesanan Zahasky (#${orderId})`,
          bankCode:      bankCode  // kirim bank code ke backend
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert('Gagal membuat transaksi: ' + (errData.message || 'Server error. Pastikan node app.js running!'));
        return;
      }

      const result = await res.json();

      if (result.success && result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      } else {
        alert('Gagal mendapatkan Link Pembayaran Xendit: ' + (result.message || 'URL tidak tersedia'));
      }
    } catch (err) {
      console.error('Bank Transfer Error:', err);
      alert('Terjadi kesalahan koneksi saat memproses pembayaran.');
    }
    return;
  }

  // ── QRIS ──────────────────────────────────────────────────────────────────
  if (selectedPayMethod.type === 'QRIS') {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:       orderId,
          amount:        total,
          customerEmail: customerEmail,
          customerName:  savedAddress?.name || 'Customer Zahasky',
          items:         checkoutItems,
          description:   `Pembayaran Pesanan Zahasky (#${orderId})`,
          bankCode:      'QRIS'
        })
      });

      const result = await res.json();

      if (result.success && result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      } else {
        alert('Gagal mendapatkan Link Pembayaran Xendit: ' + (result.message || 'URL tidak tersedia'));
      }
    } catch (err) {
      console.error('QRIS Error:', err);
      alert('Terjadi kesalahan koneksi saat memproses pembayaran.');
    }
    return;
  }
}

/**
 * FUNGSI POLLING AUTOMATIC WEBHOOK/PAYMENT STATUS
 */
function startPaymentPolling(orderId) {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/payment/status/${orderId}`);
      if (!res.ok) return; // server belum 200 OK, biarkan polling terus
      const data = await res.json();

      if (data.status === 'PAID' || data.status === 'SUCCEEDED' || data.status === 'SETTLED') {
        clearInterval(pollingInterval); // Hentikan polling

        // Update status di localStorage
        updateOrderStatusInHistory(orderId, 'PAID', data.driveLink);

        // Tutup modal QRIS / VA dan tampilkan modal Sukses!
        closeQrisModal();
        closeVAModal();
        
        const currentOrder = getOrderFromHistory(orderId);
        showSuccessModal(currentOrder || { order_id: orderId, total: 0, items: [] });
      }
    } catch (e) {
      console.warn('Polling error:', e);
    }
  }, 3000); // Cek setiap 3 detik
}

function openVAModal() {
  const modal = document.getElementById('modal-va');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeVAModal() {
  const modal = document.getElementById('modal-va');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function updateOrderStatusInHistory(orderId, status, driveLink) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('zahasky_order_history')) || []; } catch { history = []; }
  const idx = history.findIndex(o => o.order_id === orderId);
  if (idx > -1) {
    history[idx].status = status;
    if (driveLink && history[idx].items) {
      history[idx].items.forEach(item => {
        item.drive_link = driveLink;
        item.x_digital_file_url = driveLink;
      });
    }
    localStorage.setItem('zahasky_order_history', JSON.stringify(history));
  }
}

function getOrderFromHistory(orderId) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('zahasky_order_history')) || []; } catch { history = []; }
  return history.find(o => o.order_id === orderId) || null;
}


function copyVAToClipboard() {
  const vaNum = document.getElementById('va-number')?.textContent;
  if (vaNum) {
    navigator.clipboard.writeText(vaNum);
    alert('Nomor Virtual Account berhasil disalin!');
  }
}

function showAddressAlert(msg) {
  const form = document.getElementById('address-form');
  if (!form) return;
  let alert = form.querySelector('.addr-alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.className = 'addr-alert mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium';
    form.prepend(alert);
  }
  alert.textContent = msg;
  setTimeout(() => alert?.remove(), 4000);
}

// ════════════════════════════════════════════════════════
//  SIMPAN ORDER KE HISTORY
// ════════════════════════════════════════════════════════
function saveOrderToHistory(orderData) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('zahasky_order_history')) || [];
  } catch { history = []; }

  // Tambahkan di depan (terbaru duluan)
  history.unshift(orderData);
  localStorage.setItem('zahasky_order_history', JSON.stringify(history));
}

// ════════════════════════════════════════════════════════
//  HAPUS ITEM DARI CART
// ════════════════════════════════════════════════════════
function removeCheckedOutItemsFromCart() {
  const checkedOutIds = new Set(checkoutItems.map(item => item.id));
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('zahasky_cart')) || []; } catch { cart = []; }

  cart = cart.filter(cartItem => !checkedOutIds.has(cartItem.id));
  localStorage.setItem('zahasky_cart', JSON.stringify(cart));

  // Update badge
  if (typeof updateCartBadge === 'function') updateCartBadge();
}

// ════════════════════════════════════════════════════════
//  MODAL SUKSES
// ════════════════════════════════════════════════════════
function showSuccessModal(orderData) {
  const modal     = document.getElementById('modal-success');
  const orderId   = document.getElementById('success-order-id');
  const summary   = document.getElementById('success-summary');
  const infoBox   = document.getElementById('success-info');

  if (!modal) return;

  if (orderId) orderId.textContent = orderData.order_id;

  // Ringkasan singkat: max 3 item
  if (summary) {
    const itemsToShow = orderData.items.slice(0, 3);
    summary.innerHTML = `
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Produk yang Dipesan</p>
      ${itemsToShow.map(item => `
        <div class="flex items-center gap-3 py-1.5 border-b border-brown/10 last:border-0">
          <img src="${item.image_url || ''}" alt="${item.name}"
               class="w-10 h-10 object-cover border border-brown/10 rounded-sm shrink-0"
               onerror="this.src='https://via.placeholder.com/40?text=?'" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-brown leading-snug truncate">${item.name}</p>
            <p class="text-[10px] text-muted mt-0.5">${item.quantity}× ${formatRp(item.price)}</p>
          </div>
        </div>
      `).join('')}
      ${orderData.items.length > 3 ? `<p class="text-[10px] text-muted mt-1.5 text-center">... dan ${orderData.items.length - 3} produk lainnya</p>` : ''}
      <div class="flex justify-between pt-3 text-sm">
        <span class="text-muted">Total Pembayaran</span>
        <span class="font-mono font-bold text-brown">${formatRp(orderData.total)}</span>
      </div>
      <div class="flex justify-between text-xs text-muted">
        <span>Via</span>
        <span class="font-semibold">${orderData.payment_method}${orderData.payment_sub !== orderData.payment_method ? ' — ' + orderData.payment_sub : ''}</span>
      </div>
    `;
  }

  // Info tambahan: digital vs fisik
  if (infoBox) {
    if (orderData.has_digital && !orderData.has_physical) {
      infoBox.innerHTML = `
        <div class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-left space-y-1">
          <p class="font-semibold text-blue-700 text-xs flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></svg>
            Produk Digital
          </p>
          <p class="text-xs text-blue-600">Link Google Drive akan tersedia di tab <strong>"Riwayat Pesanan"</strong> pada halaman Profil setelah pembayaran dikonfirmasi.</p>
          <p class="text-xs text-blue-600">Cek juga email kamu untuk instruksi pengiriman.</p>
        </div>
      `;
    } else if (orderData.has_physical) {
      infoBox.innerHTML = `
        <div class="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-left space-y-1">
          <p class="font-semibold text-amber-700 text-xs flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
            Pengiriman Fisik
          </p>
          <p class="text-xs text-amber-700">Pesanan akan dikirim ke alamat yang tertera. Pantau status pengiriman di <strong>Riwayat Pesanan</strong>.</p>
        </div>
      `;
    }
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ════════════════════════════════════════════════════════
//  CLOSE MODAL SAAT KLIK OVERLAY
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Tutup modal alamat & QRIS saat klik overlay (bukan modal box)
  ['modal-address', 'modal-qris'].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  });

  // Modal sukses: hanya bisa ditutup lewat tombol
});

// ════════════════════════════════════════════════════════
//  HELPER: getTypeLabel
// ════════════════════════════════════════════════════════
function getTypeLabel(item) {
  const t = (item.page_type || item.type || item.category || '').toLowerCase();
  if (t.includes('publicity')) return 'Publicity';
  if (t.includes('package'))   return 'Package';
  return 'Catalog';
}
