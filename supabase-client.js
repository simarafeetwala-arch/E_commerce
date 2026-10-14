// Supabase Configuration and API Helper
const SUPABASE_URL = "https://utzzymmcfxanfzpiverr.supabase.co";
const SUPABASE_KEY = "sb_publishable_XZc-B9W9iTlJpIsxGPXLng_SWKlYICx";

// Initialize Supabase Client using global supabase object from CDN
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// REST fallback headers if needed
const REST_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

/**
 * Fetch all products from public.Product
 */
async function fetchProducts() {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('Product')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return { success: true, data };
    } else {
      // Direct REST fallback
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Product?select=*&order=id.asc`, {
        headers: REST_HEADERS
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return { success: true, data };
    }
  } catch (err) {
    console.error("fetchProducts error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Insert a new product into public.Product
 */
async function insertProduct(product) {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('Product')
        .insert([product])
        .select();
      if (error) throw error;
      return { success: true, data: data[0] };
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Product`, {
        method: "POST",
        headers: { ...REST_HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return { success: true, data: data[0] };
    }
  } catch (err) {
    console.error("insertProduct error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Update product availability status
 */
async function updateProductAvailability(productId, isAvailable) {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('Product')
        .update({ Is_available: isAvailable })
        .eq('id', productId)
        .select();
      if (error) throw error;
      return { success: true, data };
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Product?id=eq.${productId}`, {
        method: "PATCH",
        headers: { ...REST_HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify({ Is_available: isAvailable })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return { success: true };
    }
  } catch (err) {
    console.error("updateProductAvailability error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Fetch all orders from public.Order
 */
async function fetchOrders() {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('Order')
        .select('*')
        .order('Customer_Id', { ascending: false });
      if (error) throw error;
      return { success: true, data };
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Order?select=*&order=Customer_Id.desc`, {
        headers: REST_HEADERS
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return { success: true, data };
    }
  } catch (err) {
    console.error("fetchOrders error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Create a new order in public.Order
 * Note: schema specifies:
 * - Order_ID (Product ID, unique reference)
 * - Customer_name
 * - Customer_Ph_No
 * - Purchase_Product
 * - Customer_Address
 */
async function createOrder(orderPayload) {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('Order')
        .insert([orderPayload])
        .select();
      if (error) throw error;
      return { success: true, data: data[0] };
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Order`, {
        method: "POST",
        headers: { ...REST_HEADERS, "Prefer": "return=representation" },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data = await res.json();
      return { success: true, data: data[0] };
    }
  } catch (err) {
    console.error("createOrder error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Delete an order by Customer_Id and restore product availability if needed
 */
async function deleteOrder(customerId, productId = null) {
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('Order')
        .delete()
        .eq('Customer_Id', customerId);
      if (error) throw error;
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Order?Customer_Id=eq.${customerId}`, {
        method: "DELETE",
        headers: REST_HEADERS
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    // If productId is provided, restore product availability
    if (productId) {
      await updateProductAvailability(productId, true);
    }

    return { success: true };
  } catch (err) {
    console.error("deleteOrder error:", err);
    return { success: false, error: err.message || err };
  }
}

/**
 * UI Toast Notification System
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "✨";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";
  if (type === "warning") icon = "🔔";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

/**
 * Update the badge in header with current order count
 */
async function updateOrdersBadge() {
  const badge = document.getElementById("orders-badge");
  if (!badge) return;
  const res = await fetchOrders();
  if (res.success && res.data) {
    badge.textContent = res.data.length;
    badge.style.display = res.data.length > 0 ? "inline-flex" : "none";
  }
}

// Global formatters
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (isoDate) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};
