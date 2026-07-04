# 📦 Velocity: Last-Mile Delivery Tracker

Velocity is a premium, enterprise-grade SaaS logistics and last-mile delivery tracking platform. It consists of a modern React + TypeScript + TailwindCSS v4 frontend and a robust Node.js/Express API backend, backed by PostgreSQL.

## 🔗 Hosted Application URLs

* **Frontend (Vercel)**: [https://last-mile-delivery-tracker-ruby.vercel.app/](https://last-mile-delivery-tracker-ruby.vercel.app/)
* **Backend API (Render)**: [https://last-mile-delivery-tracker-1-dsus.onrender.com](https://last-mile-delivery-tracker-1-dsus.onrender.com)

---

## 🛠️ Environment Variables Configuration

### 1. Backend Environment Variables (Render)
Create a `.env` file in the root folder for local development, or add these keys under Render's **Environment** tab:

```ini
# API Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_token_here

# Database Configuration (Unset to fall back to local SQLite database.sqlite)
DATABASE_URL=your_postgres_url(eg:DATABASE_URL=postgresql://username:password@host:5432/database )

# SMTP Mail Server (Unset to use automatic Ethereal test mail simulation)
SMTP_SERVICE=gmail
SMTP_USER=example@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### 2. Frontend Environment Variables (Vercel)
Add this key under Vercel's **Environment Variables** panel:

```ini
# Target API Backend Server URL (Do not include a trailing slash)
VITE_API_URL=https://last-mile-delivery-tracker-1-dsus.onrender.com
```

---

## 🗄️ Database Schema & Models

Velocity runs on **Sequelize ORM** with support for PostgreSQL (Production) and SQLite (Local Dev). Tables are synchronized automatically on startup (`sequelize.sync()`).

### Core Entities:
1. **`User`**: System actors. Stores account types (B2C/B2B), roles (customer, admin, delivery_agent), and encrypted hashes.
2. **`DeliveryAgent`**: Extension profile for couriers tracking availability and active GPS coordinates.
3. **`Zone`**: Geographic operational regions (e.g. `CENTRAL_DELHI`).
4. **`Area`**: Neighborhood pins mapping specific pincodes and GPS coordinates to operational Zones.
5. **`RateCard`**: Tiered rules engine defining base weights, base rates, and excess rates per kilogram.
6. **`CODRule`**: Flat cash-on-delivery collection surcharges.
7. **`Order`**: Shipments tracking volumetric calculations, payment details, current status, and assignments.
8. **`OrderStatusHistory`**: Immutable audit logs of order transitions and comments.
9. **`Notification`**: Audit logs of all outbound emails, SMS, or fallback notifications.

---

## 📐 Rate Calculation Logic

To protect delivery margins from bulky but lightweight items, the system utilizes a **Billed Weight** formula based on physical dimensions.

1. **Billed Weight**: Calculated as the maximum value between the scale weight and the volumetric size:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
   $$\text{Billed Weight} = \max(\text{Physical Weight}, \text{Volumetric Weight})$$
2. **Cost Calculation**: Checks matching rate cards (prioritizing custom Zone-to-Zone paths, falling back to generic intra/inter-zone cards):
   $$\text{Shipping Cost} = \text{Base Rate} + \max(0, \lceil \text{Billed Weight} - \text{Base Weight} \rceil) \times \text{Excess Rate per kg}$$
3. **Payment COD Surcharges**: Adds a flat surcharge if Cash on Delivery is selected, according to the client type (B2C vs. B2B).

---

## 🔌 API Documentation

| Endpoint | Method | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | None | Sign up as Customer or Courier Agent. |
| `/api/auth/login` | `POST` | None | Log in and receive a JWT session token. |
| `/api/auth/me` | `GET` | JWT Bearer | Verify token and return user profile session. |
| `/api/seed-database` | `GET` | None | Seed cloud/local database with default users and rules. |
| `/api/zones` | `GET` / `POST` | Admin | Retrieve geofenced zones / Create new zone. |
| `/api/zones/areas` | `POST` | Admin | Link a pincode and coordinate set to an active zone. |
| `/api/rate-cards` | `GET` / `POST` | Admin | Get active rate cards / Create new rate card rule. |
| `/api/orders` | `GET` / `POST` | Customer/Admin | List customer shipments / Book a new shipment. |
| `/api/orders/calculate` | `POST` | None | Live cost preview calculation with volumetric checking. |
| `/api/orders/:id` | `GET` | All Roles | Fetch specific shipment details and audit timelines. |
| `/api/orders/:id/status` | `PUT` | Admin/Agent | Override shipment status (with fail reason tags). |
| `/api/orders/:id/assign` | `POST` | Admin | Auto-assign or manually assign a courier to an order. |
| `/api/orders/:id/reschedule`| `POST` | Customer | Reschedule a failed delivery. |
| `/api/agent/location` | `PUT` | Agent | Synchronize agent GPS coordinates. |

---

## 🚀 Setup & Installation Guide

### 1. Local Development Setup (Unified Server)
To run the full project locally on your machine with SQLite:
1. Clone the repository and navigate to the project root:
   ```bash
   cd Last-Mile-Delivery-Tracker
   ```
2. Install root server dependencies:
   ```bash
   npm install
   ```
3. Navigate to the frontend folder and install UI dependencies:
   ```bash
   cd frontend && npm install && cd ..
   ```
4. Build the React frontend statically into the public folder:
   ```bash
   npm run build --prefix frontend
   ```
5. Start the local server:
   ```bash
   npm run dev
   ```
6. Open your browser and visit: [http://localhost:3000](http://localhost:3000)

### 2. Cloud Database Seeding
After deploying the backend on Render, visit `/api/seed-database` in your browser once to write default roles and rules:
* **Admin**: `admin@tracker.com` (password: `admin123`)
* **Customer**: `customer@tracker.com` (password: `customer123`)
* **Agent A**: `agent1@tracker.com` (password: `agent123`)
