document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('email');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');

  if (!forgotForm) return;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Reset pesan
    formMessage.classList.add('hidden');
    formMessage.className = 'hidden text-sm font-medium text-center p-3 rounded-xl';

    if (!email) {
      showMessage('Silakan masukkan alamat email kamu.', 'error');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerText = 'Mengirim...';

    try {
      // Menentukan URL untuk pengarahan setelah user klik link di email
      const redirectTo = `${window.location.origin}/public/reset-password.html`;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        throw error;
      }

      showMessage(
        'Tautan reset password telah dikirim ke email kamu. Silakan periksa kotak masuk/spam.',
        'success'
      );
      forgotForm.reset();
    } catch (err) {
      console.error('Error reset password:', err);
      showMessage(err.message || 'Gagal mengirim tautan reset password.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Kirim Tautan Reset';
    }
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.classList.remove('hidden');

    if (type === 'success') {
      formMessage.classList.add('bg-green-50', 'text-green-700', 'border', 'border-green-200');
    } else {
      formMessage.classList.add('bg-red-50', 'text-red-600', 'border', 'border-red-200');
    }
  }
});