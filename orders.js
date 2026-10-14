// AURA LUXE - Orders Page Logic
let allOrders = [];
let allProductsMap = {};
let currentSearch = "";
let currentSort = "newest";
let viewMode = "cards"; // "cards" or "table"

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadOrdersData();
  await updateOrdersBadge();
});

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById("orders-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderOrders();
    });
  }

  // Sort select
  const sortSelect = document.getElementById("orders-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderOrders();
    });
  }

  // View toggles
  const btnCards = document.getElementById("btn-view-cards");
  const btnTable = document.getElementById("btn-view-table");

  if (btnCards && btnTable) {
    btnCards.addEventListener("click", () => {
      viewMode = "cards";
      btnCards.classList.add("btn-primary");
      btnCards.classList.remove("btn-secondary");
      btnTable.classList.add("btn-secondary");
      btnTable.classList.remove("btn-primary");
      renderOrders();
    });

    btnTable.addEventListener("click", () => {
      viewMode = "table";
      btnTable.classList.add("btn-primary");
      btnTable.classList.remove("btn-secondary");
      btnCards.classList.add("btn-secondary");
      btnCards.classList.remove("btn-primary");
      renderOrders();
    });

    // Default active state
    btnCards.classList.add("btn-primary");
    btnCards.classList.remove("btn-secondary");
  }

  // Refresh button
  const btnRefresh = document.getElementById("btn-refresh-orders");
  const refreshIcon = document.getElementById("refresh-icon");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      if (refreshIcon) refreshIcon.style.animation = "spin 0.8s linear infinite";
      await loadOrdersData();
      if (refreshIcon) refreshIcon.style.animation = "none";
      showToast("Orders refreshed from Supabase!", "info");
    });
  }

  // Invoice modal
  const invoiceModal = document.getElementById("invoice-modal");
  const btnCloseInvoice = document.getElementById("btn-close-invoice");
  const btnDoneInvoice = document.getElementById("btn-done-invoice");
  const btnPrintInvoice = document.getElementById("btn-print-invoice");

  if (btnCloseInvoice && invoiceModal) {
    btnCloseInvoice.addEventListener("click", () => invoiceModal.classList.remove("open"));
  }
  if (btnDoneInvoice && invoiceModal) {
    btnDoneInvoice.addEventListener("click", () => invoiceModal.classList.remove("open"));
  }
  if (btnPrintInvoice) {
    btnPrintInvoice.addEventListener("click", () => window.print());
  }
  if (invoiceModal) {
    invoiceModal.addEventListener("click", (e) => {
      if (e.target === invoiceModal) invoiceModal.classList.remove("open");
    });
  }
}

/**
 * Load Orders and Products to cross-reference info
 */
async function loadOrdersData() {
  const container = document.getElementById("orders-container");

  try {
    // Parallel fetch orders and products
    const [ordersRes, productsRes] = await Promise.all([
      fetchOrders(),
      fetchProducts()
    ]);

    if (!ordersRes.success) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">Failed to load orders from Supabase</h3>
          <p class="empty-desc">${ordersRes.error}</p>
          <button class="btn btn-primary" onclick="loadOrdersData()">Retry</button>
        </div>
      `;
      return;
    }

    allOrders = ordersRes.data || [];
    
    // Map products by id for easy lookup
    if (productsRes.success && productsRes.data) {
      allProductsMap = {};
      productsRes.data.forEach(p => {
        allProductsMap[p.id] = p;
      });
    }

    updateOrdersStats(allOrders);
    renderOrders();
    await updateOrdersBadge();

  } catch (err) {
    console.error("loadOrdersData error:", err);
  }
}

/**
 * Update top order statistics
 */
function updateOrdersStats(orders) {
  const totalElem = document.getElementById("stat-total-orders");
  const customersElem = document.getElementById("stat-unique-customers");
  const latestElem = document.getElementById("stat-latest-time");

  if (totalElem) totalElem.textContent = orders.length;
  
  if (customersElem) {
    const unique = new Set(orders.map(o => (o.Customer_name || "").toLowerCase())).size;
    customersElem.textContent = unique;
  }

  if (latestElem) {
    if (orders.length > 0 && orders[0].created_at) {
      const date = new Date(orders[0].created_at);
      latestElem.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      latestElem.textContent = "None yet";
    }
  }
}

/**
 * Filter and render orders
 */
function renderOrders() {
  const container = document.getElementById("orders-container");
  if (!container) return;

  let filtered = [...allOrders];

  // Search filter
  if (currentSearch) {
    filtered = filtered.filter(o => {
      const name = (o.Customer_name || "").toLowerCase();
      const phone = String(o.Customer_Ph_No || "");
      const product = (o.Purchase_Product || "").toLowerCase();
      const address = (o.Customer_Address || "").toLowerCase();
      return name.includes(currentSearch) || phone.includes(currentSearch) || product.includes(currentSearch) || address.includes(currentSearch);
    });
  }

  // Sorting
  if (currentSort === "newest") {
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else if (currentSort === "oldest") {
    filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  } else if (currentSort === "name") {
    filtered.sort((a, b) => (a.Customer_name || "").localeCompare(b.Customer_name || ""));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">${allOrders.length === 0 ? "No orders placed yet" : "No matching orders found"}</h3>
        <p class="empty-desc">
          ${allOrders.length === 0 ? "When customers purchase products, they will automatically be recorded here in Supabase." : "Try adjusting your search query."}
        </p>
        <a href="index.html" class="btn btn-primary">
          <span>🛍️ Browse Store Catalog</span>
        </a>
      </div>
    `;
    return;
  }

  if (viewMode === "table") {
    container.innerHTML = renderOrdersTable(filtered);
  } else {
    container.innerHTML = renderOrdersCards(filtered);
  }

  // Attach Invoice buttons
  container.querySelectorAll(".btn-view-receipt").forEach(btn => {
    btn.addEventListener("click", () => {
      const custId = parseInt(btn.getAttribute("data-customer-id"));
      const order = allOrders.find(o => o.Customer_Id === custId);
      if (order) openInvoiceModal(order);
    });
  });

  // Attach Cancel Order buttons
  container.querySelectorAll(".btn-cancel-order").forEach(btn => {
    btn.addEventListener("click", async () => {
      const custId = parseInt(btn.getAttribute("data-customer-id"));
      const prodId = parseInt(btn.getAttribute("data-order-id"));
      if (confirm(`Are you sure you want to cancel order #${custId}? This will delete the order record from Supabase and make the product available again.`)) {
        await handleCancelOrder(custId, prodId);
      }
    });
  });
}

/**
 * Render Cards View
 */
function renderOrdersCards(orders) {
  return `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      ${orders.map(order => {
        const prod = allProductsMap[order.Order_ID] || {};
        const formattedDate = formatDate(order.created_at);
        const price = prod.Actual_Amount ? formatCurrency(prod.Actual_Amount) : "Paid";

        return `
          <div class="product-card" style="padding: 1.5rem; display: flex; flex-direction: row; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            ${prod.Image_url ? `
              <img src="${prod.Image_url}" alt="${escapeHtml(order.Purchase_Product)}" style="width: 100px; height: 100px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-subtle);" />
            ` : `
              <div style="width: 90px; height: 90px; border-radius: var(--radius-md); background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 2rem;">📦</div>
            `}

            <div style="flex: 1; min-width: 250px;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                <span class="order-id-badge">Order ID: #${order.Customer_Id}</span>
                <span class="status-pill confirmed">● Confirmed in Supabase</span>
                <span style="font-size: 0.82rem; color: var(--text-dim);">${formattedDate}</span>
              </div>

              <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 0.35rem;">
                ${escapeHtml(order.Purchase_Product)}
              </h3>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.88rem; color: var(--text-muted); margin-top: 0.6rem;">
                <div>
                  <strong style="color: var(--text-main);">👤 Customer:</strong> ${escapeHtml(order.Customer_name)}
                </div>
                <div>
                  <strong style="color: var(--text-main);">📞 Contact:</strong> 
                  <a href="tel:${order.Customer_Ph_No}" style="color: #38bdf8; text-decoration: none;">${order.Customer_Ph_No}</a>
                </div>
                <div style="grid-column: 1 / -1;">
                  <strong style="color: var(--text-main);">📍 Shipping Address:</strong> ${escapeHtml(order.Customer_Address)}
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.65rem; min-width: 150px;">
              <div style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--accent-emerald);">
                ${price}
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm btn-view-receipt" data-customer-id="${order.Customer_Id}">
                  <span>🧾 Invoice</span>
                </button>
                <button class="btn btn-danger btn-sm btn-cancel-order" data-customer-id="${order.Customer_Id}" data-order-id="${order.Order_ID}" title="Cancel & Delete Order">
                  <span>🗑️ Cancel</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/**
 * Render Table View
 */
function renderOrdersTable(orders) {
  return `
    <div class="orders-table-wrapper">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Contact</th>
            <th>Product Purchased</th>
            <th>Shipping Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>
                <span class="order-id-badge">#${o.Customer_Id}</span>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${formatDate(o.created_at)}</div>
              </td>
              <td>
                <strong style="color: #fff;">${escapeHtml(o.Customer_name)}</strong>
              </td>
              <td>
                <a href="tel:${o.Customer_Ph_No}" style="color: #38bdf8; text-decoration: none;">${o.Customer_Ph_No}</a>
              </td>
              <td>
                <span style="font-weight: 600; color: #fff;">${escapeHtml(o.Purchase_Product)}</span>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Product Ref #${o.Order_ID}</div>
              </td>
              <td style="max-width: 250px; font-size: 0.85rem; color: var(--text-muted);">
                ${escapeHtml(o.Customer_Address)}
              </td>
              <td>
                <span class="status-pill confirmed">● Verified</span>
              </td>
              <td>
                <div style="display: flex; gap: 0.4rem;">
                  <button class="btn btn-secondary btn-sm btn-view-receipt" data-customer-id="${o.Customer_Id}" title="View Receipt">
                    <span>🧾</span>
                  </button>
                  <button class="btn btn-danger btn-sm btn-cancel-order" data-customer-id="${o.Customer_Id}" data-order-id="${o.Order_ID}" title="Delete Order">
                    <span>🗑️</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Open Digital Invoice Modal
 */
function openInvoiceModal(order) {
  const modal = document.getElementById("invoice-modal");
  const content = document.getElementById("invoice-content");
  const prod = allProductsMap[order.Order_ID] || {};

  const original = prod.Order || 0;
  const discount = prod.Discount_amount || 0;
  const actual = prod.Actual_Amount || Math.max(0, original - discount);

  content.innerHTML = `
    <div style="border-bottom: 2px dashed var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; color: #fff;">
          AURA<span style="color: var(--primary);">LUXE</span>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-dim);">Direct Supabase Cloud Billing</div>
      </div>
      <div style="text-align: right;">
        <span class="order-id-badge">INVOICE #${order.Customer_Id}</span>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
          ${formatDate(order.created_at)}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; font-size: 0.88rem;">
      <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-weight: 700; color: #38bdf8; font-size: 0.78rem; text-transform: uppercase; margin-bottom: 0.4rem;">Billed To:</div>
        <div style="font-weight: 700; color: #fff; font-size: 1rem;">${escapeHtml(order.Customer_name)}</div>
        <div style="color: var(--text-muted);">Phone: ${order.Customer_Ph_No}</div>
        <div style="color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">${escapeHtml(order.Customer_Address)}</div>
      </div>

      <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-weight: 700; color: var(--accent-emerald); font-size: 0.78rem; text-transform: uppercase; margin-bottom: 0.4rem;">Order Status:</div>
        <div style="font-weight: 700; color: #fff; font-size: 1rem;">Payment Verified</div>
        <div style="color: var(--text-muted);">Database: Supabase Postgres</div>
        <div style="color: var(--text-muted); margin-top: 0.35rem;">Ref Product ID: #${order.Order_ID}</div>
      </div>
    </div>

    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
      <div style="font-weight: 700; color: #fff; font-size: 1.05rem; margin-bottom: 0.5rem;">
        ${escapeHtml(order.Purchase_Product)}
      </div>
      <div class="cost-row" style="padding: 0.4rem 0;">
        <span>Item Price</span>
        <span>${formatCurrency(original || actual)}</span>
      </div>
      ${discount > 0 ? `
        <div class="cost-row" style="padding: 0.4rem 0; color: var(--accent-rose);">
          <span>Promo Discount</span>
          <span>- ${formatCurrency(discount)}</span>
        </div>
      ` : ''}
      <div class="cost-row" style="padding: 0.4rem 0;">
        <span>Express Delivery</span>
        <span style="color: var(--accent-emerald);">FREE</span>
      </div>
      <div class="cost-row total-row" style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-top: 0.5rem; font-size: 1.15rem; color: #fff;">
        <span>Total Paid</span>
        <span style="color: var(--accent-emerald);">${formatCurrency(actual)}</span>
      </div>
    </div>

    <div style="text-align: center; font-size: 0.78rem; color: var(--text-dim); padding-top: 0.5rem;">
      Thank you for shopping with AURA LUXE. Order verified and registered in Supabase.
    </div>
  `;

  modal.classList.add("open");
}

/**
 * Handle canceling / deleting an order
 */
async function handleCancelOrder(customerId, productId) {
  try {
    const res = await deleteOrder(customerId, productId);
    if (!res.success) {
      showToast(`Failed to cancel order: ${res.error}`, "error");
      return;
    }

    showToast(`Order #${customerId} cancelled and deleted from Supabase. Product restored to catalog.`, "success");
    await loadOrdersData();
  } catch (err) {
    console.error("Cancel order error:", err);
    showToast("Error canceling order", "error");
  }
}

/**
 * HTML Escaper
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
