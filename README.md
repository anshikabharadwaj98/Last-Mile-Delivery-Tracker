# Last-Mile Delivery Tracker

A Domain-Driven Modular Monolith logistics management platform built from scratch with Node.js, Express, and Sequelize. 

It implements strict layer boundaries (Presentation $\to$ API $\to$ Application Services $\to$ Pure Domain Layer $\to$ Repository Layer $\to$ Database) for high scalability and reliability. It features volumetric-weight pricing, intelligent Haversine coordinate proximity agent auto-assignment, role-based JWT auth, real-time notification logs, and an immutable status timeline history.

---

## Architectural Layout (DDD Modular Monolith)

The codebase is organized into clean horizontal layers with isolated domain boundaries:

* **`src/models/`** (Infrastructure): Database schemas (`User`, `Zone`, `Area`, `DeliveryAgent`, `RateCard`, `CODRule`, `Order`, `OrderStatusHistory`, `Notification`).
* **`src/repositories/`** (Repository Layer): Encapsulates all SQL ORM operations, separating business code from raw database structures.
* **`src/domain/`** (Pure Domain Layer): Implements domain-specific rules. Completely pure JavaScript modules without database dependencies or external library coupling:
  * `identity/IdentityRules`: Password hashing, session tokenization, and auth rules.
  * `order/OrderStateMachine`: Lifecycle transition rules.
  * `zone/AdvancedLogisticsEngine`: Legacy route guard utilities; active zone detection is handled through exact `Area.pincode` mappings in repositories.
  * `pricing/PricingEngine`: Computes volumetric weights and delivery charges.
  * `agent/AgentAvailability`: Coordinates boundary validations.
  * `assignment/AssignmentStrategy`: Haversine proximity calculations and load balancing.
  * `tracking/Timeline`: Formats tracking timeline data.
  * `notification/Notifier`: Houses SMS and HTML email copy templates.
* **`src/application/`** (Application Layer): Orchestrator services (`authService`, `orderService`, `pricingService`, `assignmentService`, `trackingService`, `notificationService`, `adminService`) that execute use-case workflows by fetching database entities via repositories, running business rules in the domain layer, saving the state back to repositories, and triggering async notification dispatches.
* **`src/routes/`** (API Controller Layer): Express routes and JSON payload validation handlers.
* **`src/public/`** (Presentation Layer): Modern Single Page Application (SPA) utilizing CSS custom properties, glassmorphism overlays, real-time pricing calculation listeners, and native overlays.

---

## Core Business Engines

### 1. Rate Calculation Engine
1. **Volumetric Weight**: Calculated using the standard formula:
   $$\text{Volumetric Weight (kg)} = \frac{L \times B \times H}{5000} \quad (\text{Dimensions in cm})$$
2. **Chargeable Weight**: Billed on the higher of physical actual weight vs. computed volumetric weight:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Route Type Classification**:
   * Pickup pincode is matched exactly against `areas.pincode` to resolve `pickup_zone_id`
   * Drop pincode is matched exactly against `areas.pincode` to resolve `drop_zone_id`
   * If `pickup_zone_id === drop_zone_id`, route type is `intra-zone`, else `inter-zone`. Unmapped pincodes are rejected as unserviceable.
4. **Rate Card Lookup**: The system first looks for a specific `(zone_from_id, zone_to_id, rate_type, order_type)` rate card, then falls back to generic B2B/B2C intra/inter cards where both zone columns are `NULL`.
5. **Pricing Formula**:
   $$\text{Delivery Fee} = \text{Base Rate} + \max(0, \text{Chargeable Weight} - \text{Base Weight Limit}) \times \text{Excess Rate Per Kg}$$
6. **COD Surcharges**: If payment is `COD`, the surcharge configured in `CODRules` (seeded as \$15.00 for B2B and \$10.00 for B2C) is added to the delivery fee:
   $$\text{Total Cost} = \text{Delivery Fee} + \text{COD Surcharge}$$

### 2. Proximity & Workload Auto-Assignment
The auto-assignment engine ranks and allocates agents using a three-tier domain heuristic:
1. **GPS Geodesic Proximity**: If coordinate pairs are set for the pickup area and the agent's current simulated coordinates, the system calculates distance using the **Haversine formula**:
   $$\text{distance} = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   Agents are ranked in ascending order of proximity. Proximity within a $150$-meter range threshold is considered equivalent.
2. **Zone Match (Fallback)**: If GPS coordinates are unavailable, active agents inside the order's pickup zone are prioritized.
3. **Workload Balancing**: Among agents in the same proximity bracket, the system selects the agent with the **fewest active deliveries** (orders currently in `Assigned`, `Picked Up`, `In Transit`, or `Out for Delivery` status) to balance network loads.
4. **Deterministic Tie-breaker**: Deterministic fallback by lowest agent ID.

---

## Setup & Running Guide

### Installation Steps
1. Navigate into the project root directory:
   ```bash
   cd last-mile-delivery-tracker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Sync database schemas and seed the SQLite database with testing routes, pricing rules, and accounts:
   ```bash
   npm run seed
   ```
5. Run the automated test suite to verify pricing, distance calculations, and assignment service logic:
   ```bash
   npm test
   ```
6. Start the local server:
   ```bash
   npm start
   ```
7. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## Email Verification Setup

Every new account (customer, delivery agent, or B2B company) must verify their email before they can log in. The system supports three modes:

### Option 1 — Zero-config (Ethereal, default for dev/demo)
Leave all `SMTP_*` variables unset in `.env`. On startup the server automatically creates a free [Ethereal](https://ethereal.email) test account and prints a preview URL to the console after every email send:
```
📧  SMTP ready — Ethereal test account auto-created
    User: abc123@ethereal.email
📬  Verification email sent!
    To: newuser@example.com
    Preview URL: https://ethereal.email/message/AbCdEf...
```
Open that URL in your browser to see the email exactly as the recipient would, including the **Verify Email Address** button.

### Option 2 — Gmail (real delivery)
1. Go to **Google Account → Security → 2-Step Verification → App Passwords**
2. Generate a 16-character App Password
3. Add to `.env`:
```env
SMTP_SERVICE=gmail
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
APP_URL=http://localhost:3000
```

### Option 3 — Custom SMTP (Mailtrap, SendGrid, etc.)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_user
SMTP_PASS=your_pass
APP_URL=http://localhost:3000
```

### Resending a verification email
If the email never arrived or the 24-hour link expired, users can request a new one via:
- The **"Resend verification email"** link shown inline when login fails due to an unverified account
- `POST /api/auth/resend-verification` with body `{ "email": "user@example.com" }`

---

## Pre-seeded Accounts for Evaluation
For ease of manual testing, a **Quick Login Bar** is rendered at the top of the login screen. You can click any role to log in instantly. The pre-seeded credentials are:

* **Admin:** `admin@tracker.com` | password: `admin123`
* **Customer:** `customer@tracker.com` | password: `customer123`
* **Agent A (Central Delhi):** `agent1@tracker.com` | password: `agent123`
* **Agent B (South Delhi):** `agent2@tracker.com` | password: `agent2123`
