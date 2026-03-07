# PLAN: Gemini Travel Concierge & Logistics Layer

## 1. Executive Summary
This feature implements an enterprise-grade Travel & Logistics Orchestrator ("Gemini Travel") within EBOSS Manager. It utilizes "official" GDS/NDC connectors (via Amadeus/Duffel integration layers) to provide live booking capabilities for airlines, hotels, and car rentals. It features a proactive AI engine that monitors technician calendars and auto-suggests itineraries based on intelligent logic (D-1/D+1) and strict user preferences/loyalty programs.

## 2. Architecture Diagram

```mermaid
graph TD
    User[Technician] -->|Outlook/Google Calendar| CalAPI[Calendar Integration Service]
    CalAPI -->|New Event > 50mi| Gemini[Gemini Orchestrator]
    
    subgraph "Gemini Core"
        Gemini -->|Fetch Profile| Profile[User Preference Vault]
        Gemini -->|Analyze Location| Geo[Geospatial Engine]
        Gemini -->|Search Availability| Aggregator[Booking Aggregator]
    end
    
    subgraph "Data Storage"
        Profile --> DB_Prefs[(User Preferences)]
        DB_Prefs --> Loyalty[Loyalty #s & Status]
        DB_Prefs --> Policies[Corp Travel Policy]
    end
    
    subgraph "Connectivity Layer"
        Aggregator -->|Flights (NDC)| Duffel[Duffel / Amadeus Air]
        Aggregator -->|Hotels (GDS)| AmadeusHotel[Amadeus Hotel]
        Aggregator -->|Cars (GDS)| AmadeusCar[Amadeus Car]
    end
    
    Aggregator -->|Results| Gemini
    Gemini -->|Proposal Card| Dashboard[Command Center]
    User -->|Approve| Dashboard
    Dashboard -->|Book| Aggregator
    Aggregator -->|Receipt| ExpenseManager
```

## 3. Data Schema (Supabase/PostgreSQL)

### A. `user_travel_profiles` (Security Level: High - PCI/PII)
*   `user_id` (FK): Link to auth.users
*   `passport_encrypted`: Encrypted string
*   `known_traveler_number`: TSA Pre/Global Entry
*   `home_airport`: Preferred origin (e.g., LAX)
*   `seating_preference`: Aisle/Window/Front
*   `meal_preference`: Vegan/Kosher/etc.

### B. `user_loyalty_programs`
*   `id`: UUID
*   `user_id` (FK)
*   `provider_type`: 'airline' | 'hotel' | 'car'
*   `provider_code`: 'DL' (Delta), 'WN' (Southwest), 'Hilton'
*   `member_number`: The loyalty account number
*   `status_level`: 'Gold', 'Diamond', etc.

### C. `travel_trips`
*   `id`: UUID
*   `calendar_event_id`: Link to source event
*   `destination_city`: Extracted location
*   `trip_start_date`: Meeting Start - 1 Day
*   `trip_end_date`: Meeting End + 1 Day
*   `status`: 'draft' | 'proposed' | 'booked' | 'completed'

## 4. Business Logic & Rules

### A. Proactive Flight Search
*   **Trigger**: Calendar Event created/updated with location != Home Base.
*   **Arrival Rule**: Target arrival = Meeting Day - 1 (Day Before).
    *   *Constraint*: Arrival time < 20:00 (8 PM) preferred.
*   **Departure Rule**: Target departure = Meeting Day + 1 (Day After).
    *   *Constraint*: Departure time > 09:00 (9 AM) preferred.
*   **Selection**: Prioritize airlines in `user_loyalty_programs`.

### B. Hotel Proximity Logic
*   **Input**: `Meeting_Coordinates`, `Airport_Coordinates`.
*   **Calculation**: `Distance = Haversine(Meeting, Airport)`.
*   **Rule**:
    *   If `Distance > 10 miles`: Query hotels `near:Meeting_Coordinates` (Radius: 5mi).
    *   If `Distance <= 10 miles`: Query hotels `near:Airport_Coordinates` (Radius: 3mi).
*   **Brand Filter**: Prioritize Brands in `user_loyalty_programs` (Marriott/Hilton/IHG).

## 5. Implementation Roadmap

### Phase 2.1: Foundation (Backend & Database)
*   **Agent**: `database-architect`, `backend-specialist`
*   **Tasks**:
    1.  Create Supabase migrations for `user_travel_profiles`, `user_loyalty_programs`, `travel_trips`.
    2.  Set up RLS (Row Level Security) - Critical for PII.
    3.  Create Edge Functions/API Routes for `Calendar Webhook` listener.

### Phase 2.2: Connectivity Adapters (Backend)
*   **Agent**: `backend-specialist`
*   **Tasks**:
    1.  Implement `AmadeusAdapter` (Mock/Sandbox initially, swappable for Real Keys).
    2.  Implement `FlightSearchService` wrapping the adapter with D-1/D+1 logic.
    3.  Implement `HotelSearchService` with the "10 Mile Rule" geospatial logic.

### Phase 2.3: Frontend Experience
*   **Agent**: `frontend-specialist`
*   **Tasks**:
    1.  Create `TravelProfile` settings page (Loyalty cards wallet UI).
    2.  Create `TripProposalCard` on Dashboard (Approve/Decline).
    3.  Create `ItineraryView` component.

### Phase 2.4: Integration & Polish
*   **Agent**: `orchestrator`, `test-engineer`
*   **Tasks**:
    1.  Wire `CalendarService` mock to trigger Trip Generation.
    2.  Verify "Expense Generation" hook (Book -> Create Expense).
    3.  Security Scan (Check PII handling).

## 6. Recommended Additional Features
1.  **"Bleisure" Toggle**: Allow user to extend D+1 to D+3 for personal time (with separate categorization).
2.  **Uber/Lyft Deep Link**: Auto-generate ride-share links from Airport -> Hotel -> Job.
3.  **Weather Contingency**: If forecast = Snow/Storm, suggest earlier flight automatically.
