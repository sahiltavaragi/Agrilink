# 🌱 AgriLink – Organic Farming Marketplace

## Project Structure
```
Agrilink/
├── frontend/    React + Vite + Tailwind CSS
└── backend/     Node.js + Express + Razorpay
```

---

## ⚡ Quick Start

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Run this SQL in the **Supabase SQL Editor** to create all tables:

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  role TEXT CHECK (role IN ('buyer', 'seller', 'admin')) DEFAULT 'buyer',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_approved_seller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  wallet_balance NUMERIC DEFAULT 0
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('razorpay', 'cod', 'wallet')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  seller_id UUID REFERENCES users(id),
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follows (
  follower_id UUID REFERENCES users(id),
  followed_id UUID REFERENCES users(id),
  PRIMARY KEY (follower_id, followed_id)
);
```

3. Enable **Row Level Security (RLS)** on each table in the Table Editor, or add policies as needed.
4. Create a **Storage bucket** named `product-images` (public) for product image uploads.
5. Go to **Project Settings → API** and note your:
   - `Project URL` → sb_publishable_ViOnTb6k5aqCW8UkVHtQ2Q_2I9oNHLO
   - `anon key` → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcWtuZnd2c216ZWRlenljbG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTU3MzksImV4cCI6MjA4OTMzMTczOX0.swD0ThTsZGko1S2rOwvPM-Zp50jOe-UauycDhDugv68
   - `service_role key` → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcWtuZnd2c216ZWRlenljbG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1NTczOSwiZXhwIjoyMDg5MzMxNzM5fQ.MvOXgYx3cT-Z3XE3HcAALzmZDIpjuu9MGjQC61KTfCs (backend only)

---

### 2. Setup Frontend

```bash
cd frontend
```

Edit `frontend/.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

```bash
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 3. Setup Backend

```bash
cd backend
```

Edit `backend/.env`:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your-razorpay-secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 4. Setup Admin User

After registering an account, run this SQL in Supabase to make yourself admin:
```sql
UPDATE users SET role = 'admin' WHERE id = 'your-user-id-here';
```

---

## 🔑 Razorpay Test Credentials

- Sign up at [razorpay.com](https://razorpay.com)
- Go to Settings → API Keys → Generate Test Key
- Use `rzp_test_...` keys for development

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | All routes |
| `frontend/src/contexts/AuthContext.jsx` | Auth state + Supabase auth |
| `frontend/src/contexts/CartContext.jsx` | Cart with localStorage |
| `frontend/src/pages/Home.jsx` | Landing page |
| `frontend/src/pages/Products.jsx` | Products listing |
| `frontend/src/pages/SellerDashboard.jsx` | Seller panel |
| `frontend/src/pages/AdminPanel.jsx` | Admin panel |
| `frontend/src/pages/Community.jsx` | Community feed |
| `backend/index.js` | Express server |
| `backend/routes/payment.js` | Razorpay integration |
| `backend/routes/orders.js` | COD orders |
