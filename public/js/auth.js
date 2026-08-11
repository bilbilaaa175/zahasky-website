/**
 * auth.js
 * -----------------------------------------------------------------------
 * Logika gabungan untuk Register, Login, manajemen profile, dan Riwayat Pesanan.
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
// 3. LOGIKA HALAMAN PROFIL, TAB NAVIGATION, RIWAYAT PESANAN & LOGOUT
// =========================================================================
const profileForm = document.getElementById("profile-form");

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logout-btn");
  const dbClient = getDbClient();

  // --- LOGOUT LOGIC ---
  if (logoutBtn && dbClient) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await dbClient.auth.signOut();
      } catch (err) {
        console.error("Error signing out:", err);
      } finally {
        localStorage.clear();
        window.location.href = "index.html";
      }
    });
  }

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

  if (emailInput) emailInput.value = user.email || "";

  // --- B. LOAD DATA PROFIL ---
  async function loadUserProfile() {
    const metaFullName = metaData.full_name || metaData.fullname || "";
    const metaWhatsapp = metaData.whatsapp || "";

    if (greetingEl && metaFullName) {
      greetingEl.textContent = `Halo, ${metaFullName}`;
    }
    if (fullNameInput && metaFullName) fullNameInput.value = metaFullName;
    if (whatsappInput && metaWhatsapp) whatsappInput.value = metaWhatsapp;

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

  // --- C. LOAD RIWAYAT PESANAN (FUNGSI BARU) ---
  async function loadUserOrderHistory(userId) {
    const emptyState = document.getElementById("empty-orders-state");
    const listContainer = document.getElementById("orders-list-container");
    const badgeCounter = document.getElementById("orders-count-badge");

    if (!listContainer || !emptyState) return;

    try {
      const { data: orders, error } = await dbClient
        .from("orders")
        .select("*, order_items(*, products(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !orders || orders.length === 0) {
        emptyState.classList.remove("hidden");
        listContainer.classList.add("hidden");
        if (badgeCounter) badgeCounter.textContent = "(0)";
        return;
      }

      emptyState.classList.add("hidden");
      listContainer.classList.remove("hidden");
      if (badgeCounter) badgeCounter.textContent = `(${orders.length})`;

      listContainer.innerHTML = orders.map(order => `
        <div class="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-ink">ID: #${order.id ? order.id.toString().slice(0, 8) : '-'}</span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-500">${order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
            </div>
            <span class="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              order.status === 'success' || order.status === 'completed' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }">
              ${order.status === 'success' || order.status === 'completed' ? 'Selesai' : 'Diproses'}
            </span>
          </div>

          <div class="space-y-3">
            ${(order.order_items || []).map(item => `
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <img src="${item.products?.image_url || 'https://via.placeholder.com/80'}" alt="${item.products?.title || 'Produk Digital'}" class="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div>
                    <h4 class="font-serif font-bold text-sm text-ink">${item.products?.title || 'File Desain Digital'}</h4>
                    <p class="text-[11px] font-mono text-gray-400">Format: SKP, DWG, PDF</p>
                  </div>
                </div>
                
                ${item.products?.download_url ? `
                  <a href="${item.products.download_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brown hover:underline shrink-0">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span>Unduh File</span>
                  </a>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span class="text-gray-500 font-medium">Total Pembayaran</span>
            <span class="font-serif font-bold text-brown text-sm">Rp ${(order.total_amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.warn("Gagal membaca riwayat pesanan:", err.message);
    }
  }

  // Panggil pemuatan data profil & riwayat pesanan secara paralel
  await loadUserProfile();
  await loadUserOrderHistory(user.id);

  // --- D. TAB NAVIGATION LOGIC ---
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

  tabBtnInfo?.addEventListener("click", () => switchTab(tabBtnInfo, tabContentInfo));
  tabBtnSecurity?.addEventListener("click", () => switchTab(tabBtnSecurity, tabContentSecurity));
  tabBtnOrders?.addEventListener("click", () => switchTab(tabBtnOrders, tabContentOrders));

  // --- E. HANDLE UPDATE DATA PROFIL ---
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
      showMessage(messageBox, "success", "Profil berhasil diperbarui!");
    } catch (err) {
      showMessage(messageBox, "error", "Gagal memperbarui profil: " + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Simpan Perubahan";
      }
    }
  });

  // --- F. HANDLE UPDATE PASSWORD ---
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