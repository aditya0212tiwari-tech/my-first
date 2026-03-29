const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize simple local database if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    foodItems: [
      { id: 1, name: "Gourmet Burger", price: 7.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", category: "burger", description: "Juicy Paneer patty with fresh lettuce, tomato, and special sauce." },
      { id: 2, name: "Margherita Pizza", price: 18.50, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", category: "pizza", description: "Classic margherita with fresh mozzarella and basil." },
      { id: 3, name: "Creamy Pasta", price: 16.00, image: "https://i0.wp.com/kennascooks.com/wp-content/uploads/2025/03/img_9240.jpg?resize=1080%2C1440&ssl=1", category: "pasta", description: "Fettuccine Alfredo with parmesan and garlic." },
      { id: 4, name: "Chocolate Cake", price: 8.99, image: "https://cakelinks.in/cdn/shop/files/DarkChocolteCake.jpg?v=1723188537&width=823", category: "dessert", description: "Decadent dark chocolate multilayer cake." },
      { id: 5, name: "Mojito Drink", price: 6.50, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", category: "drinks", description: "Refreshing mint and lime mojito." }
    ],
    users: [],
    orders: []
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read/write data
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// -- API ENDPOINTS --

// Get all menu items
app.get('/api/menu', (req, res) => {
  const data = readData();
  res.json(data.foodItems);
});

// Admin: Add new menu item
app.post('/api/menu', (req, res) => {
  const { name, price, image, category, description } = req.body;
  const data = readData();
  const newItem = {
    id: Date.now(),
    name, price: parseFloat(price), image, category, description
  };
  data.foodItems.push(newItem);
  writeData(data);
  res.status(201).json(newItem);
});

// User/Auth: Signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  const data = readData();
  const existingUser = data.users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const newUser = { id: Date.now(), email, password, name, role: 'user' };
  data.users.push(newUser);
  writeData(data);
  res.status(201).json({ message: "Signup successful", user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// User/Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Hardcoded admin
  if (email === 'aditya0212tiwari@gmail.com' && password === 'aditya0212') {
    return res.json({ user: { id: 0, email, name: 'Aditya', role: 'admin' } });
  }

  const data = readData();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Orders: Place an order
app.post('/api/orders', (req, res) => {
  const { userId, items, total } = req.body;
  const data = readData();
  const newOrder = {
    id: Date.now(),
    userId: userId || 'guest',
    items,
    total,
    date: new Date().toISOString(),
    status: 'pending'
  };
  data.orders.push(newOrder);
  writeData(data);
  res.status(201).json({ message: "Order placed successfully", orderId: newOrder.id });
});

// Admin: Get all orders
app.get('/api/orders', (req, res) => {
  const data = readData();
  res.json(data.orders);
});

// Handle 404 falling back to index for SPA-like behavior, 
// or simply let static serve HTML files if they exist.
// We'll serve index.html for unknown routes if not starting with /api
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  let target = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(target)) {
    res.sendFile(target);
  } else if (fs.existsSync(target + '.html')) {
    res.sendFile(target + '.html');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
