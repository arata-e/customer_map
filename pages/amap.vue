<template>
  <div class="map-container">
    <div v-if="!mapReady" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
    <div id="map" ref="mapElement" :style="{ opacity: mapReady ? 1 : 0 }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mapElement = ref(null)
const mapReady = ref(false)
const loadingMessage = ref('Инициализация...')

let b24Instance = null
let map = null
let L = null

onMounted(async () => {
  try {
    loadingMessage.value = 'Подключение к Bitrix24...'

    if (process.client) {
      console.log('Initializing B24Frame...')
      const { initializeB24Frame, LoggerBrowser } = await import('@bitrix24/b24jssdk')

      b24Instance = await initializeB24Frame()

      b24Instance.setLogger(
        LoggerBrowser.build('MapWidget')
      )

      console.log('B24Frame initialized')
      console.log('Placement info:', b24Instance.getTargetOrigin())
      console.log('Auth data:', b24Instance.auth.getAuthData())
    }

    loadingMessage.value = 'Загрузка карты...'
    const geoSearchModules = await loadLeaflet()

    loadingMessage.value = 'Настройка карты...'
    await initializeMap(geoSearchModules)

    mapReady.value = true
  } catch (error) {
    console.error('Ошибка инициализации:', error)
    loadingMessage.value = 'Ошибка загрузки карты'
  }
})

async function loadLeaflet() {
  if (process.client) {
    L = await import('leaflet')
    await import('leaflet.markercluster')
    await import('@geoman-io/leaflet-geoman-free')
    const { GeoSearchControl, OpenStreetMapProvider } = await import('leaflet-geosearch')
    return { GeoSearchControl, OpenStreetMapProvider }
  }
  return null
}

async function initializeMap(geoSearchModules) {
  if (!mapElement.value || !L) return

  map = L.map(mapElement.value, {
    center: [55.7558, 37.6173],
    zoom: 13
  })

  map.on('contextmenu', (e) => {
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`
        <div style="text-align: center;">
          <button onclick="window.createPointAtLocation(${e.latlng.lat}, ${e.latlng.lng})"
                  style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; cursor: pointer;">
            Создать точку
          </button>
          <button onclick="window.createPolygonAtLocation(${e.latlng.lat}, ${e.latlng.lng})"
                  style="display: block; width: 100%; padding: 8px; cursor: pointer;">
            Создать полигон
          </button>
        </div>
      `)
      .openOn(map)
  })

  const googleStreet = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google',
    maxZoom: 20,
    pmIgnore: true
  })

  const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google',
    maxZoom: 20,
    pmIgnore: true
  })

  const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    pmIgnore: true
  })

  openStreetMap.addTo(map)

  const baseLayers = {
    'Google Street': googleStreet,
    'Google Hybrid': googleHybrid,
    'OpenStreetMap': openStreetMap
  }

  L.control.layers(baseLayers).addTo(map)

  if (geoSearchModules) {
    const { GeoSearchControl, OpenStreetMapProvider } = geoSearchModules
    const provider = new OpenStreetMapProvider()

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Введите адрес'
    })

    map.addControl(searchControl)
  }

  map.pm.addControls({
    position: 'topleft',
    drawMarker: true,
    drawPolygon: true,
    drawPolyline: false,
    drawCircle: false,
    drawCircleMarker: false,
    drawRectangle: true,
    editMode: true,
    dragMode: true,
    cutPolygon: false,
    removalMode: true
  })

  setupMapEvents()
}

function setupMapEvents() {
  map.on('pm:create', async (e) => {
    console.log('Создан объект:', e.shape, e.layer)
  })

  map.on('pm:edit', async (e) => {
    console.log('Изменен объект:', e.layer)
  })

  map.on('pm:remove', async (e) => {
    console.log('Удален объект:', e.layer)
  })
}

if (process.client) {
  window.createPointAtLocation = (lat, lng) => {
    console.log('Создать точку в координатах:', lat, lng)
    if (map) map.closePopup()
  }

  window.createPolygonAtLocation = (lat, lng) => {
    console.log('Создать полигон от координат:', lat, lng)
    if (map) map.closePopup()
  }
}

function getB24AuthData() {
  if (!b24Instance) return null

  const auth = b24Instance.auth.getAuthData()
  return {
    domain: auth.domain || '',
    member_id: auth.member_id || '',
    access_token: auth.access_token || '',
    refresh_token: auth.refresh_token || '',
    expires_in: auth.expires_in || 0
  }
}

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }

  if (b24Instance) {
    b24Instance.destroy()
    b24Instance = null
  }
})
</script>

<style>
@import 'leaflet-geosearch/dist/geosearch.css';
</style>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#map {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066cc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
  font-size: 14px;
}
</style>
