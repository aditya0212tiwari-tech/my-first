// ==========================
// MOCK BACKEND (LocalStorage)
// ==========================
function initDatabase() {
  if (!localStorage.getItem('foodItems')) {
    const initialItems = [
      { id: 1, name: "Bond-Bomber-Burger", price: 299, image: "https://cdn.uengage.io/uploads/18085/image-697364-1717587021.jpeg", category: "burger", description: "Juicy Paneer patty with fresh lettuce, tomato, and special sauce." },
      { id: 2, name: "Farmhouse Pizza", price: 389, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", category: "pizza", description: "Classic Farmhouse with fresh mozzarella and basil." },
      { id: 3, name: "Creamy Pasta", price: 209, image: "https://i0.wp.com/kennascooks.com/wp-content/uploads/2025/03/img_9240.jpg?resize=1080%2C1440&ssl=1", category: "pasta", description: "Fettuccine Alfredo with parmesan and garlic." },
      { id: 4, name: "Chocolate Cake", price: 379, image: "https://cakelinks.in/cdn/shop/files/DarkChocolteCake.jpg?v=1723188537&width=823", category: "dessert", description: "Decadent dark chocolate multilayer cake." },
      { id: 5, name: "Mojito Drink", price: 120, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", category: "drinks", description: "Refreshing mint and lime mojito." }
    ];
    localStorage.setItem('foodItems', JSON.stringify(initialItems));
  }
  if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
  if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
}

window.apiGetMenu = () => JSON.parse(localStorage.getItem('foodItems'));
window.apiAddMenu = (item) => {
  const items = apiGetMenu();
  item.id = Date.now();
  item.price = parseFloat(item.price);
  items.push(item);
  localStorage.setItem('foodItems', JSON.stringify(items));
};
window.apiSignup = (name, email, password) => {
  const users = JSON.parse(localStorage.getItem('users'));
  if (users.find(u => u.email === email)) return { error: "User already exists" };
  const newUser = { id: Date.now(), name, email, password, role: 'user' };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return { ok: true, user: { id: newUser.id, name, email, role: 'user' } };
};
window.apiLogin = (email, password) => {
  if (email === 'aditya0212tiwari@gmail.com' && password === 'aditya0212') return { ok: true, user: { id: 0, name: 'Aditya', email, role: 'admin' } };
  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { error: "Invalid credentials" };
  return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};
window.apiAddOrder = (userId, items, total) => {
  const orders = JSON.parse(localStorage.getItem('orders'));
  const newOrder = { id: Date.now(), userId, items, total, date: new Date().toISOString(), status: 'pending' };
  orders.push(newOrder);
  localStorage.setItem('orders', JSON.stringify(orders));
  return { ok: true, orderId: newOrder.id };
};
window.apiGetOrders = () => JSON.parse(localStorage.getItem('orders'));

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let menuItems = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  initNavbar();
  initScrollAnimations();
  updateCartCounter();
  
  // Specific page initializations
  if (document.getElementById('featured-grid')) {
    fetchFeaturedItems();
  }
});

// ==========================
// NAVBAR HIDDEN ON SCROLL
// ==========================
function initNavbar() {
  let lastScrollTop = 0;
  const navbar = document.getElementById('navbar');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down
      navbar.classList.add('hidden');
    } else {
      // Scrolling up
      navbar.classList.remove('hidden');
    }
    lastScrollTop = scrollTop;
  });
}

// ==========================
// SCROLL ANIMATIONS (INTERSECTION OBSERVER)
// ==========================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.fade-up, .fade-in');
  animatedElements.forEach(el => observer.observe(el));
}

// ==========================
// API & DATA 
// ==========================
async function fetchFeaturedItems() {
  try {
    const data = apiGetMenu();
    menuItems = data;
    // Just show first 3 items on home page
    renderGrid(data.slice(0, 3), 'featured-grid');
  } catch (error) {
    console.error("Failed to fetch menu:", error);
  }
}

function renderGrid(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  items.forEach((item, index) => {
    const delay = (index % 3) + 1;
    
    const card = document.createElement('div');
    card.className = `food-card glass-panel fade-up delay-${delay}`;
    
    // Add visible class if already in view (or rely on observer)
    setTimeout(() => {
      // Re-observe dynamic cards
      initScrollAnimations();
    }, 100);

    card.innerHTML = `
      <div class="food-img-container">
        <span class="food-price">₹${item.price.toFixed(2)}</span>
        <img src="${item.image}" alt="${item.name}">
      </div>
      <h3 class="food-title">${item.name}</h3>
      <p class="food-desc">${item.description}</p>
      <div class="food-actions">
        <button class="btn btn-primary glass-btn" onclick="addToCart(${item.id})">Buy Now</button>
        <button class="btn-icon" onclick="addToCart(${item.id})" title="Add to Cart">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================
// CART FUNCTIONALITY
// ==========================
window.addToCart = function(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = cart.find(i => i.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  saveCart();
  updateCartCounter(true);
  showToast(`Added ${item.name} to cart!`);
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCounter(animate = false) {
  const counter = document.getElementById('cart-counter');
  if (!counter) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  counter.textContent = totalItems;
  
  if (animate) {
    counter.classList.add('bump');
    setTimeout(() => {
      counter.classList.remove('bump');
    }, 300);
  }
}

// ==========================
// TOAST NOTIFICATIONS
// ==========================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast glass-panel';
  toast.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}
