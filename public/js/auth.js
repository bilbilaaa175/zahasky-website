/**
 * auth.js
 * -----------------------------------------------------------------------
 * Logika gabungan untuk Register dan Login Supabase Auth.
 * -----------------------------------------------------------------------
 */

// Menyesuaikan instance client Supabase (mendukung window.supabaseClient atau window.supabase)
const dbClient = window.supabaseClient || window.supabase;

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
    // Hentikan reload/redirect browser secara mutlak
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

    if (!dbClient || !dbClient.auth) {
      console.error("Supabase client belum siap!");
      showMessage(messageBox, "error", "Gagal terhubung ke server database.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {
      console.log("Mengirim data registrasi ke Supabase...", { email, fullName, whatsapp });

      const { data, error } = await dbClient.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'http://127.0.0.1:5500/public/login.html',
          data: { 
            full_name: fullName, 
            whatsapp: whatsapp 
          },
        },
      });

      console.log("Hasil Response Supabase:", { data, error });

      if (error) throw error;

      if (data?.user) {
        // Cek apakah Confirm Email aktif (data.session = null) atau matikan (data.session tersedia)
        if (data.session) {
          showMessage(
            messageBox,
            "success",
            "Pendaftaran berhasil! Mengalihkan ke halaman login..."
          );
          form.reset();

          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        } else {
          showMessage(
            messageBox,
            "success",
            "Pendaftaran berhasil! Silakan cek email kamu untuk verifikasi sebelum login."
          );
          form.reset();
        }
      }
    } catch (err) {
      console.error("Pendaftaran Gagal:", err);
      showMessage(
        messageBox,
        "error",
        err.message || "Terjadi kesalahan saat mendaftar."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Daftar";
    }
  });
}

// =========================================================================
// 2. LOGIKA LOGIN (Halaman Login)
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

    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    try {
      if (!dbClient || !dbClient.auth) {
        throw new Error("Koneksi Supabase belum terkonfigurasi di supabaseClient.js.");
      }

      const { data, error } = await dbClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showMessage(messageBox, "success", "Login berhasil! Mengalihkan...");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);

    } catch (err) {
      console.error("Login Error:", err);
      showMessage(
        messageBox,
        "error",
        err.message || "Email atau password salah."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Masuk";
    }
  });
}