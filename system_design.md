# System Design Document: Last-Mile Delivery Tracker

This document describes the architectural layout, algorithmic details, and state machine workflows for the Last-Mile Delivery Tracker.

---

## 1. Monolithic Architecture Style

The application is built as a **Domain-Driven Modular Monolith** to maximize code structure clean-room separation while keeping infrastructure deployment simple.

```
       [ Presentation Layer ] (Vanilla CSS/HTML/JS SPA)
                 │
                 ▼
          [ API Controllers ] (Express Controllers & Middleware)
                 │
                 ▼
       [ Application Services ] (Workflow Orchestrator Services)
          /      │       \
        /        │         \
      ▼          ▼          ▼
[ Repositories ] ──► [ Pure Domain Layer ] (State Machine, Engines, Rules)
(ORM Database)
```

### Dependency Decoupling
* **Pure Domain Layer (`src/domain/`):** Contains business entities and services (e.g., `PricingEngine`, `AssignmentStrategy`, `OrderStateMachine`). They are 100% pure JavaScript, making no database calls and depending on no external packages.
* **Repository Layer (`src/repositories/`):** Encapsulates all database ORM (Sequelize) operations. No controller or domain service queries the database models directly.
* **Application Services (`src/application/`):** Coordinates transactional workflows. Services fetch data through Repositories, feed it into the pure Domain Layer to run business rules, save the updated state back via Repositories, and trigger async side-effects (like notifications).

---

## 2. Rate Calculation Engine

The Pricing Domain calculates package costs deterministically using a multi-step pipeline.

### Density & Volumetric Weight
Logistics constraints require pricing based on package density. Bulky, light packages consume truck volume disproportionately to weight. The system computes volumetric weight:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
The engine bills on the higher of physical actual weight vs. computed volumetric weight, establishing the **chargeable weight**:
$$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### Rate Selection Heuristics
The Application Service fetches rates using a fallback query sequence:
1. **Specific Route Lookup:** Attempts to find a `RateCard` matching `order_type` (B2B/B2C) and `rate_type` (intra/inter) with specific `zone_from_id` (pickup) and `zone_to_id` (drop) to support custom premium corridors.
2. **General Fallback Lookup:** If no specific card is configured, it queries the fallback card where zone parameters are `NULL`.
3. **Logistics Fee Formula:**
   $$\text{Delivery Charge} = \text{Base Rate} + \max(0, \text{Chargeable Weight} - \text{Base Weight Limit}) \times \text{Excess Rate Per Kg}$$
4. **Cash-on-Delivery (COD) Rules:** For COD shipments, the engine retrieves the surcharge mapped in the `cod_rules` table for B2B/B2C and appends it:
   $$\text{Total Cost} = \text{Delivery Charge} + \text{COD Surcharge}$$

---

## 3. Zone Detection Approach

Geographical lookup utilizes a deterministic **Area Postal Code Mapping** strategy.
Admins create zones (for example Central Delhi or South Delhi) and map exact pincodes (Areas) directly to them. On order placement, the system queries the `zoneRepository` to find the zones matching the pickup and drop postal codes. 
* If $\text{pickup\_zone\_id} = \text{drop\_zone\_id}$, route type is `intra-zone`.
* If $\text{pickup\_zone\_id} \neq \text{drop\_zone\_id}$, route type is `inter-zone`.

Mapping postal codes achieves $O(1)$ database lookup times, eliminating the performance overhead of full geographic polygon GIS intersection calculations while matching standard postal logistics practices.

---

## 4. Auto-Assignment Heuristics

The Assignment Domain selects and allocates delivery agents using a three-tier ranking strategy:

1. **GPS Geodesic Proximity (Haversine Formula):** If coordinate pairs are configured for the pickup postal code (Area) and the agent's current position (mocked via the Agent console), the strategy calculates distance:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   Where $R = 6371$ km. Agents are ranked by proximity. Agents within a $150$-meter range threshold are considered equivalent.
2. **Zone Matching Fallback:** If GPS coordinates are not set, the strategy filters for agents located in the order's pickup zone.
3. **Active Workload Balancing:** To prevent overloading active drivers, the system ranks candidates by their active shipments (orders in `Assigned`, `Picked Up`, `In Transit`, or `Out for Delivery`). The agent with the fewest active jobs is selected.

---

## 5. Failed Delivery State Machine

Shipment failures represent a key operational cost. The system manages failures through state transition boundaries:
* **Failure Trigger:** Agent flags status as `Failed` and inputs a mandatory failure reason. The active agent is unassigned.
* **Notification & Reschedule:** An alert email/SMS is sent to the customer. The customer logs in to select a new delivery date.
* **Re-trigger Workflow:** Rescheduling transitions the order status back to `Pending`, resets agent allocations, and automatically invokes the auto-assignment engine to select a fresh agent for the new delivery date.
