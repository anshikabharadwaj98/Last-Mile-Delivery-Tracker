### System Architecture: Behind the Scenes of Velocity Last-Mile Tracker                                                                                                           
                                                                                                                                                                                   
This document explains the core logic of our last-mile delivery tracking platform, written from a practical system-design perspective.                                             
──────                                                                                                                                                                             
### 1. Pincode-Based Zone Detection                                                                                                                                                
                                                                                                                                                                                   
To ensure fast deliveries, we need to know exactly which operational zone a package belongs to as soon as a customer enters the pickup and drop-off addresses.                     
                                                                                                                                                                                   
Instead of using heavy geographic coordinate calculations that slow down database lookups, we designed a simple, pincode-based geofencing approach.                                
                                                                                                                                                                                   
• How it works: We maintain a registry of operational areas where each postal code (pincode) is mapped to a specific zone (e.g., `110020` is linked to `South Delhi`).             
• The Lookup: When an order is created, the system looks up both the pickup and drop-off pincodes in our areas database. If either pincode isn't in our system, we block the       
  booking and let the customer know they are "Out of Service Area."                                                                                                                  
• Zone Classification: If both pincodes belong to the same zone, the system labels it an Intra-Zone delivery. If they belong to different zones, it becomes an Inter-Zone delivery.
  This classification directly feeds into our pricing engine.                                                                                                                        
──────                                                                                                                                                                             
### 2. Volumetric Rate Calculation Engine                                                                                                                                          
                                                                                                                                                                                   
Pricing shipments accurately is critical. We support two models: standard B2C retail rates and custom B2B contract rates. To protect our margins from bulky but lightweight        
packages, we calculate rates using Volumetric Weight.                                                                                                                              
                                                                                                                                                                                   
1. Calculating Billed Weight: First, we compute the volumetric weight using the standard shipping formula:                                                                         
                                                                                                                                                                                   
                      Length × Width × Height (in cm)                                                                                                                              
  Volumetric Weight = ───────────────────────────────                                                                                                                              
                                   5000                                                                                                                                            

We then charge the customer based on whichever is higher: the actual scale weight or the volumetric weight.
2. Rate Card Selection: We query our rate cards, looking for a match in a specific order:

• First, we look for a specific Zone-to-Zone card (e.g., `Central Delhi` to `South Delhi` for B2B).
• If none exists, we fall back to the generic B2B or B2C rate cards based on whether it is an intra-zone or inter-zone delivery.

3. Price Calculation: We take the base rate for the first kilogram and add an excess rate for every additional kilogram (rounded up):

  Final Price = Base Rate + (Additional Weight × Excess Rate per kg)

4. COD Fees: If the customer selects Cash on Delivery (COD), we automatically look up our active COD rules and append a flat surcharge to the total.
──────
### 3. Dispatch & Auto-Assignment Logic

To get packages on the road quickly without manual work, we built an automated dispatcher. It matches shipments to couriers in three steps:

• Step 1: Filtering by Zone: The system finds all couriers who are currently online, marked as available, and physically located inside the package's pickup zone.
• Step 2: Proximity Check: We calculate the straight-line distance between the couriers' GPS coordinates and the package's pickup location.
• Step 3: Ranking Priorities:
    1. Distance: The closest courier is ranked first.
    2. Workload Balancing: If two couriers are within 150 meters of each other, we select the courier with fewer active delivery tasks. This ensures we don't overload one driver  
    while others are free.
    3. ID Tie-Breaker: If distance and workload are identical, a safe unique ID comparison selects the final courier.

──────
### 4. Failed Deliveries & Customer Rescheduling

In last-mile logistics, delivery failures (e.g., "customer not home" or "incorrect address") are common. We built a robust lifecycle state-machine to handle these cases:          

• Logging Failure: If a courier cannot complete a delivery, they mark the status as `Failed` on their app and select a reason tag. The package is returned to the local hub.       
• Rescheduling: The customer receives an alert and can log in to pick a new date. When they reschedule:
    • The order status resets to `Pending`.
    • The previous failed reason is cleared.
    • The previous courier is unassigned.
• Re-dispatch: The system automatically triggers the auto-assignment engine again to find the best-suited courier for the new delivery date.
