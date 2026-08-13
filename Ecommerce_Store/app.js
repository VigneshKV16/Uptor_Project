// ==========================================================================
// Application State
// ==========================================================================
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// DOM Elements
const appContainer = document.getElementById("app-container");
const cartCountEl = document.getElementById("cart-count");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const navLinks = document.getElementById("nav-links");

// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Toggle mobile menu
mobileMenuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// ==========================================================================
// Core Functions
// ==========================================================================

async function initApp() {
  await fetchProducts();
  updateCartCount();
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

async function fetchProducts() {
  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error("Failed to load products");
    products = await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    appContainer.innerHTML = `<div class="container" style="padding: var(--spacing-xxl) 0; text-align: center;"><h2>Failed to load products. Please try again later.</h2></div>`;
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();

  const btn = event.target;
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = "Added!";
    btn.style.background = "#e2e8f0"; // Green flat
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 1500);
  }
}

function updateQuantity(productId, delta) {
  const itemIndex = cart.findIndex((item) => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    renderCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
}

// ==========================================================================
// Routing
// ==========================================================================
function handleRoute() {
  const hash = window.location.hash || "#/";
  navLinks.classList.remove("active");
  window.scrollTo(0, 0);
  appContainer.innerHTML = "";

  if (hash === "#/") {
    renderHome();
  } else if (hash === "#/products") {
    renderProducts();
  } else if (hash.startsWith("#/product/")) {
    const id = parseInt(hash.split("/")[2]);
    renderProduct(id);
  } else if (hash === "#/cart") {
    renderCart();
  } else if (hash === "#/checkout") {
    renderCheckout();
  } else {
    renderHome();
  }
}

// ==========================================================================
// Views
// ==========================================================================

function renderHome() {
  const featuredProducts = products.slice(0, 4);

  let html = `
        <div class="hero-slider-container">
            <div class="hero-slider-track" id="hero-slider-track">
                <a href="#/product/1" class="hero-slide active">
                    <img src="images/banner_1.jpg" alt="Featured Product 1">
                </a>
                <a href="#/product/8" class="hero-slide">
                    <img src="images/banner_2.jpg" alt="Featured Product 8">
                </a>
                <a href="#/product/15" class="hero-slide">
                    <img src="images/banner_3.jpg" alt="Featured Product 15">
                </a>
            </div>
            
            <button class="slider-btn prev-btn" id="slider-prev" aria-label="Previous slide">&#10094;</button>
            <button class="slider-btn next-btn" id="slider-next" aria-label="Next slide">&#10095;</button>
            
            <div class="slider-dots" id="slider-dots">
                <span class="dot active" data-index="0"></span>
                <span class="dot" data-index="1"></span>
                <span class="dot" data-index="2"></span>
            </div>
        </div>

        <section class="hero">
            <div class="container">
                <h1>Welcome to Mega Mart</h1>
                <p>Discover the latest and greatest in consumer electronics. Top brands, best prices, all in one place.</p>
                <a href="#/products" class="btn btn-primary" style="font-size: 1.1rem;">Shop All Electronics</a>
            </div>
        </section>
        
        <section class="products-section container">
            <h2 class="section-title">Featured Products</h2>
            <div class="products-grid">
                ${featuredProducts.map(createProductCard).join("")}
            </div>
            <div style="text-align: center; margin-top: var(--spacing-xl);">
                <a href="#/products" class="btn btn-outline">View All Products</a>
            </div>
        </section>
    `;

  appContainer.innerHTML = html;
  initSlider();
}

let sliderInterval;

function initSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.getElementById("slider-prev");
  const nextBtn = document.getElementById("slider-next");

  if (slides.length === 0) return;

  let currentIndex = 0;

  function goToSlide(index) {
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));

    currentIndex = index;
    if (currentIndex < 0) currentIndex = slides.length - 1;
    if (currentIndex >= slides.length) currentIndex = 0;

    slides[currentIndex].classList.add("active");
    dots[currentIndex].classList.add("active");
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      prevSlide();
      resetInterval();
    });

  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      nextSlide();
      resetInterval();
    });

  dots.forEach((dot) => {
    dot.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      goToSlide(idx);
      resetInterval();
    });
  });

  function startInterval() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 5000);
  }

  function resetInterval() {
    startInterval();
  }

  startInterval();
}

function renderProducts() {
  let currentCategory = "All";
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const viewContainer = document.createElement("div");
  viewContainer.className = "container products-section";

  const title = document.createElement("h1");
  title.className = "section-title";
  title.textContent = "All Products";
  viewContainer.appendChild(title);

  const filtersContainer = document.createElement("div");
  filtersContainer.className = "filters-container";

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${cat === currentCategory ? "active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = cat;
      renderGrid();
    });
    filtersContainer.appendChild(btn);
  });
  viewContainer.appendChild(filtersContainer);

  const grid = document.createElement("div");
  grid.className = "products-grid";
  viewContainer.appendChild(grid);

  appContainer.appendChild(viewContainer);

  function renderGrid() {
    const filteredProducts =
      currentCategory === "All"
        ? products
        : products.filter((p) => p.category === currentCategory);

    grid.innerHTML = filteredProducts.map(createProductCard).join("");
  }

  renderGrid();
}

// Global function to handle image switching in the gallery
window.switchMainImage = function (src, el) {
  const mainImg = document.getElementById("main-product-image");
  mainImg.src = src;

  // Update active thumbnail
  document
    .querySelectorAll(".thumbnail")
    .forEach((thumb) => thumb.classList.remove("active"));
  el.classList.add("active");
};

function renderProduct(id) {
  const product = products.find((p) => p.id === id);

  if (!product) {
    appContainer.innerHTML = `<div class="container" style="padding: var(--spacing-xxl) 0; text-align: center;"><h2>Product not found.</h2><a href="#/products" class="btn btn-primary" style="margin-top: 1rem;">Back to Shop</a></div>`;
    return;
  }

  // Check if we have multiple images, fallback if not
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];
  const mainImage = images[0];

  const thumbnailsHtml = images
    .map(
      (imgSrc, index) => `
        <div class="thumbnail ${index === 0 ? "active" : ""}" onclick="switchMainImage('${imgSrc}', this)">
            <img src="${imgSrc}" alt="Thumbnail ${index + 1}">
        </div>
    `,
    )
    .join("");

  const featuresHtml =
    product.features && product.features.length > 0
      ? product.features.map((f) => `<li>${f}</li>`).join("")
      : "<li>No specific features listed.</li>";

  const html = `
        <div class="container single-product">
            <div class="single-product-gallery">
                <div class="main-image-container">
                    <img id="main-product-image" src="${mainImage}" alt="${product.name}">
                </div>
                <div class="thumbnail-container">
                    ${thumbnailsHtml}
                </div>
            </div>
            
            <div class="single-product-details">
                <div class="product-category" style="font-size: 1rem; margin-bottom: 0.5rem;">${product.category}</div>
                <h1>${product.name}</h1>
                <div class="single-product-price">₹${product.price.toFixed(2)}</div>
                
                <div class="single-product-features">
                    <h3>Key Features</h3>
                    <ul>
                        ${featuresHtml}
                    </ul>
                </div>
                
                <p class="single-product-desc">${product.description}</p>
                
                <button class="btn btn-primary btn-block" style="padding: 1rem; font-size: 1.1rem;" onclick="addToCart(${product.id})">Add to Cart</button>
                <a href="#/products" style="display: inline-block; margin-top: 2rem; color: var(--text-secondary); text-decoration: underline;">&larr; Back to Products</a>
            </div>
        </div>
    `;

  appContainer.innerHTML = html;
}

function renderCart() {
  const viewContainer = document.createElement("div");
  viewContainer.className = "container cart-page";

  const title = document.createElement("h1");
  title.className = "section-title";
  title.textContent = "Shopping Cart";
  title.style.textAlign = "left";
  viewContainer.appendChild(title);

  if (cart.length === 0) {
    viewContainer.innerHTML += `
            <div class="empty-cart">
                <h2 style="margin-bottom: 1rem;">Your cart is empty</h2>
                <a href="#/products" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
    appContainer.appendChild(viewContainer);
    return;
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  const layout = document.createElement("div");
  layout.className = "cart-layout";

  const itemsHtml = cart
    .map((item) => {
      const img =
        item.images && item.images.length > 0 ? item.images[0] : item.image;
      return `
            <div class="cart-item">
                <img src="${img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title"><a href="#/product/${item.id}">${item.name}</a></div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span style="width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div style="font-weight: 700; width: 80px; text-align: right;">
                    ₹${(item.price * item.quantity).toFixed(2)}
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})" aria-label="Remove item">
                    Remove
                </button>
            </div>
        `;
    })
    .join("");

  const summaryHtml = `
        <div class="cart-summary">
            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? "Free" : "₹" + shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
            <a href="#/checkout" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">Proceed to Checkout</a>
        </div>
    `;

  layout.innerHTML = `
        <div class="cart-items">
            ${itemsHtml}
        </div>
        ${summaryHtml}
    `;

  viewContainer.appendChild(layout);
  appContainer.appendChild(viewContainer);
}

function renderCheckout() {
  if (cart.length === 0) {
    window.location.hash = "#/cart";
    return;
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  const html = `
        <div class="container checkout-page">
            <h1 class="section-title">Checkout</h1>
            
            <form id="checkout-form">
                <div style="background: var(--bg-surface); padding: var(--spacing-xl); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: var(--spacing-xl);">
                    <h2 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Shipping Information</h2>
                    
                    <div class="form-group">
                        <label class="form-label" for="fullName">Full Name</label>
                        <input type="text" id="fullName" class="form-input" required placeholder="John Doe">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <input type="email" id="email" class="form-input" required placeholder="john@example.com">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="address">Street Address</label>
                        <input type="text" id="address" class="form-input" required placeholder="123 Main St">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                        <div class="form-group">
                            <label class="form-label" for="city">City</label>
                            <input type="text" id="city" class="form-input" required placeholder="New York">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="zip">Zip Code</label>
                            <input type="text" id="zip" class="form-input" required placeholder="10001">
                        </div>
                    </div>
                </div>
                
                <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">Payment Method</h2>
                <div class="payment-method">
                    <input type="radio" id="cod" name="payment" value="cod" checked>
                    <label for="cod" style="font-weight: 600;">Cash on Delivery (COD)</label>
                </div>
                
                <div style="background: var(--bg-surface); padding: var(--spacing-xl); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: var(--spacing-xl);">
                    <div class="summary-row summary-total" style="border-top: none; padding-top: 0; margin-top: 0;">
                        <span>Order Total</span>
                        <span>₹${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="padding: 1rem; font-size: 1.1rem;">Place Order</button>
            </form>
        </div>
    `;

  appContainer.innerHTML = html;

  document
    .getElementById("checkout-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      appContainer.innerHTML = `
            <div class="container checkout-page">
                <div class="success-message">
                    <h1 style="margin-bottom: 1rem; color: var(--accent-primary);">Thank you for your order!</h1>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Your order has been successfully placed. You will pay via Cash on Delivery when it arrives.</p>
                    <a href="#/" class="btn btn-primary">Return to Home</a>
                </div>
            </div>
        `;

      clearCart();
    });
}

// ==========================================================================
// Helper Components
// ==========================================================================

function createProductCard(product) {
  const mainImg =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.image;
  return `
        <div class="product-card">
            <a href="#/product/${product.id}" class="product-image-wrap">
                <img src="${mainImg}" alt="${product.name}" loading="lazy">
            </a>
            <div class="product-category">${product.category}</div>
            <a href="#/product/${product.id}" class="product-title">${product.name}</a>
            <div class="product-price-row">
                <span class="product-price">₹${product.price.toFixed(2)}</span>
                <button class="btn btn-secondary" onclick="addToCart(${product.id})" aria-label="Add to cart">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

initApp();
