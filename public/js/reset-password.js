document.addEventListener('DOMContentLoaded', () => {
  const resetForm = document.getElementById('reset-password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');

  // Toggle Password Visibilities
  setupTogglePassword('toggle-new-password', 'new-password');
  setupTogglePassword('toggle-confirm-password', 'confirm-password');

  if (!resetForm) return;

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    hideMessage();

    // Validasi input
    if (!newPassword || !confirmPassword) {
      showMessage('Silakan isi kedua kolom password.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password minimal harus 6 karakter.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    // Loading State
    submitBtn.disabled = true;
    submitBtn.innerText = 'Menyimpan...';

    try {
      // Supabase membaca token pemulihan secara otomatis dari hash URL
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showMessage('Password berhasil diperbarui! Mengalihkan ke halaman login...', 'success');

      // Redirect ke login dalam 2 detik
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (err) {
      console.error('Error reset password:', err);
      showMessage(
        err.message || 'Gagal memperbarui password. Tautan mungkin telah kadaluwarsa.',
        'error'
      );
      submitBtn.disabled = false;
      submitBtn.innerText = 'Simpan Password';
    }
  });

  // Helper fungsi notifikasi
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.classList.remove('hidden');
    formMessage.className = `text-sm font-medium text-center p-3 rounded-xl ${
      type === 'success' 
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-red-50 text-red-600 border border-red-200'
    }`;
  }

  function hideMessage() {
    formMessage.classList.add('hidden');
  }

  // Helper fungsi toggle ketersediaan mata
  function setupTogglePassword(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    const eye = btn.querySelector('.icon-eye');
    const eyeOff = btn.querySelector('.icon-eye-off');

    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      eye.classList.toggle('hidden', isHidden);
      eyeOff.classList.toggle('hidden', !isHidden);
    });
  }
});