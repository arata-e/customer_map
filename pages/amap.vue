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
    <ObjectSearch
      v-if="mapReady"
      :objects="searchableObjects"
      @object-selected="onObjectSelected"
    />
    <ResetViewButton
      v-if="mapReady"
      @reset-view="resetMapView"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AddressSearch from '~/components/AddressSearch.vue'
import ObjectSearch from '~/components/ObjectSearch.vue'
import ResetViewButton from '~/components/ResetViewButton.vue'

const mapElement = ref(null)
const mapReady = ref(false)
const loadingMessage = ref('Инициализация...')
const dadataToken = import.meta.env.VITE_DADATA_TOKEN
const searchableObjects = ref([])

const INITIAL_CENTER = [55.80205657605603, 37.75009144921874]
const INITIAL_ZOOM = 8

const { $leaflet } = useNuxtApp()
let L = null

let b24Instance = null
let map = null
let searchMarker = null
let polygonLayer = null
let endpolygonLayer = null
let pointLayer = null
let endpointLayer = null

let endpolygonLoaded = false
let endpointLoaded = false

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

      loadingMessage.value = 'Загрузка карты...'
      L = $leaflet
      console.log('L.markerClusterGroup available:', typeof L.markerClusterGroup)
    }

    loadingMessage.value = 'Настройка карты...'
    await initializeMap()

    mapReady.value = true
  } catch (error) {
    console.error('Ошибка инициализации:', error)
    loadingMessage.value = 'Ошибка загрузки карты'
  }
})

async function initializeMap() {
  if (!mapElement.value || !L) return

  map = L.map(mapElement.value, {
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM
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
        setupLayerContextMenu(layer, polygonLayer)
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
        setupLayerContextMenu(layer, endpolygonLayer)
      }
    }
  })

  pointLayer = L.markerClusterGroup({
    pmIgnore: false
  })

  endpointLayer = L.markerClusterGroup({
    pmIgnore: false
  })

  polygonLayer.addTo(map)
  pointLayer.addTo(map)

  const baseLayers = {
    'Google Street': googleStreet,
    'Google Hybrid': googleHybrid,
    'OpenStreetMap': openStreetMap
  }

  const overlayLayers = {
    'Полигоны в работе': polygonLayer,
    'Обработанные полигоны': endpolygonLayer,
    'Точки в работе': pointLayer,
    'Обработанные точки': endpointLayer
  }

  L.control.layers(baseLayers, overlayLayers).addTo(map)

  map.on('overlayadd', (e) => {
    if (e.layer === endpolygonLayer && !endpolygonLoaded) {
      loadPolygonsDone()
    } else if (e.layer === endpointLayer && !endpointLoaded) {
      loadPointsDone()
    }
  })

  map.pm.addControls({
    position: 'bottomleft',
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
  await loadPoints()
}

async function loadPolygons() {
  if (!b24Instance || !polygonLayer) return

  try {
    loadingMessage.value = 'Загрузка полигонов...'
    const { getPolygons } = useBitrix24()
    const polygons = await getPolygons(b24Instance)

    console.log('Загружено полигонов в работе:', polygons.length)

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

        polygonLayer.addData(feature)
      } catch (error) {
        console.error('Ошибка обработки полигона:', item.id, error)
      }
    })

    updateSearchableObjects()
  } catch (error) {
    console.error('Ошибка загрузки полигонов:', error)
  }
}

async function loadPoints() {
  if (!b24Instance || !pointLayer) return

  try {
    loadingMessage.value = 'Загрузка точек...'
    const { getPoints } = useBitrix24()
    const points = await getPoints(b24Instance)

    console.log('Загружено точек в работе:', points.length)

    points.forEach(item => {
      if (!item.ufCrm33_1705393860) return

      try {
        const geometry = JSON.parse(item.ufCrm33_1705393860)

        if (geometry.type === 'Point' && geometry.coordinates) {
          const [lng, lat] = geometry.coordinates

          const popupContent = `
            <div>
              <strong>${item.title || 'Без названия'}</strong><br>
              ${item.ufCrm33_1705393848 || ''}<br>
              <small>ID: ${item.id}</small>
            </div>
          `

          const marker = L.marker([lat, lng])
          marker.bindPopup(popupContent)

          marker.feature = {
            properties: {
              id: item.id,
              title: item.title,
              description: item.ufCrm33_1705393848,
              type: 'smart',
              stageId: item.stageId,
              searchfield: item.id + '-' + item.title
            }
          }

          setupLayerContextMenu(marker, pointLayer)
          pointLayer.addLayer(marker)
        }
      } catch (error) {
        console.error('Ошибка обработки точки:', item.id, error)
      }
    })

    updateSearchableObjects()
  } catch (error) {
    console.error('Ошибка загрузки точек:', error)
  }
}

async function loadPolygonsDone() {
  if (!b24Instance || !endpolygonLayer || endpolygonLoaded) return

  endpolygonLoaded = true

  try {
    console.log('Загрузка обработанных полигонов...')
    const { getPolygonsDone } = useBitrix24()
    const polygons = await getPolygonsDone(b24Instance)

    console.log('Загружено обработанных полигонов:', polygons.length)

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

        endpolygonLayer.addData(feature)
      } catch (error) {
        console.error('Ошибка обработки обработанного полигона:', item.id, error)
      }
    })

    updateSearchableObjects()
  } catch (error) {
    console.error('Ошибка загрузки обработанных полигонов:', error)
  }
}

async function loadPointsDone() {
  if (!b24Instance || !endpointLayer || endpointLoaded) return

  endpointLoaded = true

  try {
    console.log('Загрузка обработанных точек...')
    const { getPointsDone } = useBitrix24()
    const points = await getPointsDone(b24Instance)

    console.log('Загружено обработанных точек:', points.length)

    points.forEach(item => {
      if (!item.ufCrm33_1705393860) return

      try {
        const geometry = JSON.parse(item.ufCrm33_1705393860)

        if (geometry.type === 'Point' && geometry.coordinates) {
          const [lng, lat] = geometry.coordinates

          const popupContent = `
            <div>
              <strong>${item.title || 'Без названия'}</strong><br>
              ${item.ufCrm33_1705393848 || ''}<br>
              <small>ID: ${item.id}</small>
            </div>
          `

          const marker = L.marker([lat, lng], { opacity: 0.5 })
          marker.bindPopup(popupContent)

          marker.feature = {
            properties: {
              id: item.id,
              title: item.title,
              description: item.ufCrm33_1705393848,
              type: 'smart',
              stageId: item.stageId,
              searchfield: item.id + '-' + item.title
            }
          }

          setupLayerContextMenu(marker, endpointLayer)
          endpointLayer.addLayer(marker)
        }
      } catch (error) {
        console.error('Ошибка обработки обработанной точки:', item.id, error)
      }
    })

    updateSearchableObjects()
  } catch (error) {
    console.error('Ошибка загрузки обработанных точек:', error)
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

function updateSearchableObjects() {
  const objects = []

  if (polygonLayer) {
    polygonLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const props = layer.feature.properties
        objects.push({
          id: props.id,
          title: props.title || 'Без названия',
          searchfield: props.searchfield,
          typeLabel: 'Полигон в работе',
          layer: layer,
          layerGroup: polygonLayer,
          type: 'polygon'
        })
      }
    })
  }

  if (endpolygonLayer) {
    endpolygonLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const props = layer.feature.properties
        objects.push({
          id: props.id,
          title: props.title || 'Без названия',
          searchfield: props.searchfield,
          typeLabel: 'Полигон обработан',
          layer: layer,
          layerGroup: endpolygonLayer,
          type: 'polygon'
        })
      }
    })
  }

  if (pointLayer) {
    pointLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const props = layer.feature.properties
        objects.push({
          id: props.id,
          title: props.title || 'Без названия',
          searchfield: props.searchfield,
          typeLabel: 'Точка в работе',
          layer: layer,
          layerGroup: pointLayer,
          type: 'point'
        })
      }
    })
  }

  if (endpointLayer) {
    endpointLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const props = layer.feature.properties
        objects.push({
          id: props.id,
          title: props.title || 'Без названия',
          searchfield: props.searchfield,
          typeLabel: 'Точка обработана',
          layer: layer,
          layerGroup: endpointLayer,
          type: 'point'
        })
      }
    })
  }

  searchableObjects.value = objects
}

function onObjectSelected(obj) {
  if (!map || !obj.layer) return

  if (!map.hasLayer(obj.layerGroup)) {
    map.addLayer(obj.layerGroup)
  }

  if (obj.type === 'polygon') {
    const bounds = obj.layer.getBounds()
    map.fitBounds(bounds, { padding: [50, 50] })
    obj.layer.openPopup()
  } else if (obj.type === 'point') {
    const latlng = obj.layer.getLatLng()
    map.setView(latlng, 16, { animate: true })
    obj.layer.openPopup()
  }
}

function resetMapView() {
  if (!map) return

  map.setView(INITIAL_CENTER, INITIAL_ZOOM, {
    animate: true,
    duration: 0.5
  })
}

function setupLayerContextMenu(layer, parentLayer) {
  layer.on('contextmenu', (e) => {
    L.DomEvent.stopPropagation(e)

    if (!layer.feature || !layer.feature.properties) return

    const itemId = layer.feature.properties.id

    const popup = L.popup()
      .setLatLng(e.latlng)
      .setContent(`
        <div style="text-align: center;">
          <button onclick="window.openObjectInSlider(${itemId})"
                  style="display: block; width: 100%; padding: 8px; cursor: pointer; background: #0066cc; color: white; border: none; border-radius: 4px;">
            Открыть
          </button>
        </div>
      `)
      .openOn(map)
  })
}

async function openObjectInSlider(itemId) {
  if (!b24Instance || !map) return

  map.closePopup()

  try {
    const sliderClosed = new Promise((resolve) => {
      b24Instance.slider.openPath(
        b24Instance.slider.getUrl((`/crm/type/139/details/${itemId}/`)),
        () => {
          resolve()
        }
      )
    })

    await sliderClosed

    await refreshObjectOnMap(itemId)
  } catch (error) {
    console.error('Ошибка при работе со слайдером:', error)
  }
}

async function refreshObjectOnMap(itemId) {
  const { getItem, POLYGON_TYPE_ID, POINT_TYPE_ID } = useBitrix24()

  try {
    const item = await getItem(b24Instance, itemId)

    if (!item) {
      console.error('Объект не найден:', itemId)
      return
    }

    removeObjectFromAllLayers(itemId)

    const isPolygon = item.categoryId === POLYGON_TYPE_ID
    const isPoint = item.categoryId === POINT_TYPE_ID

    if (!item.ufCrm33_1705393860) {
      console.log('Объект не имеет геометрии')
      updateSearchableObjects()
      return
    }

    const isDone = item.stageId === 'DT139_61:SUCCESS' ||
                   item.stageId === 'DT139_61:FAIL' ||
                   item.stageId === 'DT139_65:SUCCESS' ||
                   item.stageId === 'DT139_65:FAIL'

    if (isPolygon) {
      const targetLayer = isDone ? endpolygonLayer : polygonLayer

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

      targetLayer.addData(feature)

      targetLayer.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties.id === item.id) {
          setupLayerContextMenu(layer, targetLayer)
        }
      })
    } else if (isPoint) {
      const geometry = JSON.parse(item.ufCrm33_1705393860)

      if (geometry.type === 'Point' && geometry.coordinates) {
        const [lng, lat] = geometry.coordinates
        const targetLayer = isDone ? endpointLayer : pointLayer

        const popupContent = `
          <div>
            <strong>${item.title || 'Без названия'}</strong><br>
            ${item.ufCrm33_1705393848 || ''}<br>
            <small>ID: ${item.id}</small>
          </div>
        `

        const marker = L.marker([lat, lng], { opacity: isDone ? 0.5 : 1 })
        marker.bindPopup(popupContent)

        marker.feature = {
          properties: {
            id: item.id,
            title: item.title,
            description: item.ufCrm33_1705393848,
            type: 'smart',
            stageId: item.stageId,
            searchfield: item.id + '-' + item.title
          }
        }

        setupLayerContextMenu(marker, targetLayer)
        targetLayer.addLayer(marker)
      }
    }

    updateSearchableObjects()
  } catch (error) {
    console.error('Ошибка обновления объекта на карте:', error)
  }
}

function removeObjectFromAllLayers(itemId) {
  const layers = [polygonLayer, endpolygonLayer, pointLayer, endpointLayer]

  layers.forEach(layer => {
    if (!layer) return

    if (layer.eachLayer) {
      layer.eachLayer((sublayer) => {
        if (sublayer.feature && sublayer.feature.properties.id === itemId) {
          layer.removeLayer(sublayer)
        }
      })
    }
  })
}

if (process.client) {
  window.openObjectInSlider = openObjectInSlider
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

  if (pointLayer && map) {
    pointLayer.clearLayers()
    map.removeLayer(pointLayer)
    pointLayer = null
  }

  if (endpointLayer && map) {
    endpointLayer.clearLayers()
    map.removeLayer(endpointLayer)
    endpointLayer = null
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
