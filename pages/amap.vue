<template>
  <div class="map-container">
    <div v-if="!mapReady" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
    <div id="map" ref="mapElement" :style="{ opacity: mapReady ? 1 : 0 }"></div>
    <AddressSearch
      v-if="mapReady"
      :dadata-token="dadataToken"
      @address-selected="onAddressSelected"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AddressSearch from '~/components/AddressSearch.vue'

const mapElement = ref(null)
const mapReady = ref(false)
const loadingMessage = ref('Инициализация...')
const dadataToken = import.meta.env.VITE_DADATA_TOKEN

let b24Instance = null
let map = null
let L = null
let searchMarker = null
let polygonLayer = null
let endpolygonLayer = null

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
  }
  return null
}

async function initializeMap(geoSearchModules) {
  if (!mapElement.value || !L) return

  map = L.map(mapElement.value, {
    center: [55.80205657605603, 37.75009144921874],
    zoom: 9
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

  polygonLayer = L.geoJSON(null, {
    pmIgnore: false,
    style: {
      color: '#3388ff',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.4
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        const popupContent = `
          <div>
            <strong>${feature.properties.title || 'Без названия'}</strong><br>
            ${feature.properties.description || ''}<br>
            <small>ID: ${feature.properties.id}</small>
          </div>
        `
        layer.bindPopup(popupContent)
      }
    }
  })

  endpolygonLayer = L.geoJSON(null, {
    pmIgnore: false,
    style: {
      color: '#888888',
      weight: 2,
      opacity: 0.5,
      fillOpacity: 0.2
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        const popupContent = `
          <div>
            <strong>${feature.properties.title || 'Без названия'}</strong><br>
            ${feature.properties.description || ''}<br>
            <small>ID: ${feature.properties.id}</small>
          </div>
        `
        layer.bindPopup(popupContent)
      }
    }
  })

  polygonLayer.addTo(map)
  endpolygonLayer.addTo(map)

  const baseLayers = {
    'Google Street': googleStreet,
    'Google Hybrid': googleHybrid,
    'OpenStreetMap': openStreetMap
  }

  const overlayLayers = {
    'Полигоны в работе': polygonLayer,
    'Обработанные полигоны': endpolygonLayer
  }

  L.control.layers(baseLayers, overlayLayers).addTo(map)

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
  await loadPolygons()
}

async function loadPolygons() {
  if (!b24Instance || !polygonLayer || !endpolygonLayer) return

  try {
    loadingMessage.value = 'Загрузка полигонов...'
    const { getPolygons } = useBitrix24()
    const polygons = await getPolygons(b24Instance)

    console.log('Загружено полигонов:', polygons.length)

    polygons.forEach(item => {
      if (!item.ufCrm33_1705393860) return

      try {
        const feature = {
          type: 'Feature',
          properties: {
            title: item.title,
            description: item.ufCrm33_1705393848,
            id: item.id,
            type: 'smart',
            stageId: item.stageId,
            searchfield: item.id + '-' + item.title
          },
          geometry: JSON.parse(item.ufCrm33_1705393860)
        }

        if (item.stageId === 'DT139_61:SUCCESS' || item.stageId === 'DT139_61:FAIL') {
          endpolygonLayer.addData(feature)
        } else {
          polygonLayer.addData(feature)
        }
      } catch (error) {
        console.error('Ошибка обработки полигона:', item.id, error)
      }
    })
  } catch (error) {
    console.error('Ошибка загрузки полигонов:', error)
  }
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

function onAddressSelected(addressData) {
  if (!map || !L) return

  if (searchMarker) {
    map.removeLayer(searchMarker)
  }

  const { lat, lng, label } = addressData

  searchMarker = L.marker([lat, lng]).addTo(map)
  searchMarker.bindPopup(label).openPopup()

  map.setView([lat, lng], 16, {
    animate: true
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
  if (searchMarker && map) {
    map.removeLayer(searchMarker)
    searchMarker = null
  }

  if (polygonLayer && map) {
    map.removeLayer(polygonLayer)
    polygonLayer = null
  }

  if (endpolygonLayer && map) {
    map.removeLayer(endpolygonLayer)
    endpolygonLayer = null
  }

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
