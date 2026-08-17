/*
 * URBAN YUVA — SHARED WEBSITE FUNCTIONALITY
 * ------------------------------------------------------------
 * This file powers the menu, product cards, filters, wishlist,
 * cart, checkout and small form interactions across every page.
 * No library is required.
 */

/* Replace these three placeholder details before publishing the store. */
const STORE_CONFIG = {
  whatsapp: "919999999999", // Country code + number, with no spaces or + sign
  email: "hello@urbanyuva.in",
  upiId: "urbanyuva@upi"
};

const STORAGE_KEYS = {
  cart: "urbanYuvaCart",
  wishlist: "urbanYuvaWishlist",
  coupon: "urbanYuvaCoupon"
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    showToast("Your browser could not save this change.");
  }
}

function getCart() {
  return readStorage(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
  writeStorage(STORAGE_KEYS.cart, cart);
  updateCartCount();
}

function getWishlist() {
  return readStorage(STORAGE_KEYS.wishlist, []);
}

function findProduct(id) {
  return PRODUCTS.find((product) => product.id === Number(id));
}

function showToast(message) {
  let toast = qs("#site-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  qsa("[data-cart-count]").forEach((element) => {
    element.textContent = count;
    element.setAttribute("aria-label", `${count} items in cart`);
  });
}

function addToCart(productId, size, quantity = 1) {
  const product = findProduct(productId);
  if (!product) return;

  const selectedSize = size || product.sizes[0];
  const cart = getCart();
  const existingItem = cart.find(
    (item) => item.id === product.id && item.size === selectedSize
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.push({ id: product.id, size: selectedSize, quantity: Number(quantity) });
  }

  saveCart(cart);
  showToast(`${product.name} added to your cart.`);
}

function toggleWishlist(productId, button) {
  const id = Number(productId);
  const wishlist = getWishlist();
  const index = wishlist.indexOf(id);
  const product = findProduct(id);

  if (index >= 0) {
    wishlist.splice(index, 1);
    showToast(`${product.name} removed from wishlist.`);
  } else {
    wishlist.push(id);
    showToast(`${product.name} saved to wishlist.`);
  }

  writeStorage(STORAGE_KEYS.wishlist, wishlist);
  syncWishlistButtons();
  document.dispatchEvent(new CustomEvent("wishlistchange"));
  if (button) button.focus();
}

function syncWishlistButtons() {
  const wishlist = getWishlist();
  qsa("[data-wishlist]").forEach((button) => {
    const isSaved = wishlist.includes(Number(button.dataset.wishlist));
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", isSaved ? "Remove from wishlist" : "Add to wishlist");
    button.textContent = isSaved ? "♥" : "♡";
  });
}

function productCard(product) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return `
    <article class="product-card">
      <div class="product-card__media">
        <a href="product.html?id=${product.id}" aria-label="View ${product.name}">
          <img src="${product.image}" alt="${product.alt}" loading="lazy" width="720" height="900">
        </a>
        <span class="product-badge">${product.badge}</span>
        <button class="wishlist-button" type="button" data-wishlist="${product.id}" aria-label="Add ${product.name} to wishlist" aria-pressed="false">♡</button>
        <button class="quick-add" type="button" data-quick-add="${product.id}">Quick add</button>
      </div>
      <div class="product-card__body">
        <p class="product-card__category">${product.category}</p>
        <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
        <div class="product-card__price">
          <strong>${formatPrice(product.price)}</strong>
          <s>${formatPrice(product.originalPrice)}</s>
          <span>${discount}% off</span>
        </div>
      </div>
    </article>
  `;
}

function initNavigation() {
  const menuButton = qs("[data-menu-button]");
  const navigation = qs("[data-navigation]");
  if (!menuButton || !navigation) return;

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  qsa("a", navigation).forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 900) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    }
  });
}

function initGlobalElements() {
  qsa("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  qsa("[data-whatsapp-link]").forEach((link) => {
    const message = encodeURIComponent("Hi Urban Yuva! I need help with my order.");
    link.href = `https://wa.me/${STORE_CONFIG.whatsapp}?text=${message}`;
  });

  document.addEventListener("click", (event) => {
    const quickAddButton = event.target.closest("[data-quick-add]");
    if (quickAddButton) addToCart(quickAddButton.dataset.quickAdd);

    const wishlistButton = event.target.closest("[data-wishlist]");
    if (wishlistButton) toggleWishlist(wishlistButton.dataset.wishlist, wishlistButton);
  });

  updateCartCount();
  syncWishlistButtons();
}

function renderFeaturedProducts() {
  const container = qs("[data-featured-products]");
  if (!container) return;
  container.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
  syncWishlistButtons();
}

function initShop() {
  const productGrid = qs("[data-shop-grid]");
  if (!productGrid) return;

  const filterButtons = qsa("[data-category-filter]");
  const sortSelect = qs("[data-sort-products]");
  const searchInput = qs("[data-product-search]");
  const resultsText = qs("[data-results-count]");
  const categoryFromUrl = new URLSearchParams(window.location.search).get("category");
  const savedFromUrl = new URLSearchParams(window.location.search).get("saved");
  let activeCategory = savedFromUrl === "1" ? "Saved" : (categoryFromUrl || "All");

  function render() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const wishlist = getWishlist();
    let visibleProducts = PRODUCTS.filter((product) => {
      const matchesCategory = activeCategory === "All"
        || (activeCategory === "Saved" ? wishlist.includes(product.id) : product.category === activeCategory);
      const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

    if (sortSelect.value === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
    if (sortSelect.value === "rating") visibleProducts.sort((a, b) => b.rating - a.rating);

    productGrid.innerHTML = visibleProducts.length
      ? visibleProducts.map(productCard).join("")
      : `<div class="empty-state full-width"><p class="eyebrow">No matches</p><h2>Try another search</h2><p>Clear a filter to see more Urban Yuva styles.</p></div>`;

    resultsText.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "style" : "styles"}`;
    filterButtons.forEach((button) => {
      const isActive = button.dataset.categoryFilter === activeCategory;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    syncWishlistButtons();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.categoryFilter;
      render();
    });
  });

  sortSelect.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  document.addEventListener("wishlistchange", () => {
    if (activeCategory === "Saved") render();
  });
  render();
}

function initProductPage() {
  const container = qs("[data-product-detail]");
  if (!container) return;

  const productId = new URLSearchParams(window.location.search).get("id") || 1;
  const product = findProduct(productId);

  if (!product) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <p class="eyebrow">Product not found</p>
        <h1>This style may have moved.</h1>
        <a class="button button--dark" href="shop.html">Back to shop</a>
      </div>`;
    return;
  }

  document.title = `${product.name} | Urban Yuva`;
  const descriptionTag = qs('meta[name="description"]');
  if (descriptionTag) descriptionTag.content = `${product.name} by Urban Yuva. ${product.shortDescription} Shop online in India.`;

  container.innerHTML = `
    <div class="product-detail__media">
      <span class="product-badge">${product.badge}</span>
      <img src="${product.image}" alt="${product.alt}" width="900" height="1125">
    </div>
    <div class="product-detail__content">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><span>${product.name}</span>
      </nav>
      <p class="eyebrow">${product.category}</p>
      <h1>${product.name}</h1>
      <div class="rating-line" aria-label="Rated ${product.rating} out of 5 from ${product.reviews} reviews">
        <span aria-hidden="true">★★★★★</span> ${product.rating} · ${product.reviews} reviews
      </div>
      <div class="product-detail__price">
        <strong>${formatPrice(product.price)}</strong>
        <s>${formatPrice(product.originalPrice)}</s>
        <span>Inclusive of all taxes</span>
      </div>
      <p class="product-lead">${product.description}</p>
      <form data-product-form>
        <fieldset class="option-group">
          <legend>Choose size <a href="size-guide.html">Size guide</a></legend>
          <div class="size-options">
            ${product.sizes.map((size, index) => `
              <label>
                <input type="radio" name="size" value="${size}" ${index === 0 ? "checked" : ""}>
                <span>${size}</span>
              </label>`).join("")}
          </div>
        </fieldset>
        <p class="colour-line"><strong>Colour:</strong> ${product.colors.join(" / ")}</p>
        <div class="product-actions">
          <label class="quantity-field">Qty
            <select name="quantity" aria-label="Quantity">
              <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
            </select>
          </label>
          <button class="button button--dark button--wide" type="submit">Add to cart</button>
          <button class="button button--icon" type="button" data-wishlist="${product.id}" aria-label="Add to wishlist">♡</button>
        </div>
      </form>
      <ul class="feature-list">
        ${product.features.map((feature) => `<li>${feature}</li>`).join("")}
      </ul>
      <div class="delivery-note">
        <strong>Free delivery over ₹999</strong>
        <span>Easy 7-day returns · Cash on Delivery available</span>
      </div>
    </div>`;

  qs("[data-product-form]", container).addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    addToCart(product.id, formData.get("size"), formData.get("quantity"));
  });

  const relatedContainer = qs("[data-related-products]");
  if (relatedContainer) {
    relatedContainer.innerHTML = PRODUCTS.filter((item) => item.id !== product.id).slice(0, 4).map(productCard).join("");
  }
  syncWishlistButtons();
}

function getCartTotals(cart = getCart()) {
  const subtotal = cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const hasCoupon = readStorage(STORAGE_KEYS.coupon, "") === "CAMPUS10";
  const discount = hasCoupon ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, hasCoupon };
}

function initCartPage() {
  const itemsContainer = qs("[data-cart-items]");
  const summaryContainer = qs("[data-cart-summary]");
  if (!itemsContainer || !summaryContainer) return;

  function renderCart() {
    const cart = getCart().filter((item) => findProduct(item.id));
    const totals = getCartTotals(cart);

    if (!cart.length) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <p class="eyebrow">Your cart is empty</p>
          <h2>Your next fit is waiting.</h2>
          <p>Explore the first Urban Yuva drop and find your everyday uniform.</p>
          <a class="button button--dark" href="shop.html">Shop the drop</a>
        </div>`;
      summaryContainer.innerHTML = "";
      return;
    }

    itemsContainer.innerHTML = cart.map((item, index) => {
      const product = findProduct(item.id);
      return `
        <article class="cart-item">
          <a class="cart-item__image" href="product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.alt}" width="240" height="300">
          </a>
          <div class="cart-item__content">
            <p class="product-card__category">${product.category}</p>
            <h2><a href="product.html?id=${product.id}">${product.name}</a></h2>
            <p>Size: <strong>${item.size}</strong></p>
            <p class="cart-item__price">${formatPrice(product.price)}</p>
            <div class="cart-item__controls">
              <label>Qty
                <select data-cart-quantity="${index}" aria-label="Quantity for ${product.name}">
                  ${[1, 2, 3, 4, 5].map((quantity) => `<option value="${quantity}" ${quantity === item.quantity ? "selected" : ""}>${quantity}</option>`).join("")}
                </select>
              </label>
              <button class="text-button" type="button" data-remove-cart-item="${index}">Remove</button>
            </div>
          </div>
        </article>`;
    }).join("");

    summaryContainer.innerHTML = `
      <div class="order-summary">
        <p class="eyebrow">Order summary</p>
        <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(totals.subtotal)}</strong></div>
        <div class="summary-row"><span>Discount</span><strong>−${formatPrice(totals.discount)}</strong></div>
        <div class="summary-row"><span>Shipping</span><strong>${totals.shipping ? formatPrice(totals.shipping) : "Free"}</strong></div>
        <div class="summary-row summary-row--total"><span>Total</span><strong>${formatPrice(totals.total)}</strong></div>
        <form class="coupon-form" data-coupon-form>
          <label for="coupon">Coupon code</label>
          <div><input id="coupon" name="coupon" placeholder="Try CAMPUS10" value="${totals.hasCoupon ? "CAMPUS10" : ""}"><button class="button button--outline" type="submit">Apply</button></div>
          <small data-coupon-message>${totals.hasCoupon ? "CAMPUS10 applied — you saved 10%." : "Use CAMPUS10 for 10% off."}</small>
        </form>
        <a class="button button--dark button--wide" href="checkout.html">Continue to checkout</a>
        <p class="secure-note">Cash on Delivery and UPI available</p>
      </div>`;

    qsa("[data-cart-quantity]", itemsContainer).forEach((select) => {
      select.addEventListener("change", () => {
        const updatedCart = getCart();
        updatedCart[Number(select.dataset.cartQuantity)].quantity = Number(select.value);
        saveCart(updatedCart);
        renderCart();
      });
    });

    qsa("[data-remove-cart-item]", itemsContainer).forEach((button) => {
      button.addEventListener("click", () => {
        const updatedCart = getCart();
        const removedItem = updatedCart.splice(Number(button.dataset.removeCartItem), 1)[0];
        saveCart(updatedCart);
        showToast(`${findProduct(removedItem.id).name} removed from cart.`);
        renderCart();
      });
    });

    qs("[data-coupon-form]", summaryContainer).addEventListener("submit", (event) => {
      event.preventDefault();
      const code = new FormData(event.currentTarget).get("coupon").trim().toUpperCase();
      if (code === "CAMPUS10") {
        writeStorage(STORAGE_KEYS.coupon, "CAMPUS10");
        showToast("CAMPUS10 applied. You saved 10%!");
        renderCart();
      } else {
        qs("[data-coupon-message]", summaryContainer).textContent = "That code is not valid. Try CAMPUS10.";
      }
    });
  }

  renderCart();
}

function checkoutSummaryMarkup(cart, totals) {
  return `
    <div class="checkout-products">
      ${cart.map((item) => {
        const product = findProduct(item.id);
        return `<div class="checkout-product">
          <img src="${product.image}" alt="${product.alt}" width="72" height="90">
          <div><strong>${product.name}</strong><span>Size ${item.size} · Qty ${item.quantity}</span></div>
          <strong>${formatPrice(product.price * item.quantity)}</strong>
        </div>`;
      }).join("")}
    </div>
    <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(totals.subtotal)}</strong></div>
    <div class="summary-row"><span>Discount</span><strong>−${formatPrice(totals.discount)}</strong></div>
    <div class="summary-row"><span>Shipping</span><strong>${totals.shipping ? formatPrice(totals.shipping) : "Free"}</strong></div>
    <div class="summary-row summary-row--total"><span>Total</span><strong>${formatPrice(totals.total)}</strong></div>`;
}

function initCheckoutPage() {
  const form = qs("[data-checkout-form]");
  const summary = qs("[data-checkout-summary]");
  if (!form || !summary) return;

  const cart = getCart().filter((item) => findProduct(item.id));
  const totals = getCartTotals(cart);
  const submitButton = qs('[type="submit"]', form);

  if (!cart.length) {
    summary.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2><a class="button button--dark" href="shop.html">Go to shop</a></div>`;
    submitButton.disabled = true;
  } else {
    summary.innerHTML = checkoutSummaryMarkup(cart, totals);
  }

  qsa("[data-upi-id]").forEach((element) => element.textContent = STORE_CONFIG.upiId);
  const upiPaymentLink = qs("[data-upi-payment-link]");
  if (upiPaymentLink) {
    upiPaymentLink.href = `upi://pay?pa=${encodeURIComponent(STORE_CONFIG.upiId)}&pn=${encodeURIComponent("Urban Yuva")}&am=${totals.total}&cu=INR`;
  }

  function toggleUpiSection() {
    const paymentMethod = qs('input[name="paymentMethod"]:checked', form)?.value;
    const upiSection = qs("[data-upi-section]");
    upiSection.hidden = paymentMethod !== "UPI / Online Payment";
  }

  qsa('input[name="paymentMethod"]', form).forEach((radio) => radio.addEventListener("change", toggleUpiSection));
  toggleUpiSection();

  const copyButton = qs("[data-copy-upi]");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(STORE_CONFIG.upiId);
        showToast("UPI ID copied.");
      } catch (error) {
        showToast(`UPI ID: ${STORE_CONFIG.upiId}`);
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity() || !cart.length) return;

    const details = new FormData(form);
    const orderLines = cart.map((item) => {
      const product = findProduct(item.id);
      return `• ${product.name} — Size ${item.size} × ${item.quantity} (${formatPrice(product.price * item.quantity)})`;
    }).join("\n");

    const message = [
      "Hi Urban Yuva! I would like to place this order:",
      "",
      orderLines,
      "",
      `Subtotal: ${formatPrice(totals.subtotal)}`,
      totals.discount ? `Discount: -${formatPrice(totals.discount)}` : "",
      `Shipping: ${totals.shipping ? formatPrice(totals.shipping) : "Free"}`,
      `Total: ${formatPrice(totals.total)}`,
      "",
      `Name: ${details.get("name")}`,
      `Phone: ${details.get("phone")}`,
      `Address: ${details.get("address")}, ${details.get("city")} - ${details.get("pincode")}`,
      `Payment: ${details.get("paymentMethod")}`,
      details.get("note") ? `Note: ${details.get("note")}` : ""
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    showToast("Opening WhatsApp with your order details…");
  });
}

function initContactForm() {
  const form = qs("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const details = new FormData(form);
    const message = `Hi Urban Yuva!\n\nName: ${details.get("name")}\nEmail: ${details.get("email")}\n\n${details.get("message")}`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    showToast("Opening WhatsApp with your message…");
  });
}

function initTrackingForm() {
  const form = qs("[data-tracking-form]");
  const result = qs("[data-tracking-result]");
  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const orderId = new FormData(form).get("orderId").trim().toUpperCase();
    result.hidden = false;
    result.innerHTML = `
      <p class="eyebrow">Order ${orderId}</p>
      <h2>We’re checking this order</h2>
      <p>This demo tracker is ready to connect to your delivery partner. Until then, send us the order ID on WhatsApp for a live update.</p>
      <a class="button button--dark" data-whatsapp-link target="_blank" rel="noopener" href="https://wa.me/${STORE_CONFIG.whatsapp}?text=${encodeURIComponent(`Hi Urban Yuva! Please share an update for order ${orderId}.`)}">Check on WhatsApp</a>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initGlobalElements();
  renderFeaturedProducts();
  initShop();
  initProductPage();
  initCartPage();
  initCheckoutPage();
  initContactForm();
  initTrackingForm();
});
