/* script.js
   Full interactive behaviour:
   - animated tabs -> slides
   - cart (add, qty update, remove, clear, checkout)
   - wishlist (preview on products slide + full wishlist slide)
   - track order (fake status)
   Notes: replace images/* files with your own assets.
*/

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const indicator = document.querySelector(".tab-indicator");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const productsGrid = document.getElementById("products-grid");
  const wishPreview = document.getElementById("wish-preview-items");
  const wishlistItemsEl = document.getElementById("wishlist-items");
  const badgeCart = document.getElementById("badge-cart");
  const badgeWish = document.getElementById("badge-wish");

  const cartListEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-items-count");
  const btnClear = document.getElementById("btn-clear");
  const btnCheckout = document.getElementById("btn-checkout");

  const modal = document.getElementById("modal");
  const modalOk = document.getElementById("modal-ok");

  const trackBtn = document.getElementById("btn-track");
  const trackStatus = document.getElementById("track-status");

  // Data
  let cart = [];      // { name, price, qty, img }
  let wishlist = [];  // { name, price, img }

  // utility to position indicator under active tab
  function updateIndicatorFor(btn) {
    if (!btn) return;
    const tabsRect = btn.parentElement.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - tabsRect.left + 8;
    const width = btnRect.width - 16;
    indicator.style.left = `${left}px`;
    indicator.style.width = `${Math.max(48, width)}px`;
  }

  // initial indicator
  const initialBtn = document.querySelector(".tab-btn.active");
  setTimeout(() => updateIndicatorFor(initialBtn), 50);

  // switch to slide index (1..5)
  function showSlide(index) {
    slides.forEach(s => s.classList.remove("active"));
    const slide = document.querySelector(`.slide[data-index="${index}"]`);
    if (slide) slide.classList.add("active");

    // update active tab class
    tabButtons.forEach(b => {
      if (String(b.dataset.slide) === String(index)) b.classList.add("active");
      else b.classList.remove("active");
    });
    // move indicator
    const activeBtn = document.querySelector(`.tab-btn[data-slide="${index}"]`);
    updateIndicatorFor(activeBtn);
  }

  // hook tab buttons
  tabButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const slideNum = Number(btn.dataset.slide);
      showSlide(slideNum);
    });
  });

  // buttons inside slides that navigate
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const to = Number(btn.dataset.goto);
      showSlide(to);
    });
  });

  // PRODUCT INTERACTIONS:
  // handle Add to Cart buttons & wishlist toggles using event delegation
  productsGrid.addEventListener("click", (ev) => {
    const addBtn = ev.target.closest(".add-cart");
    const wishBtn = ev.target.closest(".wish-toggle");
    const card = ev.target.closest(".product-card");
    if (!card) return;

    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const imgEl = card.querySelector("img");
    const imgSrc = imgEl ? imgEl.getAttribute("src") : "";

    if (addBtn) {
      const qty = Number(card.querySelector(".qty-input").value) || 1;
      addToCart({ name, price, qty, img: imgSrc });
      // visual feedback
      addBtn.textContent = "Added ✓";
      addBtn.disabled = true;
      setTimeout(() => { addBtn.textContent = "Add"; addBtn.disabled = false; }, 700);
    } else if (wishBtn) {
      toggleWishlist({ name, price, img: imgSrc }, wishBtn);
    }
  });

  // Add to cart logic — aggregates items by name
  function addToCart(item) {
    const existing = cart.find(c => c.name === item.name);
    if (existing) existing.qty += item.qty;
    else cart.push({ ...item });

    updateCartUI();
    // update badge
    badgeCart.textContent = cart.length;
  }

  function updateCartUI() {
    cartListEl.innerHTML = "";
    if (cart.length === 0) {
      cartListEl.innerHTML = `<li class="cart-empty">Your cart is empty</li>`;
      cartTotalEl.textContent = "₹0";
      cartCountEl.textContent = "0";
      badgeCart.textContent = "0";
      return;
    }

    let total = 0;
    cart.forEach((it, idx) => {
      const sub = it.price * it.qty;
      total += sub;

      const li = document.createElement("li");
      li.className = "cart-row";
      li.innerHTML = `
        <img src="${it.img}" alt="${it.name}" />
        <div class="info">
          <div><strong>${it.name}</strong></div>
          <div class="muted">₹${it.price} each</div>
        </div>
        <div class="controls">
          <input type="number" min="1" value="${it.qty}" data-idx="${idx}" class="cart-qty" style="width:72px;padding:6px;border-radius:8px;border:1px solid #e6e9ee;" />
          <div style="width:12px;"></div>
          <div><strong>₹${sub}</strong></div>
          <button class="btn ghost remove-item" data-idx="${idx}" style="margin-left:8px;">Remove</button>
        </div>
      `;
      cartListEl.appendChild(li);
    });

    cartTotalEl.textContent = `₹${total}`;
    cartCountEl.textContent = String(cart.reduce((s, i) => s + i.qty, 0));
    badgeCart.textContent = String(cart.length);

    // attach listeners for qty changes and removes
    Array.from(document.querySelectorAll(".cart-qty")).forEach(input => {
      input.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.idx);
        let v = Number(e.target.value);
        if (isNaN(v) || v < 1) v = 1;
        cart[idx].qty = v;
        updateCartUI();
      });
    });
    Array.from(document.querySelectorAll(".remove-item")).forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.target.dataset.idx);
        cart.splice(idx, 1);
        updateCartUI();
      });
    });
  }

  // Clear & Checkout
  btnClear.addEventListener("click", () => {
    if (!cart.length) return;
    if (confirm("Clear all items from cart?")) {
      cart = [];
      updateCartUI();
    }
  });

  btnCheckout.addEventListener("click", () => {
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }
    // fake order placement
    const orderId = `ORD${Date.now().toString().slice(-6)}`;
    showModal("Order placed!", `Your Order ID: ${orderId}\nWe will deliver soon.`);
    cart = [];
    updateCartUI();
  });

  // Wishlist functions
  function toggleWishlist(item, btnEl) {
    const idx = wishlist.findIndex(w => w.name === item.name);
    if (idx >= 0) {
      wishlist.splice(idx, 1);
      if (btnEl) btnEl.classList.remove("active");
    } else {
      wishlist.push(item);
      if (btnEl) btnEl.classList.add("active");
    }
    updateWishUI();
  }

  function updateWishUI() {
    // preview (top of products slide)
    wishPreview.innerHTML = "";
    if (wishlist.length === 0) {
      wishPreview.innerHTML = `<div class="wish-empty">No items in wishlist</div>`;
    } else {
      wishlist.forEach(it => {
        const node = document.createElement("div");
        node.className = "wish-preview-item";
        node.innerHTML = `<img src="${it.img}" alt="${it.name}" style="width:100%;height:100%;object-fit:cover;">`;
        // click preview to go to wishlist slide
        node.addEventListener("click", () => showSlide(4));
        wishPreview.appendChild(node);
      });
    }

    // full wishlist slide
    wishlistItemsEl.innerHTML = "";
    if (wishlist.length === 0) {
      wishlistItemsEl.innerHTML = `<li class="wish-empty">No wishlist items yet — add some from Products</li>`;
    } else {
      wishlist.forEach((it, idx) => {
        const li = document.createElement("li");
        li.className = "wish-item";
        li.innerHTML = `
          <img src="${it.img}" alt="${it.name}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;">
          <div><strong>${it.name}</strong></div>
          <div class="muted">₹${it.price}</div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn primary wish-add-to-cart" data-idx="${idx}">Add to Cart</button>
            <button class="btn ghost wish-remove" data-idx="${idx}">Remove</button>
          </div>
        `;
        wishlistItemsEl.appendChild(li);
      });

      // attach listeners for wishlist actions
      Array.from(document.querySelectorAll(".wish-add-to-cart")).forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = Number(e.target.dataset.idx);
          const it = wishlist[idx];
          addToCart({ name: it.name, price: it.price, qty: 1, img: it.img });
          // optionally remove from wishlist after adding
        });
      });
      Array.from(document.querySelectorAll(".wish-remove")).forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = Number(e.target.dataset.idx);
          wishlist.splice(idx, 1);
          updateWishUI();
        });
      });
    }

    badgeWish.textContent = String(wishlist.length);
  }

  // modal helpers
  function showModal(title, msg) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-msg").textContent = msg;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  modalOk.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  });

  // Track order (fake)
  trackBtn.addEventListener("click", () => {
    const id = document.getElementById("trackId").value.trim();
    if (!id) {
      trackStatus.textContent = "Please enter a valid Order ID.";
      trackStatus.style.color = "#cc0000";
      return;
    }
    // simple fake progression
    trackStatus.style.color = "#222";
    trackStatus.textContent = "Checking order status...";
    setTimeout(() => {
      trackStatus.textContent = `Order ${id} — Out for delivery 🚚 (ETA: 30-60 min)`;
    }, 900);
  });

  // initialize product cards: wire up existing wish state and add-cart for keyboard enter
  function initProductCards() {
    // when page loads if wishlist contains a name, toggle heart active (not persistent here)
    document.querySelectorAll(".product-card").forEach(card => {
      const name = card.dataset.name;
      const wishBtn = card.querySelector(".wish-toggle");
      const addBtn = card.querySelector(".add-cart");
      addBtn.addEventListener("keydown", (e) => { if (e.key === "Enter") addBtn.click(); });
      // clicking heart toggles wishlist visually is handled by delegated handler above,
      // but keep a small keyboard access
      wishBtn.addEventListener("keydown", (e) => { if (e.key === "Enter") wishBtn.click(); });
    });
  }
  initProductCards();

  // make tab indicator responsive on resize
  window.addEventListener("resize", () => {
    const activeBtn = document.querySelector(".tab-btn.active");
    updateIndicatorFor(activeBtn);
  });

  // Set initial year in footer
  document.getElementById("year").textContent = new Date().getFullYear();

  // showSlide default (1)
  showSlide(1);

  // small helper: if user toggles wishlist from product card, keep UI in sync
  // observe mutations to wishlist to toggle heart button active state
  const updateHearts = () => {
    const names = new Set(wishlist.map(w => w.name));
    document.querySelectorAll(".product-card").forEach(card => {
      const name = card.dataset.name;
      const heart = card.querySelector(".wish-toggle");
      if (names.has(name)) heart.classList.add("active"), heart.textContent = "♥";
      else heart.classList.remove("active"), heart.textContent = "♡";
    });
  };

  // override toggleWishlist to update hearts after mutating
  const originalToggleWishlist = toggleWishlist;
  toggleWishlist = function(item, btnEl) {
    originalToggleWishlist(item, btnEl);
    updateHearts();
  };

  // ensure badges initial
  updateCartUI();
  updateWishUI();

});
