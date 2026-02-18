# Bitrix24 Map Widget for Userside

A sophisticated geospatial application that integrates Bitrix24 CRM with Userside ISP management and UTM5 billing systems. Provides field teams with an interactive map interface for planning service zones and managing customer locations.

## Features

- **Interactive Map Interface** - Leaflet-powered mapping with multiple basemap providers (Google, OpenStreetMap)
- **Real-time Geometry Editing** - Edit service zones (polygons) and customer points directly on the map using Leaflet-Geoman
- **Multi-Source Integration** - Seamlessly combines data from Bitrix24, Userside, and UTM5 systems
- **Smart Object Management** - Create, edit, delete, and search geographic objects with automatic Bitrix24 persistence
- **Address Search** - DaData-powered address autocomplete with map navigation
- **Efficient Clustering** - Handles large datasets with marker clustering and lazy-loading
- **Bitrix24 Slider Integration** - In-context editing of object details within Bitrix24
- **Four-Layer System** - Visual distinction between in-progress and completed zones/points

## Tech Stack

- **Framework:** Nuxt 4.2.1 + Vue 3.5.25
- **Mapping:** Leaflet 1.9.4 + Leaflet-Geoman + Marker Clustering
- **CRM:** Bitrix24 JavaScript SDK
- **Geocoding:** DaData (primary), Yandex Maps (fallback)
- **APIs:** Userside (network), UTM5 (billing)
- **Build:** Vite with Nuxt

## Quick Start

### Prerequisites
- Node.js 18+
- Bitrix24 account with widget embed capability
- DaData and Yandex Maps API keys
- Userside and UTM5 API endpoints

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Build

```bash
npm run build
```

## Project Structure

```
├── pages/
│   ├── index.vue              # Landing page with navigation
│   └── amap.vue               # Main map application
├── components/
│   ├── AddressSearch.vue      # Address autocomplete component
│   ├── ObjectSearch.vue       # Object search/filter component
│   └── ResetViewButton.vue    # Map reset control
├── composables/
│   ├── bitrix24.js            # Bitrix24 CRM API wrapper
│   ├── us-api.js              # Userside network API client
│   ├── utm5-api.js            # UTM5 billing API client
│   └── customers.js           # Customer data management
├── utils/
│   ├── dadata-provider.js     # DaData geocoding provider
│   └── yandex-provider.js     # Yandex Maps geocoding provider
└── assets/
    └── css/main.css           # Leaflet customization styles
```

## Core Functionality

### Object Types

**Polygons (Service Zones)**
- Category ID: 61
- Represents service coverage areas
- Display colors: Blue (in-progress), Gray (completed)

**Points (Customer Locations)**
- Category ID: 65
- Represents potential customer locations
- Display colors: Clustered by density (green/yellow/orange)

### Data Storage

Objects are stored as GeoJSON in Bitrix24 Smart Process 139:
- Geometry field: `ufCrm33_1705393860`
- Workflow stages: SUCCESS (in-progress), FAIL (completed)

### Key Workflows

**Creating an Object:**
1. Right-click on map
2. Select "Create Polygon" or "Create Point"
3. Draw geometry using Leaflet-Geoman tools
4. Enter object title in prompt
5. Object saved to Bitrix24 and slider opens for detailed editing

**Editing Geometry:**
1. Right-click object on map
2. Click "Edit" button
3. Modify vertices using Geoman tools
4. Right-click "Finish" button to save
5. Geometry automatically persisted to Bitrix24

**Searching Objects:**
- Address search: DaData integration (min 3 chars)
- Object search: Filter by ID or title (min 2 chars)

## Configuration

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
PUBLIC_DADATA_TOKEN=your_dadata_token
PUBLIC_YANDEX_MAP_API_KEY=your_yandex_key
PUBLIC_US_BASE_URL=your_userside_api_url
PUBLIC_UTM5_BASE_URL=your_utm5_api_url
```

## API Integration

### Bitrix24
- CRUD operations on Smart Process items
- Slider API for in-context editing
- Authentication via B24Frame

### Userside
- Network node locations
- Optical line infrastructure data
- Spatial queries by map bounds

### UTM5
- Customer records
- Services and billing information
- Spatial customer queries

## Documentation

See [AGENT.md](AGENT.md) for detailed technical documentation including:
- Composable reference guide
- Common development tasks
- Performance considerations
- Debugging tips
- Future enhancement opportunities

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires modern JavaScript features (ES6+, async/await).

## Performance

- Marker clustering for handling 10,000+ points
- Lazy-loading of completed object layers
- 300ms debounce on address search
- Efficient spatial queries to Userside and UTM5
- Full resource cleanup on component unmount

## Contributing

When modifying the application:

1. Follow existing code style and patterns
2. Keep components focused on single responsibility
3. Update AGENT.md if adding new features or APIs
4. Test map interactions thoroughly
5. Verify Bitrix24 integration before deploying

## License

Proprietary - Bitrix24 widget for internal use.

## Support

For issues and questions:
- Check AGENT.md for technical details
- Verify API keys and endpoints in `.env`
- Review browser DevTools Console for errors
- Test with valid Bitrix24 widget embed
