// AURA LUXE - Products Page Logic
let allProducts = [];
let selectedCompany = "all";
let currentSearch = "";
let currentSort = "default";
let activeCheckoutProduct = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadCatalog();
  await updateOrdersBadge();
});

/**
 * Setup DOM event listeners
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderFilteredProducts();
    });
  }

  // Sort select
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderFilteredProducts();
    });
  }

  // Checkout modal controls
  const btnCloseCheckout = document.getElementById("btn-close-checkout");
  const checkoutModal = document.getElementById("checkout-modal");
  if (btnCloseCheckout && checkoutModal) {
    btnCloseCheckout.addEventListener("click", () => {
      checkoutModal.classList.remove("open");
    });
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove("open");
    });
  }

  // Checkout form submit
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }

  // Success modal controls
  const successModal = document.getElementById("success-modal");
  const btnContinue = document.getElementById("btn-continue-shopping");
  if (btnContinue && successModal) {
    btnContinue.addEventListener("click", () => {
      successModal.classList.remove("open");
    });
  }

  // Add Product modal controls
  const btnOpenAddProduct = document.getElementById("btn-open-add-product");
  const addProductModal = document.getElementById("add-product-modal");
  const btnCloseAddProduct = document.getElementById("btn-close-add-product");
  const addProductForm = document.getElementById("add-product-form");

  if (btnOpenAddProduct && addProductModal) {
    btnOpenAddProduct.addEventListener("click", () => {
      addProductModal.classList.add("open");
    });
  }
  if (btnCloseAddProduct && addProductModal) {
    btnCloseAddProduct.addEventListener("click", () => {
      addProductModal.classList.remove("open");
    });
    addProductModal.addEventListener("click", (e) => {
      if (e.target === addProductModal) addProductModal.classList.remove("open");
    });
  }

  // Auto calculate actual price in Add Product modal
  const newOrderPrice = document.getElementById("new-order-price");
  const newDiscount = document.getElementById("new-discount");
  const newActualPrice = document.getElementById("new-actual-price");

  function calcActualPrice() {
    const original = parseFloat(newOrderPrice.value) || 0;
    const discount = parseFloat(newDiscount.value) || 0;
    const actual = Math.max(0, original - discount);
    newActualPrice.value = actual.toFixed(2);
  }

  if (newOrderPrice && newDiscount) {
    newOrderPrice.addEventListener("input", calcActualPrice);
    newDiscount.addEventListener("input", calcActualPrice);
  }

  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProductSubmit);
  }
}

/**
 * Load products from Supabase
 */
async function loadCatalog() {
  const grid = document.getElementById("products-grid");
  try {
    const res = await fetchProducts();
    if (!res.success) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">Failed to load catalog</h3>
          <p class="empty-desc">${res.error}</p>
          <button class="btn btn-primary" onclick="loadCatalog()">Retry</button>
        </div>
      `;
      return;
    }

    allProducts = res.data || [];
    updateHeroStats(allProducts);
    populateCompanyPills(allProducts);
    renderFilteredProducts();
  } catch (err) {
    console.error("Error loading catalog:", err);
  }
}

/**
 * Update top hero stats
 */
function updateHeroStats(products) {
  const totalElem = document.getElementById("stat-total-products");
  const dealsElem = document.getElementById("stat-active-deals");
  const stockElem = document.getElementById("stat-available-stock");

  if (totalElem) totalElem.textContent = products.length;
  if (dealsElem) {
    const deals = products.filter(p => (p.Discount_amount || 0) > 0).length;
    dealsElem.textContent = deals;
  }
  if (stockElem) {
    const inStock = products.filter(p => p.Is_available !== false).length;
    stockElem.textContent = inStock;
  }
}

/**
 * Dynamically populate company filter pills
 */
function populateCompanyPills(products) {
  const container = document.getElementById("company-pills");
  if (!container) return;

  const companies = Array.from(new Set(products.map(p => p.Company).filter(Boolean)));
  
  let html = `<button class="pill-btn ${selectedCompany === 'all' ? 'active' : ''}" data-company="all">All Brands</button>`;
  companies.forEach(company => {
    const isActive = selectedCompany.toLowerCase() === company.toLowerCase() ? 'active' : '';
    html += `<button class="pill-btn ${isActive}" data-company="${company}">${company}</button>`;
  });

  container.innerHTML = html;

  container.querySelectorAll(".pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCompany = btn.getAttribute("data-company");
      renderFilteredProducts();
    });
  });
}

/**
 * Render filtered & sorted products
 */
function renderFilteredProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  let filtered = [...allProducts];

  // Company filter
  if (selectedCompany !== "all") {
    filtered = filtered.filter(p => p.Company && p.Company.toLowerCase() === selectedCompany.toLowerCase());
  }

  // Search filter
  if (currentSearch) {
    filtered = filtered.filter(p => {
      const name = (p.Customer_Name || "").toLowerCase();
      const company = (p.Company || "").toLowerCase();
      const desc = (p.Product_Description || "").toLowerCase();
      return name.includes(currentSearch) || company.includes(currentSearch) || desc.includes(currentSearch);
    });
  }

  // Sorting
  if (currentSort === "price-asc") {
    filtered.sort((a, b) => (a.Actual_Amount || 0) - (b.Actual_Amount || 0));
  } else if (currentSort === "price-desc") {
    filtered.sort((a, b) => (b.Actual_Amount || 0) - (a.Actual_Amount || 0));
  } else if (currentSort === "discount-desc") {
    filtered.sort((a, b) => (b.Discount_amount || 0) - (a.Discount_amount || 0));
  } else if (currentSort === "name-asc") {
    filtered.sort((a, b) => (a.Customer_Name || "").localeCompare(b.Customer_Name || ""));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No products found</h3>
        <p class="empty-desc">Try adjusting your search criteria or brand filter.</p>
        <button class="btn btn-secondary" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => createProductCardHTML(product)).join("");

  // Attach Buy buttons
  grid.querySelectorAll(".btn-buy").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const prodId = parseInt(btn.getAttribute("data-id"));
      const product = allProducts.find(p => p.id === prodId);
      if (product) openCheckoutModal(product);
    });
  });
}

/**
 * Helper to reset filters
 */
function resetFilters() {
  selectedCompany = "all";
  currentSearch = "";
  currentSort = "default";
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "default";
  populateCompanyPills(allProducts);
  renderFilteredProducts();
}

/**
 * Generate Product Card HTML
 */
function createProductCardHTML(p) {
  const isAvailable = p.Is_available !== false;
  const discount = p.Discount_amount || 0;
  const original = p.Order || 0;
  const actual = p.Actual_Amount || Math.max(0, original - discount);

  const discountPercent = original > 0 && discount > 0 ? Math.round((discount / original) * 100) : 0;

  return `
    <article class="product-card" id="product-${p.id}">
      <div class="card-img-wrapper">
        <img 
          src="${p.Image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}" 
          alt="${escapeHtml(p.Customer_Name || 'Product')}" 
          class="card-img" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'"
        />
        <div class="card-badges">
          <span class="badge badge-company">${escapeHtml(p.Company || 'Store')}</span>
          ${discountPercent > 0 ? `<span class="badge badge-discount">-${discountPercent}%</span>` : ''}
        </div>
        <div class="badge-stock ${isAvailable ? '' : 'out-of-stock'}">
          <span class="stock-indicator"></span>
          <span>${isAvailable ? 'In Stock' : 'Sold Out'}</span>
        </div>
      </div>

      <div class="card-content">
        <h3 class="card-title">${escapeHtml(p.Customer_Name || 'Untitled Product')}</h3>
        <p class="card-desc">${escapeHtml(p.Product_Description || '')}</p>

        <div class="card-pricing">
          <div class="price-box">
            <span class="price-actual">${formatCurrency(actual)}</span>
            ${discount > 0 ? `<span class="price-original">${formatCurrency(original)}</span>` : ''}
          </div>
          ${discount > 0 ? `<span class="price-save">Save ${formatCurrency(discount)}</span>` : ''}
        </div>

        <div class="card-actions">
          ${isAvailable ? `
            <button class="btn btn-emerald btn-full btn-buy" data-id="${p.id}" id="buy-btn-${p.id}">
              <span>⚡ Buy Now</span>
            </button>
          ` : `
            <button class="btn btn-secondary btn-full" disabled style="opacity: 0.55; cursor: not-allowed;">
              <span>❌ Sold Out</span>
            </button>
          `}
        </div>
      </div>
    </article>
  `;
}

/**
 * Open Checkout Modal for a specific product
 */
function openCheckoutModal(product) {
  activeCheckoutProduct = product;
  const modal = document.getElementById("checkout-modal");
  const summaryBox = document.getElementById("checkout-product-summary");
  const origPriceEl = document.getElementById("checkout-original-price");
  const discPriceEl = document.getElementById("checkout-discount-price");
  const totalPriceEl = document.getElementById("checkout-total-price");
  const prodIdInput = document.getElementById("order-product-id");
  const prodNameInput = document.getElementById("order-product-name");

  prodIdInput.value = product.id;
  prodNameInput.value = product.Customer_Name;

  const original = product.Order || 0;
  const discount = product.Discount_amount || 0;
  const actual = product.Actual_Amount || Math.max(0, original - discount);

  summaryBox.innerHTML = `
    <img src="${product.Image_url}" alt="${escapeHtml(product.Customer_Name)}" class="order-summary-img" />
    <div class="order-summary-details">
      <div class="order-summary-company">${escapeHtml(product.Company)}</div>
      <div class="order-summary-name">${escapeHtml(product.Customer_Name)}</div>
      <div class="order-summary-price">${formatCurrency(actual)}</div>
    </div>
  `;

  origPriceEl.textContent = formatCurrency(original);
  discPriceEl.textContent = discount > 0 ? `- ${formatCurrency(discount)}` : `$0.00`;
  totalPriceEl.textContent = formatCurrency(actual);

  modal.classList.add("open");
}

/**
 * Handle Order Submission
 * Saves to Supabase 'Order' table and marks product as Is_available = false
 */
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-confirm-order");
  const originalBtnHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Processing Supabase Order...</span>`;

    const productId = parseInt(document.getElementById("order-product-id").value);
    const productName = document.getElementById("order-product-name").value;
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhoneRaw = document.getElementById("customer-phone").value.trim();
    const customerAddress = document.getElementById("customer-address").value.trim();

    // Clean phone number to double precision numeric
    const customerPhoneNum = parseFloat(customerPhoneRaw.replace(/\D/g, ''));

    if (!customerPhoneNum || isNaN(customerPhoneNum)) {
      showToast("Please enter a valid phone number (digits only)", "warning");
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;
      return;
    }

    const orderPayload = {
      Order_ID: productId,
      Customer_name: customerName,
      Customer_Ph_No: customerPhoneNum,
      Purchase_Product: productName,
      Customer_Address: customerAddress
    };

    // 1. Insert into Supabase 'Order' table
    const orderRes = await createOrder(orderPayload);
    if (!orderRes.success) {
      if (typeof orderRes.error === 'string' && orderRes.error.includes("duplicate key")) {
        showToast("This item has already been ordered! Only 1 unique order per product.", "error");
      } else {
        showToast(`Order failed: ${orderRes.error}`, "error");
      }
      btn.disabled = false;
      btn.innerHTML = originalBtnHTML;
      return;
    }

    const savedOrder = orderRes.data;

    // 2. Mark product as not available (Is_available = false)
    await updateProductAvailability(productId, false);

    // 3. Close checkout modal & reset form
    document.getElementById("checkout-modal").classList.remove("open");
    document.getElementById("checkout-form").reset();

    // 4. Update local state & UI
    const targetProd = allProducts.find(p => p.id === productId);
    if (targetProd) targetProd.Is_available = false;
    updateHeroStats(allProducts);
    renderFilteredProducts();
    await updateOrdersBadge();

    // 5. Open Success Modal with receipt details
    const successModal = document.getElementById("success-modal");
    const receiptBox = document.getElementById("success-receipt-details");
    receiptBox.innerHTML = `
      <div class="receipt-row">
        <span>Order Tracking ID:</span>
        <span class="order-id-badge">#ORD-${savedOrder.Customer_Id || savedOrder.Order_ID}</span>
      </div>
      <div class="receipt-row">
        <span>Product:</span>
        <span>${escapeHtml(savedOrder.Purchase_Product)}</span>
      </div>
      <div class="receipt-row">
        <span>Customer Name:</span>
        <span>${escapeHtml(savedOrder.Customer_name)}</span>
      </div>
      <div class="receipt-row">
        <span>Contact Phone:</span>
        <span>${savedOrder.Customer_Ph_No}</span>
      </div>
      <div class="receipt-row">
        <span>Delivery Address:</span>
        <span>${escapeHtml(savedOrder.Customer_Address)}</span>
      </div>
      <div class="receipt-row">
        <span>Status:</span>
        <span style="color: var(--accent-emerald);">Confirmed in Supabase</span>
      </div>
    `;

    successModal.classList.add("open");
    showToast("Order placed and saved into Supabase!", "success");

  } catch (err) {
    console.error("Order submit exception:", err);
    showToast("An unexpected error occurred while placing order", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHTML;
  }
}

/**
 * Handle Add Product Submission
 */
async function handleAddProductSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-save-new-product");
  const originalBtnHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Saving to Supabase...</span>`;

    const company = document.getElementById("new-company").value.trim();
    const productName = document.getElementById("new-product-name").value.trim();
    const description = document.getElementById("new-description").value.trim();
    const orderPrice = parseFloat(document.getElementById("new-order-price").value) || 0;
    const discount = parseFloat(document.getElementById("new-discount").value) || 0;
    const actualPrice = Math.max(0, orderPrice - discount);
    const imageUrl = document.getElementById("new-image-url").value.trim();

    const newProductPayload = {
      Company: company,
      Customer_Name: productName,
      Product_Description: description,
      Order: orderPrice,
      Discount_amount: discount,
      Actual_Amount: actualPrice,
      Image_url: imageUrl,
      Is_available: true
    };

    const res = await insertProduct(newProductPayload);
    if (!res.success) {
      showToast(`Failed to add product: ${res.error}`, "error");
      return;
    }

    showToast(`Product "${productName}" successfully saved to Supabase!`, "success");
    document.getElementById("add-product-modal").classList.remove("open");
    document.getElementById("add-product-form").reset();

    // Reload catalog
    await loadCatalog();

  } catch (err) {
    console.error("Add product error:", err);
    showToast("Failed to save product", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHTML;
  }
}

/**
 * HTML Escaping helper for security
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
