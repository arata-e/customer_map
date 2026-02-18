# Bitrix24 Map Widget - Agent Guide

## Project Overview

This is a sophisticated geospatial application that integrates Bitrix24 CRM with Userside ISP management and UTM5 billing systems. It provides field teams with an interactive map interface for planning service zones and managing customer locations.

## Tech Stack

- **Framework:** Nuxt 4.2.1 + Vue 3.5.25
- **Mapping:** Leaflet 1.9.4 with Leaflet-Geoman for editing
- **CRM:** Bitrix24 JavaScript SDK
- **Geocoding:** DaData (primary), Yandex Maps (secondary)
- **Clustering:** Leaflet.markerCluster for large datasets
- **APIs:** Userside (network infrastructure), UTM5 (billing)

## Project Structure

```
├── pages/
│   ├── index.vue                   # Navigation landing page
│   └── amap.vue                    # Main map application (1046 lines)
├── components/
│   ├── AddressSearch.vue           # DaData address autocomplete
│   ├── ObjectSearch.vue            # Map object filter/search
│   └── ResetViewButton.vue         # Map view reset button
├── composables/
│   ├── bitrix24.js                 # Bitrix24 CRM API wrapper
│   ├── us-api.js                   # Userside network API client
│   ├── utm5-api.js                 # UTM5 billing system client
│   └── customers.js                # Customer data management
├── utils/
│   ├── dadata-provider.js          # DaData geocoding provider
│   └── yandex-provider.js          # Yandex Maps geocoding provider
├── plugins/
│   └── leaflet.client.js           # Leaflet initialization
└── assets/
    └── css/main.css                # Global Leaflet customization
```

## Core Data Model

### Bitrix24 Smart Process Integration
- **Smart Process ID:** 139
- **Polygon Category (61):** Service zones/coverage areas
  - Stored as GeoJSON in custom field: `ufCrm33_1705393860`
  - Stages: SUCCESS (in-progress), FAIL (completed)
- **Point Category (65):** Potential customer locations
  - Same GeoJSON field and stage structure

### Four-Layer System
Objects are displayed in four distinct Leaflet layer groups:
1. **Polygons In Progress:** Blue (opacity 0.8, fill 0.4)
2. **Polygons Processed:** Gray (opacity 0.5, fill 0.2)
3. **Points In Progress:** Clustered (opacity 1.0, green/yellow/orange by density)
4. **Points Processed:** Clustered (opacity 0.5, faded)

Completed layers lazy-load when user toggles visibility.

## Key Features

### 1. Geometry Editing
- **Tool:** Leaflet-Geoman for interactive editing
- **Workflow:** Right-click → Select "Edit" → Modify vertices → Right-click "Finish" → Saves to Bitrix24
- **Snap-to-Grid:** 20px snapping prevents self-intersections
- **Format:** GeoJSON (stringified in Bitrix24)

### 2. Object Management
- **Create:** Right-click map → Select geometry type → Draw → Name → Opens Bitrix24 slider
- **Edit:** Right-click object → "Edit" → Modify geometry → Saved automatically
- **Delete:** Right-click object → Delete button (requires confirmation)
- **View:** Right-click object → "Open" → Opens in Bitrix24 slider for editing

### 3. Smart Searching
- **Address Search:** DaData integration with 300ms debounce (min 3 chars)
- **Object Search:** Filter by ID or title (min 2 chars), returns up to 10 results
- **Bounds Queries:** Efficient spatial queries to Userside and UTM5 APIs

### 4. Map Controls
- **Basemaps:** Google Street, Google Hybrid, OpenStreetMap (toggle-able)
- **Overlay Layers:** Toggle polygons/points visibility
- **Reset View:** Return to Moscow (55.8°N, 37.75°E) zoom 8
- **Geoman Tools:** Draw and edit controls visible when enabled

### 5. Marker Clustering
- Small clusters (0-100): Green (#6ecc39)
- Medium clusters (100-1000): Yellow (#f1d357)
- Large clusters (1000+): Orange (#fd9c73)
- Clusters expand on higher zoom levels

## Authentication & Data Flow

### B24Frame Initialization
```
B24Frame.initializeB24Frame() → b24Instance.auth.getAuthData()
↓
Returns: { domain, member_id, access_token, refresh_token, expires_in }
↓
Forwarded to all third-party API requests
```

### API Request Pattern
All third-party API calls include auth payload:
```javascript
{
  auth: {
    domain, member_id, access_token, refresh_token, expires_in
  },
  ...params
}
```

## Important Composables

### useBitrix24()
**Constants:**
- `SMART_PROCESS_ID = 139`
- `POLYGON_TYPE_ID = 61`
- `POINT_TYPE_ID = 65`

**Functions:**
- `getPolygons(b24)` / `getPolygonsDone(b24)` - Fetch zones
- `getPoints(b24)` / `getPointsDone(b24)` - Fetch customer points
- `createGeoObject(b24, data, typeId)` - Create new object
- `updateGeoObject(b24, id, data)` - Update geometry
- `deleteGeoObject(b24, id)` - Remove object
- `openEntityCard(b24, entityTypeId, entityId)` - Open in Bitrix24 slider
- `getStages(b24, categoryId)` - Get workflow stages

### useUsersideApi()
Provides access to network infrastructure:
- `getNodes(auth)` - Network node locations
- `getOpticalLines(auth)` - Fiber line data
- `getNodesByBounds(auth, bounds)` - Spatial query

### useUtm5Api()
Integrates billing system data:
- `getCustomers(auth, filters)` - Customer list
- `getCustomersByBounds(auth, bounds)` - Spatial customer query

## Common Tasks

### Adding a New Map Layer
1. Create layer group: `const newLayer = L.featureGroup()`
2. Add to map: `newLayer.addTo(map)`
3. Add to layer control: `layerControl.addOverlay(newLayer, "Label")`
4. Update overlay listener for lazy-loading if needed

### Modifying Object Appearance
- Edit layer styles in `amap.vue` where features are created
- Polygon style: `L.polygon(..., { color, opacity, fillOpacity })`
- Marker cluster options: Search `L.markerClusterGroup({...})`
- CSS overrides available in `assets/css/main.css`

### Adding New Search Provider
1. Create class in `utils/` extending SearchProvider interface
2. Implement `search(query)` method returning Promise
3. Return results matching format: `{ x, y, label, bounds, raw }`
4. Register in AddressSearch component

### Editing Bitrix24 Field References
- GeoJSON storage field: `ufCrm33_1705393860`
- Smart Process stages checked against `SUCCESS` and `FAIL` constants
- Update composables/bitrix24.js if field IDs change

## Performance Considerations

1. **Marker Clustering:** Enabled for all point layers (handles 10k+ points)
2. **Lazy Loading:** Completed objects load only when user toggles layer visibility
3. **Debouncing:** Address search uses 300ms debounce
4. **Layer Indexing:** Search index rebuilt after each data load
5. **Memory Cleanup:** Full resource disposal on component unmount

## Debugging Tips

- **Check B24Frame:** `console.log(b24Instance)` after initialization
- **Layer Visibility:** Toggle layers in map control to diagnose rendering
- **API Responses:** Check Network tab for third-party API calls (Userside, UTM5)
- **Geometry Issues:** Use Leaflet popup `bindPopup(L.geoJSON(...))` to inspect GeoJSON
- **Search Performance:** Monitor search index size in Console

## Common Issues & Fixes

**Issue:** Geometries not saving
- Check: Is Bitrix24 auth valid? Is Smart Process 139 accessible?
- Fix: Verify access_token in browser DevTools Application tab

**Issue:** Markers not clustered
- Check: Are points being added to correct layer group?
- Fix: Ensure layer group passed to `L.markerClusterGroup()`

**Issue:** Address search returns no results
- Check: Is DaData token valid? (set in env)
- Fix: Verify `public.dadataToken` in nuxt.config.ts

**Issue:** Slider doesn't open
- Check: Is Bitrix24 slider API available? (`b24Instance.slider`)
- Fix: Ensure widget is embedded in Bitrix24 frame

## Environment Variables

Configured in `.env` and `nuxt.config.ts`:
- `VITE_SUPABASE_URL` - Database URL (if using Supabase)
- `VITE_SUPABASE_ANON_KEY` - Database auth key
- `PUBLIC_DADATA_TOKEN` - DaData API token
- `PUBLIC_YANDEX_MAP_API_KEY` - Yandex Maps API key
- `PUBLIC_US_BASE_URL` - Userside API endpoint
- `PUBLIC_UTM5_BASE_URL` - UTM5 API endpoint

## Future Enhancement Opportunities

1. **Offline Mode:** Cache layers using IndexedDB
2. **Real-time Sync:** WebSocket integration for multi-user editing
3. **Advanced Filtering:** Date range, stage, owner filters
4. **Batch Operations:** Multi-select objects for bulk updates
5. **Heat Maps:** Visualize customer density or coverage gaps
6. **Geofencing:** Alert on boundary changes
7. **Import/Export:** GeoJSON upload/download functionality
8. **Mobile Optimization:** Touch-friendly controls for field work
