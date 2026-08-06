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

  tabBtnInfo?.addEventListener("click", () => switchTab(tabBtnInfo, tabContentInfo));
  tabBtnSecurity?.addEventListener("click", () => switchTab(tabBtnSecurity, tabContentSecurity));
  tabBtnOrders?.addEventListener("click", () => switchTab(tabBtnOrders, tabContentOrders));

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