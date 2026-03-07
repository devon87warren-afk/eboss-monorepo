# Plan: Stylized Map Reference Points ("Map Anchors")

## 1. Analysis
**Goal**: Create a reliable system for plotting start/stop points for travel arcs on the Fleet Map. The current mathematical projection is "roughly correct" but lacks the precision needed for a "connected 2D world" feel.

**Problem**: 
- Mathematical projection (`lat/lng` -> `x/y`) is imperfect on stylized/artistic maps.
- Travel lines need to feel like they connect "Nodes" or "Hubs", not random pixel coordinates.

**Solution**: 
- Implement a **"Map Anchor" System**: Pre-defined X/Y coordinates for major hubs (Airports/Cities) that align perfectly with the background image.
- **Hybrid Projection**: Use Anchors for known locations (e.g., "DEN", "MIA") and fallback to Math Projection for dynamic job sites.
- **Visual Grid/Nodes**: Render these Anchors visually as "Landing Pads" or "nodes" to ground the travel lines.

## 2. Architecture

### New Data Structure: `MapAnchor`
```typescript
interface MapAnchor {
  id: string;        // "DEN", "MIA", "LAS"
  type: 'hub' | 'site';
  label: string;
  lat: number;
  lng: number;
  // Pre-calibrated X/Y % coordinates on the 1000x600 map
  x: number; 
  y: number; 
}
```

### Visual Layer
- **Anchor Layer**: Render subtle "Target Circles" or "Grid Points" at these known locations.
- **Stylized Grid**: Optional background grid that intersects these points, creating a "Flight Plan" aesthetic.
- **Arc Logic**: Update `FleetMap` to check if `origin` or `dest` matches an Anchor ID. If so, snap to `Anchor.x, Anchor.y`.

## 3. Implementation Steps

### Phase 1: Define Anchors
1.  Identify major hubs from current data (LAS, MIA, DEN, NYC, AUS, SEA).
2.  Create `src/lib/maps/mapAnchors.ts` with calibrated coordinates.
    *   *Calibration Strategy*: Manually tune X/Y for these ~10 points to match the SVG background perfectly.

### Phase 2: Visual "Node" Component
1.  Create `<MapNode />` SVG component.
    *   Style: Small "Target" or "Crosshair".
    *   Behavior: Subtle pulse.
2.  Render these nodes on the map so users see the "Network".

### Phase 3: Update Projection Logic
1.  Modify `project()` to accept an optional `anchorId`.
2.  If `anchorId` exists in `mapAnchors`, return strict X/Y.
3.  Else, perform Mercator logic.

### Phase 4: Integration
1.  Update `MOCK_TECH_LOCATIONS` to use `anchorId` assignments (e.g., `origin: "LAS"`).
2.  Refine Travel Arcs to snap to these nodes.

## 4. Verification
- [ ] **Visual Check**: Arcs must start/end EXACTLY center of the Node markers.
- [ ] **Las Vegas -> Miami**: The "Cross Country" line should look deliberate and physically connected.
