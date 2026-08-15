/**
 * main.js
 * -----------------------------------------------------------------------
 * Logika umum UI (Active navbar highlight, mobile menu toggle, & dynamic Auth Navbar)
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

    if (!linkHref || linkHref.startsWith("#")) return;

    if (linkHref === currentPage) {
      if (link.classList.contains("nav-link")) {
        link.classList.remove("nav-link");
        link.classList.add("nav-link-active");
      }

      if (link.closest("#mobile-menu") && !link.querySelector("button")) {
        link.classList.remove("text-gray-400", "font-medium");
        link.classList.add("text-brown", "font-semibold");
      }
    } else {
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

  // 4. Inisialisasi Logika Dynamic Auth Navbar
  initNavbarAuth();
});

/**
 * Mengatur tampilan UI Navbar secara dinamis berdasarkan status autentikasi Supabase
 */
async function initNavbarAuth() {
  const guestNav = document.getElementById("guest-nav");
  const userNav = document.getElementById("user-nav");
  const mobileGuestNav = document.getElementById("mobile-guest-nav");
  const mobileUserNav = document.getElementById("mobile-user-nav");

  const dbClient = window.supabaseClient || window.supabase;
  if (!dbClient || !dbClient.auth) return;

  const updateNavbarUI = (session) => {
    if (session) {
      // USER SUDAH LOGIN: Sembunyikan Login/Register, Tampilkan Avatar Profil
      if (guestNav) {
        guestNav.classList.add("hidden");
        guestNav.classList.remove("flex");
      }
      if (userNav) {
        userNav.classList.remove("hidden");
        userNav.classList.add("flex");
      }

      // Versi Mobile
      if (mobileGuestNav) mobileGuestNav.classList.add("hidden");
      if (mobileUserNav) mobileUserNav.classList.remove("hidden");
    } else {
      // USER BELUM LOGIN (GUEST): Tampilkan Login/Register, Sembunyikan Avatar Profil
      if (guestNav) {
        guestNav.classList.remove("hidden");
        guestNav.classList.add("flex");
      }
      if (userNav) {
        userNav.classList.add("hidden");
        userNav.classList.remove("flex");
      }

      // Versi Mobile
      if (mobileGuestNav) mobileGuestNav.classList.remove("hidden");
      if (mobileUserNav) mobileUserNav.classList.add("hidden");
    }
  };

  try {
    const { data: { session } } = await dbClient.auth.getSession();
    updateNavbarUI(session);

    dbClient.auth.onAuthStateChange((_event, session) => {
      updateNavbarUI(session);
    });
  } catch (error) {
    console.error("Error initializing navbar auth:", error);
  }
}