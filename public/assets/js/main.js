/**
 * main.js
 * -----------------------------------------------------------------------
 * Logika umum UI (Active navbar highlight & mobile menu toggle)
 * -----------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Dapatkan nama file URL saat ini (default: index.html jika di root "/")
  let currentPage = window.location.pathname.split("/").pop();
  if (!currentPage || currentPage === "") {
    currentPage = "index.html";
  }

  // 2. Tandai Link Navigasi yang Aktif
  const navLinks = document.querySelectorAll(
    'nav a, #mobile-menu a, a[href="login.html"], a[href="register.html"]'
  );

  navLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");

    // Abaikan link anchor internal (#hero, #contact, dll)
    if (!linkHref || linkHref.startsWith("#")) return;

    if (linkHref === currentPage) {
      // Jika link sesuai dengan halaman saat ini
      if (link.classList.contains("nav-link")) {
        link.classList.remove("nav-link");
        link.classList.add("nav-link-active");
      }

      // Untuk link di Mobile Menu
      if (link.closest("#mobile-menu") && !link.querySelector("button")) {
        link.classList.remove("text-gray-400", "font-medium");
        link.classList.add("text-brown", "font-semibold");
      }
    } else {
      // Jika bukan halaman aktif, pastikan menggunakan class default
      if (link.classList.contains("nav-link-active")) {
        link.classList.remove("nav-link-active");
        link.classList.add("nav-link");
      }
    }
  });

  // 3. Logika Toggle Mobile Menu
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      mobileMenu.classList.toggle("hidden");
      mobileMenu.classList.toggle("flex");
      if (iconOpen) iconOpen.classList.toggle("hidden");
      if (iconClose) iconClose.classList.toggle("hidden");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Tutup mobile menu saat link diklik
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        mobileMenu.classList.remove("flex", "is-open");
        if (iconOpen) iconOpen.classList.remove("hidden");
        if (iconClose) iconClose.classList.add("hidden");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }
});