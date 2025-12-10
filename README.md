# D'Rafza Inventory Management System

A custom-built inventory and product management web application designed for a seasonal clothing business operating during Ramadan.

## 🎯 Features

- **Inventory Management** - Track stock levels, add/edit products
- **Product Types** - Organize clothing by categories (Baju Kurung, Jubah, etc.)
- **Stock Alerts** - Low stock and out-of-stock notifications
- **User Authentication** - Secure JWT-based login system
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Backend:**
- Node.js + Express
- MongoDB (Atlas)
- JWT Authentication

**Architecture:**
- Microservices (Auth Service + Inventory Service)

## 📁 Project Structure
```
drafza/
├── microservices/
│   ├── ms-auth/          # Authentication service
│   └── ms-inventory/     # Inventory management service
├── webapp/               # Next.js frontend
└── drafzawebapp/         # Legacy PHP code (deprecated)
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/ekmelss/drafza-inventory-system.git
cd drafza-inventory-system
```

2. Setup Auth Service
```bash
cd microservices/ms-auth
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

3. Setup Inventory Service
```bash
cd microservices/ms-inventory
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

4. Setup Frontend
```bash
cd webapp
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## 🔐 Environment Variables

### Auth Service (.env)
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Inventory Service (.env)
```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=same_jwt_secret_as_auth
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 📦 Deployment

- **Database:** MongoDB Atlas (Free Tier)
- **Backend:** Render.com (Free Tier)
- **Frontend:** Vercel (Free Tier)

## 👥 Creating Users

Create users via the `/api/auth/register` endpoint:
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password",
  "role": "admin"
}
```

## 📝 License

Private - For personal/business use only

## 👨‍💻 Author

Built for D'Rafza seasonal clothing business
```

---

### **Step 3: Verify the location**

Your folder structure should now look like:
```
C:\xampp\htdocs\drafza\
├── README.md              ← NEW FILE (root level)
├── .gitignore
├── microservices/
│   ├── ms-auth/
│   └── ms-inventory/
└── webapp/
    └── README.md          ← Old Next.js default (keep it)