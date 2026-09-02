document.addEventListener('DOMContentLoaded', () => {
  const resetForm = document.getElementById('reset-password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');

  // Pasang toggle mata
  setupTogglePassword('toggle-new-password', 'new-password');
  setupTogglePassword('toggle-confirm-password', 'confirm-password');

  if (!resetForm) return;

  // Tahan form submit biasa agar URL tidak berubah membawa query password
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    hideMessage();

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

    submitBtn.disabled = true;
    submitBtn.innerText = 'Menyimpan...';

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showMessage('Password berhasil diperbarui! Mengalihkan ke login...', 'success');

      await supabaseClient.auth.signOut();

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

  // Helper Toggle Eye (Fix Unhide/Hide)
  function setupTogglePassword(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Menggunakan currentTarget agar elemen SVG selalu ketemu
      const targetBtn = e.currentTarget;
      const eyeIcon = targetBtn.querySelector('.icon-eye');
      const eyeOffIcon = targetBtn.querySelector('.icon-eye-off');

      if (eyeIcon && eyeOffIcon) {
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
      }
    });
  }
});