// js/catalog.js
const API_BASE_URL = "/api";

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
  const newUrl = id ? `catalog.html?id=${id}` : "catalog.html";
  history.pushState({ id: id || null }, "", newUrl);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderBreadcrumb(product) {
  const breadcrumb = document.getElementById("breadcrumb");
  const sep = '<span class="text-brown/30">/</span>';

  let html = `<a href="index.html" class="hover:text-brown transition-colors">Home</a> ${sep} `;

  if (!product) {
    html += `<span class="text-brown font-semibold">Catalog</span>`;
  } else {
    html += `<a href="catalog.html" data-nav-list class="hover:text-brown transition-colors">Catalog</a> ${sep} `;
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

function buildCardHTML(product) {
  const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : "Catalog";
  const rawDesc = product.x_product_description;
  const shortDesc = rawDesc.length > 50 ? rawDesc.substring(0, 50) + "..." : rawDesc;
  const fileFormat = product.x_file_format;

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

async function renderListView() {
  const skeleton = document.getElementById("list-skeleton");
  const grid = document.getElementById("list-grid");

  skeleton.classList.remove("hidden");
  grid.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE_URL}/catalog`);
    const data = await response.json();

    skeleton.classList.add("hidden");

    if (data.success && data.products.length > 0) {
      grid.innerHTML = data.products.map(buildCardHTML).join("");
      attachCardClickHandlers(grid);
    } else {
      grid.innerHTML = `<p class="col-span-full text-center text-muted py-10">Belum ada produk katalog yang tersedia.</p>`;
    }
  } catch (error) {
    console.error("Error fetching catalog:", error);
    skeleton.classList.add("hidden");
    grid.innerHTML = `<p class="col-span-full text-center text-red-600 py-10">Gagal memuat produk. Pastikan server Node.js sudah berjalan.</p>`;
  }
}

async function renderDetailView(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    const data = await response.json();

    if (!data.success || !data.product) {
      navigateToId(null);
      return;
    }

    const product = data.product;

    document.title = `${product.name} — Zahasky Catalog`;

    // 1. Gambar Utama
    const mainImage = document.getElementById("detail-main-image");
    if (mainImage) {
      mainImage.src = product.image_url;
      mainImage.alt = product.name;
    }

    // 2. Category, Title, Price
    const categoryName = Array.isArray(product.categ_id) ? product.categ_id[1] : "Catalog";
    
    const elCategory = document.getElementById("detail-category");
    const elTitle = document.getElementById("detail-title");
    const elPrice = document.getElementById("detail-price");

    if (elCategory) elCategory.textContent = categoryName;
    if (elTitle) elTitle.textContent = product.name;
    if (elPrice) elPrice.textContent = formatRupiah(product.list_price);

    // 3. Deskripsi Produk (x_product_description)
    const elDesc = document.getElementById("detail-description");
    if (elDesc) {
      elDesc.innerHTML = `<p>${product.x_product_description || 'File desain interior kualitas tinggi siap pakai.'}</p>`;
    }

    // 4. Format, Ukuran File, Series, Desainer, Peran Desainer (x_file_format, x_file_size, x_series, x_designer_name, x_designer_role)
    const elSeries = document.getElementById("detail-series");
    const elFormat = document.getElementById("detail-format");
    const elSize = document.getElementById("detail-size");
    const elDesigner = document.getElementById("detail-designer");
    const elRole = document.getElementById("detail-role");

    if (elSeries) elSeries.textContent = product.x_series || "-";
    if (elFormat) elFormat.textContent = product.x_file_format || "ZIP";
    if (elSize) elSize.textContent = product.x_file_size || "-";
    if (elDesigner) elDesigner.textContent = product.x_designer_name || "-";
    if (elRole) elRole.textContent = product.x_designer_role || "-";

// 5. Tombol Aksi (Tambah ke Keranjang & Beli Sekarang)
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

async function renderRelatedItems(currentId) {
  const relatedGrid = document.getElementById("related-grid");
  try {
    const response = await fetch(`${API_BASE_URL}/catalog`);
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

function render() {
  const id = getIdFromUrl();
  const viewList = document.getElementById("view-list");
  const viewDetail = document.getElementById("view-detail");

  if (!id) {
    viewDetail.classList.add("hidden");
    viewList.classList.remove("hidden");
    document.title = "Catalog — Zahasky";
    renderBreadcrumb(null);
    renderListView();
  } else {
    viewList.classList.add("hidden");
    viewDetail.classList.remove("hidden");
    renderDetailView(id);
  }
}

function addToCart(productId) {
  alert(`Produk ID ${productId} ditambahkan ke keranjang!`);
}

function buyNow(productId) {
  alert(`Melanjut ke checkout untuk Produk ID ${productId}`);
}

document.getElementById("btn-back-to-list").addEventListener("click", function () {
  navigateToId(null);
});

window.addEventListener("popstate", render);

render();