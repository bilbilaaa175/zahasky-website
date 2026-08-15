// js/publicity.js
const API_BASE_URL = "/api";

// --- STATE GLOBAL UNTUK FILTERING ---
let allProducts = [];        // Menyimpan seluruh data produk mentah yang didapat dari API
let currentCategory = "ALL"; // Menyimpan kategori yang sedang dipilih (default: ALL)
let currentSearchQuery = ""; // Menyimpan kata kunci pencarian yang sedang diketik (default: kosong)

// --- FUNGSI UTILITAS FORMAT UANG & NAVIGASI ---
function formatRupiah(amount) {
  if (!amount) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function navigateToId(id) {
  const newUrl = id ? `publicity.html?id=${id}` : "publicity.html";
  history.pushState({ id: id || null }, "", newUrl);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- FUNGSI RENDER BREADCRUMB ---
function renderBreadcrumb(product) {
  const breadcrumb = document.getElementById("breadcrumb");
  const sep = '<span class="text-brown/30">/</span>';

  let html = `<a href="index.html" class="hover:text-brown transition-colors">Home</a> ${sep} `;

  if (!product) {
    html += `<span class="text-brown font-semibold">Publicity</span>`;
  } else {
    html += `<a href="publicity.html" data-nav-list class="hover:text-brown transition-colors">Publicity</a> ${sep} `;
    html += `<span class="text-brown font-semibold truncate max-w-[220px] md:max-w-none">${product.name}</span>`;
  }

  breadcrumb.innerHTML = html;

  const listLink = breadcrumb.querySelector("[data-nav-list]");
  if (listLink) {
    listLink.addEventListener("click", function (e) {
      e.preventDefault();
      navigateToId(null);
    });
  }
}

// --- FUNGSI PEMBUATAN HTML KARTU PRODUK ---
function buildCardHTML(product) {
  const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : "Publicity";
  const rawDesc = product.x_product_description || "";
  const shortDesc = rawDesc.length > 50 ? rawDesc.substring(0, 50) + "..." : rawDesc;
  const fileFormat = product.x_file_format || "ZIP";

  return `
    <article
      class="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-brown/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
      data-id="${product.id}"
    >
      <div>
        <div class="relative aspect-[4/3] overflow-hidden bg-brown/5">
          <img src="${product.image_url}" alt="${product.name}" loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'" />
          
          <span class="absolute top-3 left-3 bg-white/90 backdrop-blur text-brown text-[11px] font-semibold px-3 py-1 rounded-pill shadow-sm">
            ${categoryName}
          </span>
        </div>

        <div class="p-4 md:p-5">
          <h3 class="font-serif text-base md:text-lg font-semibold text-brown leading-snug">${product.name}</h3>
          <p class="text-xs text-muted mt-2 leading-relaxed">${shortDesc}</p>
        </div>
      </div>

      <div class="p-4 md:p-5 pt-0 flex items-center justify-between">
        <span class="font-mono text-sm md:text-base font-bold text-brown">${formatRupiah(product.list_price)}</span>
        <span class="font-mono text-xs font-semibold text-muted/80 uppercase tracking-wider">${fileFormat}</span>
      </div>
    </article>
  `;
}

function attachCardClickHandlers(container) {
  container.querySelectorAll("[data-id]").forEach(function (card) {
    card.addEventListener("click", function () {
      navigateToId(card.getAttribute("data-id"));
    });
  });
}

// --- FUNGSI PENYARINGAN PRODUK & RENDER KE GRID ---
function applyFiltersAndRender() {
  const grid = document.getElementById("list-grid");

  // Melakukan penyaringan (filtering) pada array allProducts
  const filtered = allProducts.filter((product) => {
    const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : "Publicity";
    
    // 1. Cek apakah kategori cocok dengan yang dipilih
    const matchCategory =
      currentCategory === "ALL" ||
      categoryName.toLowerCase().includes(currentCategory.toLowerCase());

    // 2. Cek apakah nama produk mengandung kata kunci pencarian
    const matchSearch = product.name
      .toLowerCase()
      .includes(currentSearchQuery.toLowerCase());

    // Produk lolos jika memenuhi kedua kriteria di atas
    return matchCategory && matchSearch;
  });

  // Tampilkan hasil filter jika ada produk, jika tidak ada tampilkan pesan kosong
  if (filtered.length > 0) {
    grid.innerHTML = filtered.map(buildCardHTML).join("");
    attachCardClickHandlers(grid);
  } else {
    grid.innerHTML = `<p class="col-span-full text-center text-muted py-12">Produk yang kamu cari tidak ditemukan.</p>`;
  }
}

// --- FUNGSI MEMUAT DATA KATALOG DARI API ---
async function renderListView() {
  const skeleton = document.getElementById("list-skeleton");
  const grid = document.getElementById("list-grid");

  skeleton.classList.remove("hidden");
  grid.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE_URL}/publicity`);
    const data = await response.json();

    skeleton.classList.add("hidden");

    if (data.success && data.products.length > 0) {
      allProducts = data.products; // Simpan data produk dari server ke state global
      applyFiltersAndRender();     // Tampilkan produk ke layar sesuai filter awal
      setupFilterEvents();         // Pasang event listener untuk search bar & tombol filter
    } else {
      grid.innerHTML = `<p class="col-span-full text-center text-muted py-10">Belum ada produk katalog yang tersedia.</p>`;
    }
  } catch (error) {
    console.error("Error fetching publicity:", error);
    skeleton.classList.add("hidden");
    grid.innerHTML = `<p class="col-span-full text-center text-red-600 py-10">Gagal memuat produk. Pastikan server Node.js sudah berjalan.</p>`;
  }
}

// Fungsi menyaring produk berdasarkan pencarian & kategori
function applyFiltersAndRender() {
  const grid = document.getElementById("list-grid");

  const filtered = allProducts.filter((product) => {
    // Ambil nama kategori dari Odoo / API
    const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : (product.category || "");
    
    // 1. Filter Kategori (Abaikan huruf besar/kecil)
    const matchCategory =
      currentCategory === "ALL" ||
      categoryName.toLowerCase().includes(currentCategory.toLowerCase());

    // 2. Filter Search Bar (Cari di Nama atau Deskripsi)
    const productName = product.name || "";
    const productDesc = product.x_product_description || "";
    
    const matchSearch =
      productName.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
      productDesc.toLowerCase().includes(currentSearchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  if (filtered.length > 0) {
    grid.innerHTML = filtered.map(buildCardHTML).join("");
    attachCardClickHandlers(grid);
  } else {
    grid.innerHTML = `<p class="col-span-full text-center text-muted py-12">Produk yang kamu cari tidak ditemukan.</p>`;
  }
}

// Handler event filter & search
function setupFilterEvents() {
  const searchInput = document.getElementById("search-input");
  if (searchInput && !searchInput.dataset.hasListener) {
    searchInput.dataset.hasListener = "true";
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim();
      applyFiltersAndRender();
    });
  }

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    if (!btn.dataset.hasListener) {
      btn.dataset.hasListener = "true";
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => {
          b.classList.remove("active", "bg-brown", "text-cream", "border-brown");
          b.classList.add("bg-white", "text-muted", "border-brown/15");
        });

        btn.classList.remove("bg-white", "text-muted", "border-brown/15");
        btn.classList.add("active", "bg-brown", "text-cream", "border-brown");

        currentCategory = btn.getAttribute("data-category");
        applyFiltersAndRender();
      });
    }
  });
}

// --- FUNGSI RENDER DETAIL VIEW ---
async function renderDetailView(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    const data = await response.json();

    if (!data.success || !data.product) {
      navigateToId(null);
      return;
    }

    const product = data.product;

    document.title = `${product.name} — Zahasky Publicity`;

    const mainImage = document.getElementById("detail-main-image");
    if (mainImage) {
      mainImage.src = product.image_url;
      mainImage.alt = product.name;
    }

    const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : "Publicity";
    
    const elCategory = document.getElementById("detail-category");
    const elTitle = document.getElementById("detail-title");
    const elPrice = document.getElementById("detail-price");

    if (elCategory) elCategory.textContent = categoryName;
    if (elTitle) elTitle.textContent = product.name;
    if (elPrice) elPrice.textContent = formatRupiah(product.list_price);

    // Deskripsi Produk (Langsung teks paragraf)
    const elDesc = document.getElementById("detail-description");
    if (elDesc) {
      elDesc.textContent = product.x_product_description || "Deskripsi produk tidak tersedia.";
    }

    const elFormat = document.getElementById("detail-format");
    const elSize = document.getElementById("detail-size");
    const elSeries = document.getElementById("detail-series");
    const elStock = document.getElementById("detail-stock");

    if (elFormat) elFormat.textContent = product.x_file_format || "ZIP";
    if (elSize) elSize.textContent = product.x_file_size || "-";
    if (elSeries) elSeries.textContent = product.x_series || "-";
    // Penanganan Stock Serbaguna (Aman untuk Integer 0, Integer > 0, String, maupun Boolean false)
    if (elStock) {
      const rawStock = product.x_stock;

      // Cek jika nilainya angka (termasuk 0) ATAU string yang berisi teks/angka
      if (typeof rawStock === 'number') {
        elStock.textContent = rawStock;
      } else if (typeof rawStock === 'string' && rawStock.trim() !== '') {
        elStock.textContent = rawStock;
      } else {
        // Jika dari Odoo bernilai false/null/undefined (belum diisi)
        elStock.textContent = "-";
      }
    }    

    const elActions = document.getElementById("detail-actions");
    if (elActions) {
      elActions.innerHTML = `
        <button type="button" onclick="addToCart(${product.id})"
          class="flex-1 rounded-pill bg-brown text-cream text-sm font-semibold py-4 px-6 hover:bg-ink transition-colors flex items-center justify-center gap-2 shadow-sm">
          <svg style="width:20px; height:20px; min-width:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <span>Tambah ke keranjang</span>
        </button>
        
        <button type="button" onclick="buyNow(${product.id})"
          class="flex-1 rounded-pill border border-brown/30 bg-white text-brown text-sm font-semibold py-4 px-6 hover:bg-brown/5 transition-colors text-center shadow-sm">
          <span>Beli sekarang</span>
        </button>
      `;
    }

    renderBreadcrumb(product);
    renderRelatedItems(product.id);

  } catch (error) {
    console.error("Error fetching detail:", error);
  }
}

// --- FUNGSI RENDER REKOMENDASI PRODUK LAIN ---
async function renderRelatedItems(currentId) {
  const relatedGrid = document.getElementById("related-grid");
  try {
    const response = await fetch(`${API_BASE_URL}/publicity`);
    const data = await response.json();
    
    if (data.success) {
      const otherProducts = data.products.filter(p => p.id != currentId).slice(0, 3);
      relatedGrid.innerHTML = otherProducts.map(buildCardHTML).join("");
      attachCardClickHandlers(relatedGrid);
    }
  } catch (e) {
    relatedGrid.innerHTML = "";
  }
}

// --- FUNGSI UTAMA PENENTU TAMPILAN (LIST vs DETAIL) ---
function render() {
  const id = getIdFromUrl();
  const viewList = document.getElementById("view-list");
  const viewDetail = document.getElementById("view-detail");

  if (!id) {
    viewDetail.classList.add("hidden");
    viewList.classList.remove("hidden");
    document.title = "Publicity - Zahasky";
    renderBreadcrumb(null);
    renderListView();
  } else {
    viewList.classList.add("hidden");
    viewDetail.classList.remove("hidden");
    renderDetailView(id);
  }
}

async function addToCart(productId) {
  // 1. Cari produk dari state global
  let product = allProducts.find(p => p.id === productId);

  // 2. Jika tidak ada di state global (misal saat buka halaman detail langsung), ambil dari API
  if (!product) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      const data = await res.json();
      if (data.success) product = data.product;
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    }
  }

  // 3. Ambil URL gambar langsung dari tampilan detail jika ada
  const mainImgEl = document.getElementById("detail-main-image");
  const imageUrl = (mainImgEl && mainImgEl.src) ? mainImgEl.src : (product ? product.image_url : "");

  if (product) {
    const productData = {
      ...product,
      image_url: imageUrl || product.image_url,
      page_type: "publicity"
    };
    
    // Panggil fungsi global dari cart-helper.js
    addToCartGlobal(productData);
  }
}

async function buyNow(productId) {
  // 1. Cari produk dari state global
  let product = allProducts.find(p => p.id === productId || p.id == productId);

  // 2. Jika tidak ada di state global, ambil dari API
  if (!product) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      const data = await res.json();
      if (data.success) product = data.product;
    } catch (err) {
      console.error('Gagal mengambil data produk:', err);
    }
  }

  if (!product) {
    alert('Produk tidak ditemukan. Silakan coba lagi.');
    return;
  }

  // 3. Ambil URL gambar dari tampilan detail jika ada
  const mainImgEl = document.getElementById('detail-main-image');
  const imageUrl  = (mainImgEl && mainImgEl.src) ? mainImgEl.src : (product.image_url || '');

  // 4. Buat item checkout dengan page_type = 'publicity' (FISIK)
  const checkoutItem = [{
    id:          product.id,
    name:        product.name,
    price:       product.list_price,
    image_url:   imageUrl,
    file_format: product.x_file_format || 'ZIP',
    x_digital_file_url: product.x_digital_file_url || product.x_drive_link || null,
    drive_link:         product.x_digital_file_url || product.x_drive_link || null,
    x_drive_link:       product.x_digital_file_url || product.x_drive_link || null,
  }];

  // 5. Publicity = Produk FISIK → Cek alamat dulu
  let savedAddress = null;
  try {
    savedAddress = JSON.parse(localStorage.getItem('zahasky_address'));
  } catch { savedAddress = null; }

  // 6. Simpan item ke sessionStorage
  sessionStorage.setItem('checkout_items', JSON.stringify(checkoutItem));

  if (!savedAddress) {
    // Belum ada alamat → arahkan ke checkout dan buka modal alamat otomatis
    window.location.href = 'checkout.html?needAddress=true';
  } else {
    window.location.href = 'checkout.html';
  }
}

document.getElementById("btn-back-to-list")?.addEventListener("click", function () {
  navigateToId(null);
});

window.addEventListener("popstate", render);

// Inisialisasi awal saat halaman dibuka
render();