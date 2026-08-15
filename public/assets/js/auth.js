/**
 * auth.js
 * -----------------------------------------------------------------------
 * Logika gabungan untuk Register, Login, dan manajemen profile.
 * -----------------------------------------------------------------------
 */

// Helper untuk mengambil instance Supabase Client secara dinamis
function getDbClient() {
  return window.supabaseClient || window.supabase;
}

// Helper untuk menampilkan pesan error / sukses
function showMessage(box, type, text) {
  if (!box) return;
  box.textContent = text;
  box.classList.remove("hidden", "text-red-600", "text-green-700");
  box.classList.add(type === "error" ? "text-red-600" : "text-green-700");
}

// =========================================================================
// 1. LOGIKA REGISTER
// =========================================================================
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    const submitBtn = form.querySelector("button[type='submit']");
    const messageBox = document.getElementById("form-message");

    const fullName = document.getElementById("fullname")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const whatsapp = document.getElementById("whatsapp")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (messageBox) {
      messageBox.classList.add("hidden");
      messageBox.textContent = "";
    }

    const dbClient = getDbClient();
    if (!dbClient || !dbClient.auth) {
      showMessage(messageBox, "error", "Gagal terhubung ke server database.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {
      // Menggunakan origin browser secara dinamis agar sesuai dengan server lokal (Live Server)
      const redirectUrl = `${window.location.origin}/public/login.html`;

      const { data, error } = await dbClient.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { 
            full_name: fullName, 
            whatsapp: whatsapp 
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        if (data.session) {
          showMessage(messageBox, "success", "Pendaftaran berhasil! Mengalihkan ke halaman login...");
          form.reset();
          setTimeout(() => { 
            window.location.href = "login.html"; 
          }, 1500);
        } else {
          showMessage(messageBox, "success", "Pendaftaran berhasil! Silakan cek email kamu untuk verifikasi sebelum login.");
          form.reset();
        }
      }
    } catch (err) {
      console.error("Pendaftaran Gagal:", err);
      showMessage(messageBox, "error", err.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Daftar";
    }
  });
}

// =========================================================================
// 2. LOGIKA LOGIN
// =========================================================================
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector("button[type='submit']");
    const messageBox = document.getElementById("form-message");

    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (messageBox) {
      messageBox.classList.add("hidden");
      messageBox.textContent = "";
    }

    if (!email || !password) {
      showMessage(messageBox, "error", "Email dan password harus diisi.");
      return;
    }

    const dbClient = getDbClient();
    if (!dbClient || !dbClient.auth) {
      showMessage(messageBox, "error", "Koneksi Supabase belum terkonfigurasi di supabaseClient.js.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {
      const { data, error } = await dbClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showMessage(messageBox, "success", "Login berhasil! Mengalihkan ke beranda...");
      setTimeout(() => { 
        // Mengalihkan ke index.html setelah login
        window.location.href = "index.html"; 
      }, 1000);

    } catch (err) {
      console.error("Login Error:", err);
      showMessage(messageBox, "error", err.message || "Email atau password salah.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Masuk";
    }
  });
}

// =========================================================================
// 3. LOGIKA HALAMAN PROFIL, TAB NAVIGATION & LOGOUT
// =========================================================================
const profileForm = document.getElementById("profile-form");

// Jalankan logika profil & logout setiap kali halaman profil dimuat
document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logout-btn");
  const dbClient = getDbClient();

  // --- LOGOUT LOGIC (Dipasang di luar guard agar selalu aktif jika tombolnya ada) ---
  if (logoutBtn && dbClient) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await dbClient.auth.signOut();
      } catch (err) {
        console.error("Error signing out:", err);
      } finally {
        // Hapus token lokal secara manual untuk memastikan bersih sempurna
        localStorage.clear();
        window.location.href = "index.html";
      }
    });
  }

  // Jika tidak ada profile-form di halaman ini (bukan profile.html), berhentikan eksekusi
  if (!profileForm) return;

  const greetingEl = document.getElementById("user-greeting");
  const fullNameInput = document.getElementById("full-name-input");
  const whatsappInput = document.getElementById("whatsapp-input");
  const emailInput = document.getElementById("email-input");
  const saveBtn = document.getElementById("save-btn");
  const passwordForm = document.getElementById("password-form");
  const messageBox = document.getElementById("profile-message");

  if (!dbClient || !dbClient.auth) return;

  // --- A. PROTEKSI & CEK SESI LOGIN ---
  const { data: { session }, error: sessionError } = await dbClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;
  const metaData = user.user_metadata || {};

  // Tampilkan Email langsung dari sesi
  if (emailInput) emailInput.value = user.email || "";

  // --- B. LOAD DATA PROFIL (METADATA FIRST + DATABASE SYNC) ---
  async function loadUserProfile() {
    // 1. Ambil data cadangan dari user_metadata saat registrasi
    const metaFullName = metaData.full_name || metaData.fullname || "";
    const metaWhatsapp = metaData.whatsapp || "";

    // Set tampilan awal dari metadata dulu agar tidak terlambat/tampil "Pengguna"
    if (greetingEl && metaFullName) {
      greetingEl.textContent = `Halo, ${metaFullName}`;
    }
    if (fullNameInput && metaFullName) fullNameInput.value = metaFullName;
    if (whatsappInput && metaWhatsapp) whatsappInput.value = metaWhatsapp;

    // 2. Ambil data terbaru dari Database Supabase (tabel profiles)
    try {
      const { data: dbProfile, error } = await dbClient
        .from("profiles")
        .select("full_name, whatsapp")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && dbProfile) {
        const finalName = dbProfile.full_name || metaFullName;
        const finalWa = dbProfile.whatsapp || metaWhatsapp;

        if (greetingEl) greetingEl.textContent = `Halo, ${finalName || 'Pengguna'}`;
        if (fullNameInput) fullNameInput.value = finalName;
        if (whatsappInput) whatsappInput.value = finalWa;
      } else if (!dbProfile && metaFullName) {
        // Jika tabel profiles masih kosong, buatkan record barunya
        await dbClient.from("profiles").upsert({
          id: user.id,
          full_name: metaFullName,
          whatsapp: metaWhatsapp,
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Gagal membaca tabel profiles:", err.message);
    }
  }

  await loadUserProfile();

  // --- C. TAB NAVIGATION LOGIC ---
  const tabBtnInfo = document.getElementById("tab-btn-info");
  const tabBtnSecurity = document.getElementById("tab-btn-security");
  const tabBtnOrders = document.getElementById("tab-btn-orders");

  const tabContentInfo = document.getElementById("tab-content-info");
  const tabContentSecurity = document.getElementById("tab-content-security");
  const tabContentOrders = document.getElementById("tab-content-orders");

  function switchTab(activeBtn, activeContent) {
    [tabBtnInfo, tabBtnSecurity, tabBtnOrders].forEach(btn => btn?.classList.remove("tab-btn-active"));
    [tabContentInfo, tabContentSecurity, tabContentOrders].forEach(content => {
      if (content) {
        content.classList.add("hidden");
        content.classList.remove("block");
      }
    });

    activeBtn?.classList.add("tab-btn-active");
    activeContent?.classList.remove("hidden");
    activeContent?.classList.add("block");
  }

  tabBtnInfo?.addEventListener('click', () => switchTab(tabBtnInfo, tabContentInfo));
  tabBtnSecurity?.addEventListener('click', () => switchTab(tabBtnSecurity, tabContentSecurity));
  tabBtnOrders?.addEventListener('click', () => {
    switchTab(tabBtnOrders, tabContentOrders);
    renderOrderHistory();
  });

  // Auto-switch ke tab orders jika dari URL param
  const pageParams = new URLSearchParams(window.location.search);
  if (pageParams.get('tab') === 'orders') {
    switchTab(tabBtnOrders, tabContentOrders);

    // Jika kembali dari Xendit dengan status=success, update order status menjadi CONFIRMED
    if (pageParams.get('status') === 'success') {
      try {
        let history = JSON.parse(localStorage.getItem('zahasky_order_history')) || [];
        if (history.length > 0) {
          history[0].status = 'CONFIRMED';
          localStorage.setItem('zahasky_order_history', JSON.stringify(history));
        }
      } catch (e) { console.error('Status update error:', e); }
    }

    renderOrderHistory();
  }

  // Render order count badge
  renderOrderHistory(true); // only update badge


  // --- D. HANDLE UPDATE DATA PROFIL ---
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Menyimpan...";
    }

    const updatedFullName = fullNameInput?.value.trim() || "";
    const updatedWhatsapp = whatsappInput?.value.trim() || "";

    try {
      const { error } = await dbClient
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: updatedFullName,
          whatsapp: updatedWhatsapp,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      if (greetingEl) greetingEl.textContent = `Halo, ${updatedFullName}`;
    } catch (err) {
      showMessage(messageBox, "error", "Gagal memperbarui profil: " + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Simpan Perubahan";
      }
    }
  });

  // --- E. HANDLE UPDATE PASSWORD ---
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newPassword = document.getElementById("new-password")?.value || "";
      const confirmPassword = document.getElementById("confirm-password")?.value || "";

      if (newPassword !== confirmPassword) {
        showMessage(messageBox, "error", "Konfirmasi password tidak cocok!");
        return;
      }

      try {
        const { error } = await dbClient.auth.updateUser({ password: newPassword });
        if (error) throw error;

        passwordForm.reset();
        showMessage(messageBox, "success", "Password berhasil diperbarui!");
      } catch (err) {
        showMessage(messageBox, "error", "Gagal mengganti password: " + err.message);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// RENDER ORDER HISTORY — Riwayat Pesanan di Profil
// ═══════════════════════════════════════════════════════════════════════

/**
 * @param {boolean} badgeOnly - Jika true, hanya update badge hitungan, tidak render kartu
 */
function renderOrderHistory(badgeOnly = false) {
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zahasky_order_history')) || [];
  } catch { orders = []; }

  // Update badge di tab button
  const badge = document.getElementById('orders-count-badge');
  if (badge) badge.textContent = `(${orders.length})`;

  if (badgeOnly) return;

  const emptyState = document.getElementById('empty-orders-state');
  const listContainer = document.getElementById('orders-list-container');

  if (!listContainer) return;

  if (orders.length === 0) {
    if (emptyState) { emptyState.classList.remove('hidden'); }
    listContainer.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  listContainer.classList.remove('hidden');

  listContainer.innerHTML = orders.map((order, idx) => {
    const date    = new Date(order.date);
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const statusLabel = getOrderStatusLabel(order.status);
    const statusColor = getOrderStatusColor(order.status);
    const hasPhysical = order.has_physical;
    const hasDigital  = order.has_digital;

    // Item preview (max 2 thumbnail)
    const previewImgs = order.items.slice(0, 3).map(item =>
      `<img src="${item.image_url || ''}" alt="${item.name}"
            class="w-10 h-10 object-cover border border-brown/10 rounded-sm"
            onerror="this.src='https://via.placeholder.com/40?text=?'" />`
    ).join('');

    return `
      <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">

        <!-- ── CARD HEADER (Selalu Tampil) ── -->
        <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
             onclick="toggleOrderCard('order-detail-${idx}', 'order-chevron-${idx}')">
          
          <!-- Thumbnails -->
          <div class="flex items-center gap-1.5 shrink-0">
            ${previewImgs}
            ${order.items.length > 3 ? `<span class="text-[10px] text-muted font-semibold ml-1">+${order.items.length - 3}</span>` : ''}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-0.5">
              <span class="text-xs font-mono font-bold text-brown">${order.order_id}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor}">${statusLabel}</span>
              ${hasPhysical ? '<span class="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Fisik</span>' : ''}
              ${hasDigital ? '<span class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Digital</span>' : ''}
            </div>
            <p class="text-xs text-muted">${dateStr} · ${order.payment_method}${order.payment_sub && order.payment_sub !== order.payment_method ? ' (' + order.payment_sub + ')' : ''}</p>
            <p class="text-xs text-muted mt-0.5">${order.items.length} produk · <span class="font-mono font-bold text-brown">${formatRpStatic(order.total)}</span></p>
          </div>

          <!-- Chevron -->
          <svg id="order-chevron-${idx}" class="w-5 h-5 text-muted shrink-0 transition-transform duration-200"
               fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </div>

        <!-- ── CARD DETAIL (Toggle) ── -->
        <div id="order-detail-${idx}" class="hidden border-t border-gray-100">
          <div class="px-5 py-4 space-y-4">

            <!-- Daftar Item -->
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Produk yang Dipesan</p>
              <div class="space-y-3">
                ${order.items.map(item => renderOrderItemCard(item, order.status)).join('')}
              </div>
            </div>

            ${hasPhysical && order.shipping_address ? renderShippingAddressBlock(order.shipping_address) : ''}

            ${hasPhysical ? renderDeliveryTimeline(order.status) : ''}

            <!-- Ringkasan Biaya -->
            <div class="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div class="flex justify-between text-muted text-xs">
                <span>Subtotal Produk</span>
                <span class="font-mono">${formatRpStatic(order.subtotal)}</span>
              </div>
              ${order.shipping_cost > 0 ? `
              <div class="flex justify-between text-muted text-xs">
                <span>Ongkos Kirim</span>
                <span class="font-mono">${formatRpStatic(order.shipping_cost)}</span>
              </div>` : ''}
              <div class="flex justify-between font-semibold text-sm pt-1 border-t border-gray-100">
                <span>Total Pembayaran</span>
                <span class="font-mono text-brown font-bold">${formatRpStatic(order.total)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;
  }).join('');
}

/** Render satu baris item dalam order detail */
/**
 * Render kartu item produk di Riwayat Pesanan
 */
function renderOrderItemCard(item, orderStatus) {
  const isDigital = !['publicity'].includes((item.page_type || '').toLowerCase());
  
  // Link drive bisa dari item langsung atau dari data Odoo
  let driveLink = item.x_digital_file_url || item.drive_link || item.x_drive_link || null;
  
  // Cek apakah pembayaran sudah LUNAS
  const isPaid = ['PAID', 'SUCCEEDED', 'SETTLED', 'CONFIRMED', 'COMPLETED', 'SALE', 'DONE'].includes((orderStatus || '').toUpperCase());

  // Auto-fetch link Google Drive dari Odoo via API jika belum tersimpan di item lokal
  if (isDigital && isPaid && !driveLink && item.id) {
    fetch(`/api/products/${item.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product && data.product.x_digital_file_url) {
          item.x_digital_file_url = data.product.x_digital_file_url;
          item.drive_link = data.product.x_digital_file_url;
          
          // Update localStorage
          try {
            let history = JSON.parse(localStorage.getItem('zahasky_order_history')) || [];
            localStorage.setItem('zahasky_order_history', JSON.stringify(history));
          } catch(e) {}

          // Render ulang UI agar tombol langsung muncul
          renderOrderHistory();
        }
      })
      .catch(err => console.warn('Gagal mengambil link digital Odoo:', err));
  }

  return `
    <div class="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      <img src="${item.image_url || ''}" alt="${item.name}"
           class="w-14 h-14 object-cover border border-brown/10 rounded-sm shrink-0"
           onerror="this.src='https://via.placeholder.com/56?text=?'" />
      <div class="flex-1 min-w-0">
        <p class="font-serif font-semibold text-brown text-sm leading-snug truncate">${item.name || '-'}</p>
        
        <div class="flex flex-wrap gap-1 mt-2">
          <span class="text-[10px] px-1.5 py-0.5 bg-brown/10 text-brown font-mono font-semibold rounded uppercase">${item.file_format || 'ZIP'}</span>
          <span class="text-[10px] px-1.5 py-0.5 ${isDigital ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'} font-semibold rounded">${isDigital ? 'Digital' : 'Fisik'}</span>
        </div>
        <p class="text-xs text-muted mt-1">${item.quantity || 1}× ${formatRpStatic(item.price)}</p>

        <!-- KONDISI LINK DIGITAL GOOGLE DRIVE -->
        ${isDigital ? `
          ${isPaid && driveLink ? `
            <a href="${driveLink}" target="_blank" rel="noopener noreferrer"
               class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
              </svg>
              <span>Buka Link Google Drive</span>
            </a>
          ` : `
            <div class="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg p-2.5">
              <svg class="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
              </svg>
              <span>Link Drive akan tersedia secara otomatis setelah pembayaran dikonfirmasi.</span>
            </div>
          `}
        ` : ''}
      </div>
    </div>
  `;
}

/** Render blok alamat pengiriman */
function renderShippingAddressBlock(addr) {
  if (!addr) return '';
  return `
    <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
      <p class="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
        </svg>
        Alamat Pengiriman
      </p>
      <p class="text-xs text-amber-800 font-semibold">${addr.name || '-'} <span class="font-normal font-mono">(${addr.phone || '-'})</span></p>
      <p class="text-xs text-amber-700 mt-0.5 leading-relaxed">
        ${addr.detail || ''}${addr.detail ? ', ' : ''}${addr.district || ''}${addr.district ? ', ' : ''}${addr.city || ''}, ${addr.province || ''} ${addr.postal ? addr.postal : ''}
      </p>
    </div>
  `;
}

/** Render timeline status pengiriman (untuk produk Publicity) */
function renderDeliveryTimeline(status) {
  const steps = [
    { key: 'processing', label: 'Pesanan Diterima',  icon: '📋', desc: 'Pesanan kamu sedang diverifikasi oleh tim Zahasky.' },
    { key: 'confirmed',  label: 'Pesanan Dikonfirmasi', icon: '✅', desc: 'Pembayaran terkonfirmasi, pesanan sedang dipersiapkan.' },
    { key: 'shipped',    label: 'Dalam Pengiriman',  icon: '🚚', desc: 'Paket sedang dalam perjalanan menuju alamatmu.' },
    { key: 'delivered',  label: 'Pesanan Selesai',   icon: '🎉', desc: 'Paket telah diterima. Terima kasih sudah berbelanja!' },
  ];

  const statusOrder = ['processing', 'confirmed', 'shipped', 'delivered'];
  const currentIdx  = statusOrder.indexOf((status || '').toLowerCase());

  return `
    <div class="border-t border-gray-100 pt-4">
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-4">Status Pengiriman</p>
      <div class="space-y-3">
        ${steps.map((step, i) => {
          const isDone    = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return `
            <div class="flex items-start gap-3">
              <div class="shrink-0 flex flex-col items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-base ${isDone ? 'bg-brown text-cream' : 'bg-gray-100 text-gray-400'}">
                  ${step.icon}
                </div>
                ${i < steps.length - 1 ? `<div class="w-0.5 h-6 mt-1 ${isDone ? 'bg-brown' : 'bg-gray-200'}"></div>` : ''}
              </div>
              <div class="pt-1">
                <p class="text-xs font-semibold ${isDone ? 'text-brown' : 'text-gray-400'}">${step.label} ${isCurrent ? '<span class="ml-1 text-[10px] px-1.5 py-0.5 bg-brown text-cream rounded-full font-semibold">Sekarang</span>' : ''}</p>
                ${isDone ? `<p class="text-[10px] text-muted mt-0.5">${step.desc}</p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/** Toggle accordion order card */
function toggleOrderCard(detailId, chevronId) {
  const detail  = document.getElementById(detailId);
  const chevron = document.getElementById(chevronId);
  if (!detail) return;

  const isOpen = !detail.classList.contains('hidden');
  detail.classList.toggle('hidden', isOpen);
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

/** Format rupiah tanpa butuh global function */
function formatRpStatic(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

/** Label & warna status order */
function getOrderStatusLabel(status) {
  const s = (status || '').toLowerCase();
  const map = {
    'processing': 'Diproses',
    'pending':    'Diproses',
    'confirmed':  'Dikonfirmasi',
    'paid':       'Dikonfirmasi',
    'sale':       'Dikonfirmasi',
    'shipped':    'Dikirim',
    'delivered':  'Selesai',
    'completed':  'Selesai',
    'done':       'Selesai',
    'cancelled':  'Dibatalkan',
  };
  return map[s] || 'Dikonfirmasi';
}

function getOrderStatusColor(status) {
  const s = (status || '').toLowerCase();
  const map = {
    'processing': 'bg-yellow-100 text-yellow-700',
    'pending':    'bg-yellow-100 text-yellow-700',
    'confirmed':  'bg-blue-100 text-blue-700',
    'paid':       'bg-green-100 text-green-700',
    'sale':       'bg-green-100 text-green-700',
    'shipped':    'bg-purple-100 text-purple-700',
    'delivered':  'bg-green-100 text-green-700',
    'completed':  'bg-green-100 text-green-700',
    'done':       'bg-green-100 text-green-700',
    'cancelled':  'bg-red-100 text-red-700',
  };
  return map[s] || 'bg-blue-100 text-blue-700';
}
